<template>
  <div :class="cls.e('list-wrap')">
    <UScroll
      :class="cls.e('list')"
      ref="scrollRef"
      always
      @scroll="handleScroll"
      @wheel.passive="handleWheel"
    >
      <template v-for="turn in turns" :key="turn.key">
        <MessageItem
          v-if="turn.userMsg"
          :message="turn.userMsg"
          :is-last="false"
          :renderer-props="rendererProps"
          @respond="(id, approved) => emit('respond', id, approved)"
          @regenerate="emit('regenerate')"
        />

        <!-- 最终答案开始输出后，本轮之前的思考/工具调用过程收进「已完成」折叠块 -->
        <TurnProcess
          v-if="turn.processCollapsed"
          :messages="turn.processMsgs"
          :renderer-props="rendererProps"
          @respond="(id, approved) => emit('respond', id, approved)"
        />
        <template v-else>
          <MessageItem
            v-for="msg in turn.processMsgs"
            :key="msg.id"
            :message="msg"
            :is-last="false"
            :renderer-props="rendererProps"
            @respond="(id, approved) => emit('respond', id, approved)"
            @regenerate="emit('regenerate')"
          />
        </template>

        <MessageItem
          v-if="turn.answerMsg"
          :message="turn.answerMsg"
          :is-last="turn.isLast"
          :renderer-props="rendererProps"
          @respond="(id, approved) => emit('respond', id, approved)"
          @regenerate="emit('regenerate')"
        />
      </template>

      <!-- 工作中：活体球从输入框上方跳到最新会话下面；结束停留后再跳回 -->
      <div v-if="showWorking" :class="[cls.e('working'), bem.is('leaving', workingLeaving)]">
        <UAiOrb ref="workingOrb" :size="ORB_SIZE" :status="workingOrbStatus" />
        <span v-if="running" :class="[cls.e('working-text'), 'u-shine']">工作中…</span>
      </div>
    </UScroll>

    <!-- 空闲：始终钉在滚动容器外、输入框上方；工作开始时缩小离开、结束后放大回来 -->
    <div
      v-if="showIdleWelcome"
      :class="[cls.e('welcome'), bem.is('leaving', idleLeaving), bem.is('enter', idleEnter)]"
    >
      <slot name="welcome">
        <div :class="cls.e('welcome-inner')">
          <UAiOrb :size="ORB_SIZE" @click="cycleWelcome" />
          <!-- 快捷提问逐条展示在球右侧并自动轮换：点文案发送，点球立即换下一条。
               固定锚点布局：球位置钉死不动，气泡只向右延展，避免轮换时水平瞬移 -->
          <div v-if="welcomeItems.length" :class="cls.e('welcome-item-wrap')">
            <Transition :name="cls.em('welcome', 'swap')" mode="out-in">
              <button
                v-if="currentWelcomeItem"
                :key="welcomeIndex"
                type="button"
                :class="cls.e('welcome-item')"
                @click="emit('welcome-click', currentWelcomeItem)"
              >
                {{ currentWelcomeItem }}
              </button>
            </Transition>
          </div>
        </div>
      </slot>
    </div>

    <!-- 用户上翻浏览时悬浮入口：一键回到最新消息 -->
    <Transition :name="cls.em('to-latest', 'fade')">
      <button v-if="showToLatest" type="button" :class="cls.e('to-latest')" @click="scrollToLatest">
        <UIcon><ArrowDown /></UIcon>
        <span>最新消息</span>
      </button>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { UIcon, UScroll } from '@veltra/desktop'
import type { ScrollPosition } from '@veltra/desktop'
import { ArrowDown } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  useTemplateRef,
  watch
} from 'vue'

import type { ChatMessage } from '../../chat/types'
import type { AiOrbExposed, AiOrbReaction, AiOrbStatus } from '../../types/ai-orb'
import UAiOrb from '../ai-orb/ai-orb.vue'
import { AiChatDIKey } from './di'
import MessageItem from './message-item.vue'
import TurnProcess from './turn-process.vue'

defineOptions({ name: 'UAiChatMessageList' })

/** 空闲欢迎 / 工作指示共用活体球直径（px） */
const ORB_SIZE = 48
/** 生成结束 / 失败后工作球停留再跳回输入框上方 */
const WORKING_LINGER_MS = 2500
/** 两处活体球对向缩放的时长（与样式中的 jump 过渡一致） */
const JUMP_MS = 380

const props = defineProps<{
  messages: ChatMessage[]
  /** 空闲时输入框上方的快捷提问；字符串按单项处理 */
  welcome?: string | string[]
  /** 是否生成中（控制底部工作状态指示） */
  running?: boolean
  /** 透传给 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'respond', toolCallId: string, approved: boolean): void
  (e: 'regenerate'): void
  /** 点击欢迎项（快捷提问） */
  (e: 'welcome-click', text: string): void
}>()

defineSlots<{
  /** 空闲欢迎区插槽（输入框上方；工作中跳到列表末尾） */
  welcome(): any
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** tool 消息不单独渲染，其内容体现在工具卡片的结果区 */
const visibleMessages = computed(() => props.messages.filter((msg) => msg.role !== 'tool'))

/** 一轮对话：以 user 消息为界，含本轮全部 assistant 消息（每次工具循环产生一条） */
interface ChatTurn {
  /** 轮次 key（取用户消息或首条 assistant 消息 id） */
  key: string
  userMsg?: ChatMessage
  /** 最终答案之前的过程消息（思考 + 中间文本 + 工具卡片） */
  processMsgs: ChatMessage[]
  /** 本轮最终答案（最后一条 assistant 消息） */
  answerMsg?: ChatMessage
  /** 过程消息是否收进「已完成」折叠块 */
  processCollapsed: boolean
  /** answerMsg 是否为全局最后一条可见消息 */
  isLast: boolean
}

const isFinalStatus = (msg?: ChatMessage) =>
  msg?.status === 'done' || msg?.status === 'error' || msg?.status === 'aborted'

const turns = computed<ChatTurn[]>(() => {
  const grouped: { key: string; userMsg?: ChatMessage; assistants: ChatMessage[] }[] = []
  for (const msg of visibleMessages.value) {
    if (msg.role === 'user') {
      grouped.push({ key: msg.id, userMsg: msg, assistants: [] })
      continue
    }
    const last = grouped[grouped.length - 1]
    // 兼容 assistant 开头的历史会话：归入无用户消息的轮次
    if (last) last.assistants.push(msg)
    else grouped.push({ key: msg.id, assistants: [msg] })
  }
  return grouped.map((turn, index) => {
    const processMsgs = turn.assistants.slice(0, -1)
    const answerMsg = turn.assistants[turn.assistants.length - 1]
    const isLastTurn = index === grouped.length - 1
    // 该轮结束（非最后一轮 / 答案进入终态）或最终答案开始输出时折叠过程。
    // content 只增不减，折叠后不会回弹；regenerate 删除本轮 assistant 重跑，条件自然复位
    const processCollapsed =
      processMsgs.length > 0 &&
      (!isLastTurn || !!answerMsg?.content || (!props.running && isFinalStatus(answerMsg)))
    return {
      key: turn.key,
      userMsg: turn.userMsg,
      processMsgs,
      answerMsg,
      processCollapsed,
      isLast: isLastTurn && !!answerMsg
    }
  })
})

const welcomeItems = computed(() => {
  const welcome = props.welcome
  if (!welcome) return []
  return (Array.isArray(welcome) ? welcome : [welcome]).filter(Boolean)
})

/** 欢迎语逐条轮换：当前展示项的下标 */
const welcomeIndex = ref(0)

/** 当前展示的欢迎语 */
const currentWelcomeItem = computed(() => {
  const items = welcomeItems.value
  return items.length ? items[welcomeIndex.value % items.length] : undefined
})

let welcomeTimer: ReturnType<typeof setInterval> | undefined

const stopWelcomeRotation = () => {
  clearInterval(welcomeTimer)
  welcomeTimer = undefined
}

const startWelcomeRotation = () => {
  stopWelcomeRotation()
  if (welcomeItems.value.length > 1) {
    welcomeTimer = setInterval(() => {
      welcomeIndex.value += 1
    }, 4000)
  }
}

/** 点击欢迎球：不等自动轮换，立即换下一条，并重置计时 */
const cycleWelcome = () => {
  if (welcomeItems.value.length <= 1) return
  welcomeIndex.value += 1
  startWelcomeRotation()
}

/** 回答完毕 / 失败后工作球短暂停留，播完表情再跳回输入框上方 */
const finishing = ref(false)
/** 列表中的球正在缩小离开 */
const workingLeaving = ref(false)
/** 输入框上方的球正在缩小离开 */
const idleLeaving = ref(false)
/** 输入框上方的球从工作位放大回来（首屏出现不播） */
const idleEnter = ref(false)

let finishTimer: ReturnType<typeof setTimeout> | undefined
let jumpTimer: ReturnType<typeof setTimeout> | undefined

const clearJumpTimers = () => {
  clearTimeout(finishTimer)
  clearTimeout(jumpTimer)
}

/** 列表末尾的工作球：生成中 / 收尾停留 / 跳回过渡 */
const showWorking = computed(() => !!(props.running || finishing.value || workingLeaving.value))
/** 输入框上方的空闲欢迎：含工作开始时的缩小离开帧 */
const showIdleWelcome = computed(() => (!props.running && !finishing.value) || idleLeaving.value)

const workingOrbRef = useTemplateRef<AiOrbExposed>('workingOrb')

/** 工具调用失败的 id 去重集合：同一次失败只播一次沮丧表情 */
const reactedToolErrorIds = new Set<string>()

const toolErrorIds = computed(() => {
  const ids: string[] = []
  for (const msg of props.messages) {
    if (msg.role !== 'assistant' || !msg.toolCalls) continue
    for (const call of msg.toolCalls) {
      if (call.status === 'error') ids.push(call.id)
    }
  }
  return ids
})

// 工具调用失败 → 工作球闭眼摇头（frustrated）
watch(toolErrorIds, (ids) => {
  for (const id of ids) {
    if (reactedToolErrorIds.has(id)) continue
    reactedToolErrorIds.add(id)
    workingOrbRef.value?.react('frustrated')
  }
})

/** 工作球状态：收尾停留 → idle；正文输出中 → speaking；其余生成阶段 → thinking */
const workingOrbStatus = computed<AiOrbStatus>(() => {
  if (finishing.value) return 'idle'
  const last = visibleMessages.value[visibleMessages.value.length - 1]
  if (last?.role === 'assistant' && last.status === 'streaming' && last.content) {
    return 'speaking'
  }
  return 'thinking'
})

watch(
  () => props.running,
  (running, prev) => {
    if (running) {
      // 工作开始：立即从输入框上方跳到列表，无停留
      clearJumpTimers()
      const idleWasVisible = !prev && !finishing.value && !workingLeaving.value
      finishing.value = false
      workingLeaving.value = false
      idleEnter.value = false
      if (idleWasVisible) {
        idleLeaving.value = true
        jumpTimer = setTimeout(() => {
          idleLeaving.value = false
        }, JUMP_MS)
      } else {
        idleLeaving.value = false
      }
      return
    }
    if (!prev) return

    // 清除会话后列表已空：跳过结束停留，立刻回到欢迎区
    if (visibleMessages.value.length === 0) {
      finishing.value = false
      workingLeaving.value = false
      idleLeaving.value = false
      idleEnter.value = false
      return
    }

    finishing.value = true
    idleLeaving.value = false
    const last = visibleMessages.value[visibleMessages.value.length - 1]
    let reaction: AiOrbReaction | undefined
    if (last?.role === 'assistant') {
      if (last.status === 'done') reaction = 'happy'
      else if (last.status === 'error') reaction = 'frustrated'
    }
    if (reaction) {
      nextTick(() => workingOrbRef.value?.react(reaction))
    }
    // 停留结束 → 列表中缩小、输入框上方放大
    finishTimer = setTimeout(() => {
      finishing.value = false
      workingLeaving.value = true
      idleEnter.value = true
      jumpTimer = setTimeout(() => {
        workingLeaving.value = false
        idleEnter.value = false
      }, JUMP_MS)
    }, WORKING_LINGER_MS)
  }
)

// 消息被清空（clear）：立刻收掉工作球，欢迎区恢复
watch(
  () => visibleMessages.value.length,
  (len) => {
    if (len > 0) return
    clearJumpTimers()
    finishing.value = false
    workingLeaving.value = false
    idleLeaving.value = false
    idleEnter.value = false
  }
)

// 空闲欢迎区展示期间自动轮换；跳到工作位后停止
watch(
  () => [welcomeItems.value.length, showIdleWelcome.value] as const,
  () => {
    if (showIdleWelcome.value) startWelcomeRotation()
    else stopWelcomeRotation()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopWelcomeRotation()
  clearJumpTimers()
})

const scrollRef = shallowRef<{ scrollTo: (position: ScrollPosition) => void }>()
/** 是否吸附底部（用户上翻浏览历史时取消吸附） */
const stickToBottom = ref(true)
/** 上一次滚动位置：用于区分用户上翻与自动吸底触发的 scroll 事件 */
let lastScrollY = 0

/** 上翻阅读时展示「最新消息」悬浮按钮 */
const showToLatest = computed(() => !stickToBottom.value && visibleMessages.value.length > 0)

const handleScroll = (position: Required<ScrollPosition>) => {
  const atBottom = position.sh - position.ch - position.y < 60
  if (atBottom) {
    stickToBottom.value = true
  } else if (position.y < lastScrollY) {
    // 只有「向上滚」才算用户离开底部的意图：自动吸底的 scroll 事件可能滞后于
    // 流式内容增长（sh 已变大、y 仍是旧底部），按位置判断会误判成未吸底
    stickToBottom.value = false
  }
  lastScrollY = position.y
}

/**
 * 用户向上滚动轮 = 明确的离开底部意图，立即取消吸附。
 * 不能等 scroll 事件再按方向判断：流式期间每个 chunk 都会排一次吸底滚动，
 * 滞后的 scrollTo 会把用户拉回底部并触发 atBottom 重新吸附，导致「上滚动不了」
 */
const handleWheel = (e: WheelEvent) => {
  if (e.deltaY < 0) stickToBottom.value = false
}

/** 点击悬浮按钮：恢复吸附并回到底部 */
const scrollToLatest = async () => {
  stickToBottom.value = true
  await nextTick()
  scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
}

// 消息数量或流式内容变化时，若处于吸附状态则滚动到底部
watch(
  () => {
    const list = visibleMessages.value
    const last = list[list.length - 1]
    return [
      list.length,
      last?.content.length ?? 0,
      last?.reasoning?.length ?? 0,
      last?.toolCalls?.length ?? 0,
      props.running
    ].join('|')
  },
  async () => {
    // 用户刚发出消息时强制回到底部（无论之前是否在上翻）
    const list = visibleMessages.value
    if (list[list.length - 1]?.role === 'user') stickToBottom.value = true
    if (!stickToBottom.value) return
    await nextTick()
    // 等待 DOM 更新期间用户可能已上滚，滚动前重新确认吸附状态，避免把用户拉回底部
    if (!stickToBottom.value) return
    scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
  }
)

let trailingScrollTimer: ReturnType<typeof setTimeout> | undefined

// 生成收尾时动作区出现 / markdown 终态渲染 / 思考块折叠会再次改变高度，
// 同帧滚动可能够不到最终底部，追加一次延迟兜底滚动
watch(
  () => props.running,
  async (running) => {
    if (running) return
    clearTimeout(trailingScrollTimer)
    if (!stickToBottom.value) return
    await nextTick()
    if (!stickToBottom.value) return
    scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
    trailingScrollTimer = setTimeout(() => {
      if (stickToBottom.value) scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
    }, 150)
  }
)

onBeforeUnmount(() => clearTimeout(trailingScrollTimer))
</script>
