<template>
  <div :class="cls.e('list-wrap')">
    <UScroll
      :class="cls.e('list')"
      :content-class="cls.e('list-content')"
      ref="scrollRef"
      @scroll="handleScroll"
      @wheel.passive="handleWheel"
    >
      <template v-for="turn in turns" :key="turn.key">
        <!-- 轮次容器：导航指示器按 data-turn 定位与跳转，本身不产生视觉影响 -->
        <div :data-turn="turn.key">
          <MessageItem
            v-if="turn.userMsg"
            :message="turn.userMsg"
            :is-last="false"
            :renderer-props="rendererProps"
            @regenerate="emit('regenerate')"
          />

          <!-- 过程按文字回答切段：每段一个步骤行 + 段末回答；出现文字回答该段即闭合。
               段 key 优先取段内首步 key（段内天然稳定）：闭合瞬间首步 key 不变，
               段（含 StepLine 的展开状态）不会因首条 content 到达而重挂；content-only 段退回答 id -->
          <template
            v-for="(segment, segIndex) in turn.segments"
            :key="segment.steps[0]?.key ?? segment.answerMsg?.id ?? segIndex"
          >
            <StepLine
              v-if="segment.steps.length"
              :steps="segment.steps"
              :live="turn.live && segIndex === turn.segments.length - 1 && !segment.answerMsg"
              :end-status="segIndex === turn.segments.length - 1 ? turn.tailEndStatus : undefined"
              @respond="(id, approved) => emit('respond', id, approved)"
            />
            <!-- reply 工具：自定义渲染作为消息块渲染在回复流，live 期间实时展示、落定后不折叠 -->
            <ReplyToolCard
              v-for="step in segment.replySteps"
              :key="step.key"
              :tool-call="step.toolCall"
              @respond="(approved) => emit('respond', step.toolCall!.id, approved)"
            />
            <MessageItem
              v-if="segment.answerMsg"
              :message="segment.answerMsg"
              :is-last="turn.isLast && turn.finalMsg === segment.answerMsg"
              :duration="
                turn.finalMsg === segment.answerMsg ? turnDurations.get(turn.key) : undefined
              "
              :renderer-props="rendererProps"
              @regenerate="emit('regenerate')"
            />
          </template>

          <!-- 末条消息无正文且终态为出错/中止：状态行与操作区的载体 -->
          <MessageItem
            v-if="turn.tailStatusMsg"
            :message="turn.tailStatusMsg"
            :is-last="turn.isLast"
            :duration="turnDurations.get(turn.key)"
            :renderer-props="rendererProps"
            @regenerate="emit('regenerate')"
          />
        </div>
      </template>

      <!-- 工作中：活体球从输入框上方跳到最新会话下面；结束停留后再跳回 -->
      <div v-if="showWorking" :class="[cls.e('working'), bem.is('leaving', workingLeaving)]">
        <UAiOrb ref="workingOrb" :size="ORB_SIZE" :status="workingOrbStatus" />
        <template v-if="running">
          <span :class="[cls.e('working-text'), 'u-shine']">工作中…</span>
          <span :class="cls.e('working-time')">{{ formatDuration(elapsedMs) }}</span>
        </template>
        <span v-else-if="lastTurnDuration != null" :class="cls.e('working-time')">
          用时 {{ formatDuration(lastTurnDuration) }}
        </span>
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
                :disabled="readonly"
                @click="!readonly && emit('welcome-click', currentWelcomeItem)"
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
      <button
        v-if="showToLatest"
        type="button"
        :class="cls.e('to-latest')"
        title="回到最新"
        @click="scrollToLatest"
      >
        <UIcon><ArrowDown /></UIcon>
      </button>
    </Transition>

    <!-- 会话导航：贴消息区左缘的刻度条，hover 展开目录，点击跳到该轮 -->
    <SessionNavigator
      :items="navigatorItems"
      :active-key="activeTurnKey"
      :scrollable="navigatorVisible"
      @jump="jumpToTurn"
    />
  </div>
</template>

<script lang="ts" setup>
import { useResizeObserver } from '@veltra/compositions'
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

import type { ChatMessage, ChatToolCall } from '../../chat/types'
import type { AiOrbExposed, AiOrbReaction, AiOrbStatus } from '../../types/ai-orb'
import UAiOrb from '../ai-orb/ai-orb.vue'
import { AiChatDIKey } from './di'
import { formatDuration } from './format-duration'
import MessageItem from './message-item.vue'
import type { NavigatorItem } from './navigator-item'
import ReplyToolCard from './reply-tool.vue'
import SessionNavigator from './session-navigator.vue'
import StepLine from './step-line.vue'
import { clipText } from './tool-format'
import type { TurnStep } from './turn-step'
import { useStickScroll } from './use-stick-scroll'

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
  /** 只读时欢迎语不可点击发送 */
  readonly?: boolean
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

/** renderTo: 'reply' 的调用：自定义渲染作为消息块进回复流（steps 中仍保留过程条目） */
const isReplyTool = (call: ChatToolCall) => di?.tools.value[call.name]?.renderTo === 'reply'

/** tool 消息不单独渲染，其内容体现在工具卡片的结果区 */
const visibleMessages = computed(() => props.messages.filter((msg) => msg.role !== 'tool'))

/** 一段：两次文字回答之间的全部步骤；出现文字回答即闭合该段 */
interface TurnSegment {
  steps: TurnStep[]
  /** renderTo: 'reply' 的工具步：渲染在回复流（步骤行之后、段末回答之前），不随步骤行折叠 */
  replySteps: TurnStep[]
  /** 段末文字回答（content 非空的消息） */
  answerMsg?: ChatMessage
}

/** 一轮对话：以 user 消息为界，assistant 过程按文字回答切成若干段 */
interface ChatTurn {
  /** 轮次 key（取用户消息或首条 assistant 消息 id） */
  key: string
  userMsg?: ChatMessage
  segments: TurnSegment[]
  /** 本轮最后一条 assistant 无 content 且已终态时的状态/操作载体 */
  tailStatusMsg?: ChatMessage
  /** 步骤行完成态摘要的终态标注（error / aborted；done 时为 undefined） */
  tailEndStatus?: 'error' | 'aborted'
  /** 末段（未闭合的开放段）是否 live（流式进行中，行内实时展示当前步骤） */
  live: boolean
  /** duration 与 is-last 的承载消息（最后一条 answerMsg 或 tailStatusMsg） */
  finalMsg?: ChatMessage
  /** finalMsg 是否为全局最后一条可见消息 */
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
    // 按流式顺序切段：思考归属当前段；出现文字回答即闭合该段、开启新段，
    // 其后的工具调用落进新段（同一条消息 content + toolCalls 会拆成两段）
    const segments: TurnSegment[] = []
    let current: TurnSegment = { steps: [], replySteps: [] }
    for (const msg of turn.assistants) {
      if (msg.reasoning) {
        current.steps.push({ key: `${msg.id}:reasoning`, kind: 'reasoning', message: msg })
      }
      if (msg.content) {
        current.answerMsg = msg
        segments.push(current)
        current = { steps: [], replySteps: [] }
      }
      for (const call of msg.toolCalls ?? []) {
        const step: TurnStep = { key: call.id, kind: 'tool', message: msg, toolCall: call }
        current.steps.push(step)
        if (isReplyTool(call)) current.replySteps.push(step)
      }
    }
    if (current.steps.length) segments.push(current)

    const isLastTurn = index === grouped.length - 1
    const lastMsg = turn.assistants[turn.assistants.length - 1]
    // 末段 live 判定沿用原折叠防抖思路：running 或末消息未进终态都算进行中——
    // 断连时 running 短暂变 false 但消息仍是 streaming，不会让行在「进行中 / 已完成」
    // 之间来回翻转；regenerate 删除本轮 assistant 重跑，条件自然复位
    const live = isLastTurn && (props.running || !isFinalStatus(lastMsg))
    // 末条消息无正文（terminal「UI 即答复」工具轮 / 出错 / 中止）：作为状态行与操作区
    // （重新生成）的载体渲染，MarkdownRender 因 content 为空不产出正文
    const tailStatusMsg =
      lastMsg && !lastMsg.content && isFinalStatus(lastMsg) ? lastMsg : undefined
    /** 步骤行完成态摘要的终态标注：仅出错/中止着危险色，done 走普通完成态 */
    const tailEndStatus =
      tailStatusMsg && (tailStatusMsg.status === 'error' || tailStatusMsg.status === 'aborted')
        ? tailStatusMsg.status
        : undefined
    const lastAnswer = segments.findLast((segment) => segment.answerMsg)?.answerMsg
    const finalMsg = tailStatusMsg ?? lastAnswer
    return {
      key: turn.key,
      userMsg: turn.userMsg,
      segments,
      tailStatusMsg,
      tailEndStatus,
      live,
      finalMsg,
      isLast: isLastTurn && !!finalMsg
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

/** 工作计时的起算时间戳（running 升起时记录） */
let workStartAt = 0
/** 进行中的已逝时长（100ms 跳动刷新） */
const elapsedMs = ref(0)
let tickTimer: ReturnType<typeof setInterval> | undefined

/** 各轮次总用时（key 同 turns；仅 live 轮次有，历史回放无计时数据） */
const turnDurations = shallowRef(new Map<string, number>())

const stopTick = () => {
  clearInterval(tickTimer)
  tickTimer = undefined
}

/** 收尾停留期间展示的末轮总用时 */
const lastTurnDuration = computed(() => {
  const last = turns.value[turns.value.length - 1]
  return last ? turnDurations.value.get(last.key) : undefined
})

/** 列表末尾的工作球：生成中 / 收尾停留 / 跳回过渡 */
const showWorking = computed(() => !!(props.running || finishing.value || workingLeaving.value))
/** 输入框上方的空闲欢迎：含工作开始时的缩小离开帧 */
const showIdleWelcome = computed(() => (!props.running && !finishing.value) || idleLeaving.value)

const workingOrbRef = useTemplateRef<AiOrbExposed>('workingOrb')

/** 工具调用失败的 id 去重集合：同一次失败只播一次沮丧表情 */
const reactedToolErrorIds = new Set<string>()

/** 工具调用失败的轻量指纹（错误数 + 最后一个错误 id）：流式期间消息数组逐事件更换，
 * 用指纹做 watch 源可以避免每个 delta 都分配/比较完整 id 列表 */
const toolErrorFingerprint = computed(() => {
  let count = 0
  let lastId = ''
  for (const msg of props.messages) {
    if (msg.role !== 'assistant' || !msg.toolCalls) continue
    for (const call of msg.toolCalls) {
      if (call.status === 'error') {
        count += 1
        lastId = call.id
      }
    }
  }
  return `${count}|${lastId}`
})

// 工具调用失败 → 工作球闭眼摇头（frustrated）；仅指纹变化时进回调，同一失败只 react 一次
watch(toolErrorFingerprint, () => {
  for (const msg of props.messages) {
    if (msg.role !== 'assistant' || !msg.toolCalls) continue
    for (const call of msg.toolCalls) {
      if (call.status !== 'error' || reactedToolErrorIds.has(call.id)) continue
      reactedToolErrorIds.add(call.id)
      workingOrbRef.value?.react('frustrated')
    }
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
      // 工作计时开始：100ms 跳动刷新已逝时长
      workStartAt = Date.now()
      elapsedMs.value = 0
      stopTick()
      tickTimer = setInterval(() => {
        elapsedMs.value = Date.now() - workStartAt
      }, 100)
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

    stopTick()
    // 记录本轮总用时（key 同 turns：regenerate 同 key 覆盖，队列接续各自计时）
    const lastTurn = turns.value[turns.value.length - 1]
    if (lastTurn) {
      const next = new Map(turnDurations.value)
      next.set(lastTurn.key, Date.now() - workStartAt)
      turnDurations.value = next
    }

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
    turnDurations.value = new Map()
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

const scrollRef = shallowRef<{
  scrollTo: (position: ScrollPosition) => void
  /** 滚动容器元素（UScroll 暴露的 ref 经 proxyRefs 解包） */
  containerRef?: HTMLElement
}>()

/** 流式吸底内核：消息列表内容在尾部增长，吸底 scroll 事件位置滞后，需按方向识别用户上翻 */
const {
  stuck: stickToBottom,
  handleScroll: handleStickScroll,
  handleWheel,
  scrollToBottomIfStuck
} = useStickScroll({
  getScroller: () => scrollRef.value,
  bottomThreshold: 60,
  directionAware: true
})

/** 上翻阅读时展示回到底部的悬浮按钮 */
const showToLatest = computed(() => !stickToBottom.value && visibleMessages.value.length > 0)

/** 会话导航项：每轮取用户提问作单行标题（无提问时回落末段回答） */
const navigatorItems = computed<NavigatorItem[]>(() => {
  return turns.value.map((turn, index) => {
    const raw = turn.userMsg?.content?.trim() || turn.finalMsg?.content?.trim() || '（无提问）'
    return { key: turn.key, index, title: clipText(raw, 42) }
  })
})

/** 当前视口顶部所在的轮次：滚动时实时高亮导航项 */
const activeTurnKey = ref<string>()

/** 列表是否真的溢出可滚：不溢出时导航没有意义，避免短对话出现多余刻度 */
const scrollable = ref(false)
/** 列表宽度是否够放导航：窄列里刻度会压到正文，此时不出现 */
const wideEnough = ref(false)

/** 导航是否可用：轮次够多 + 内容溢出 + 有横向留白 */
const navigatorVisible = computed(() => scrollable.value && wideEnough.value)

/** 同步可滚状态（内容高度超过可视高度才出现导航） */
const updateScrollable = (position?: Required<ScrollPosition>) => {
  const { sh, ch } = position ?? {}
  const container = scrollRef.value?.containerRef
  const scrollHeight = sh ?? container?.scrollHeight
  const clientHeight = ch ?? container?.clientHeight
  // 尚未布局（高度为 0）时不下结论，避免首帧把导航误判成不需要
  if (!scrollHeight || !clientHeight) return
  scrollable.value = scrollHeight - clientHeight > 8
}

/** 导航需要内容列两侧的留白：列宽不足 880px（800 内容列 + 两侧各 40）时收起，避免刻度压住正文 */
const NAVIGATOR_MIN_WIDTH = 880

const updateWideEnough = () => {
  const width = scrollRef.value?.containerRef?.clientWidth
  if (!width) return
  wideEnough.value = width >= NAVIGATOR_MIN_WIDTH
}

useResizeObserver({
  targets: computed(() => scrollRef.value?.containerRef ?? undefined),
  onResize(entries) {
    const width = entries[0]?.contentRect?.width
    if (width == null) return
    wideEnough.value = width >= NAVIGATOR_MIN_WIDTH
  }
})

/** 计算视口顶部落在一轮对话的哪一项（容器顶部 + 判定偏移作为基准线） */
const updateActiveTurn = () => {
  const container = scrollRef.value?.containerRef
  if (!container) return
  const nodes = [...container.querySelectorAll<HTMLElement>('[data-turn]')]
  if (!nodes.length) return
  const line = container.getBoundingClientRect().top + 24
  let current = nodes[0]?.dataset.turn
  for (const node of nodes) {
    if (node.getBoundingClientRect().top > line) break
    current = node.dataset.turn
  }
  activeTurnKey.value = current
}

/** updateActiveTurn 涉及 querySelectorAll + getBoundingClientRect 批量测量，
 * 滚动事件高频触发时合帧到 rAF，同帧多次滚动只测一次 */
let activeTurnRafId: number | undefined

const scheduleUpdateActiveTurn = () => {
  if (activeTurnRafId != null) return
  activeTurnRafId = requestAnimationFrame(() => {
    activeTurnRafId = undefined
    updateActiveTurn()
  })
}

/**
 * 点击导航项：滚到该轮顶部并取消吸底，避免流式输出把用户拉回底部。
 * 直接算相对容器的偏移再 scrollTo——scrollIntoView 会连带滚动外层容器，
 * 在嵌套布局里会把整个页面也带走。
 */
const jumpToTurn = (key: string) => {
  const container = scrollRef.value?.containerRef
  const target = container?.querySelector<HTMLElement>(`[data-turn="${CSS.escape(key)}"]`)
  if (!container || !target) return
  stickToBottom.value = false
  const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top
  container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' })
}

// 轮次增删 / 内容增长后重新定位高亮项与可滚状态（布局稳定后测量）
watch(
  () => [turns.value.length, visibleMessages.value.length],
  async () => {
    await nextTick()
    updateActiveTurn()
    updateScrollable()
    updateWideEnough()
  },
  { immediate: true }
)

const handleScroll = (position: Required<ScrollPosition>) => {
  handleStickScroll(position)
  // 宽度判定交给 useResizeObserver（滚动不改变容器宽度）；测量类更新合帧到 rAF
  scheduleUpdateActiveTurn()
  updateScrollable(position)
}

/** 点击悬浮按钮：恢复吸附并回到底部 */
const scrollToLatest = async () => {
  stickToBottom.value = true
  await nextTick()
  scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
}

let trailingScrollTimer: ReturnType<typeof setTimeout> | undefined

/** 上一次吸底 watch 触发时的 running：识别「本次触发是否为生成收尾」 */
let prevRunning = props.running

// 消息数量或流式内容变化时，若处于吸附状态则滚动到底部（滚动前二次确认，见内核）。
// running 也是依赖之一，生成收尾（true → false）同样走这里：终态渲染会再次改变高度，
// 同帧滚动可能够不到最终底部，追加一次延迟兜底滚动
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
    await scrollToBottomIfStuck()
    const finished = prevRunning && !props.running
    prevRunning = props.running
    if (!finished) return
    clearTimeout(trailingScrollTimer)
    if (!(await scrollToBottomIfStuck())) return
    trailingScrollTimer = setTimeout(() => {
      if (stickToBottom.value) scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
    }, 150)
  }
)

onBeforeUnmount(() => {
  stopWelcomeRotation()
  clearJumpTimers()
  stopTick()
  clearTimeout(trailingScrollTimer)
  if (activeTurnRafId != null) cancelAnimationFrame(activeTurnRafId)
})
</script>
