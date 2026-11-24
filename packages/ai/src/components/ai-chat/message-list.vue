<template>
  <div :class="cls.e('list-wrap')">
    <UScroll
      :class="cls.e('list')"
      :content-class="cls.e('list-content')"
      ref="scrollRef"
      @scroll="handleScroll"
      @resize="handleScrollResize"
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
            :key="
              segment.steps[0]?.key ??
              segment.replySteps[0]?.key ??
              segment.answerMsg?.id ??
              segIndex
            "
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
    </UScroll>

    <!-- 吉祥物栏：固定在滚动容器外、输入框上方，待在原位不进入对话列表 -->
    <div :class="[cls.e('welcome'), bem.is('working', isWorking)]">
      <slot v-if="!isWorking && $slots.welcome" name="welcome" />
      <div v-else :class="cls.e('welcome-inner')">
        <UAiOrb
          ref="orb"
          :size="ORB_SIZE"
          :status="orbStatus"
          @click="!isWorking && cycleWelcome()"
        />
        <div v-if="isWorking" :class="cls.e('working')">
          <template v-if="running">
            <span :class="[cls.e('working-text'), 'u-shine']">工作中…</span>
            <span :class="cls.e('working-time')">{{ formatDuration(elapsedMs) }}</span>
          </template>
          <span v-else-if="lastTurnDuration != null" :class="cls.e('working-time')">
            用时 {{ formatDuration(lastTurnDuration) }}
          </span>
        </div>
        <div v-else-if="welcomeItems.length" :class="cls.e('welcome-item-wrap')">
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
    </div>

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

    <SessionNavigator
      :items="navigatorItems"
      :active-key="activeTurnKey"
      :scrollable="scrollable"
      @jump="jumpToTurn"
    />
  </div>
</template>

<script lang="ts" setup>
import './style'
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
import { useStreamThrottle } from './use-stream-throttle'

defineOptions({ name: 'UAiChatMessageList' })

/** 活体球直径（px） */
const ORB_SIZE = 48
/** 生成结束 / 失败后工作态短暂停留，播完表情与耗时再恢复欢迎语 */
const WORKING_LINGER_MS = 2500

const props = defineProps<{
  messages: ChatMessage[]
  /** 空闲时输入框上方的快捷提问；字符串按单项处理 */
  welcome?: string | string[]
  running?: boolean
  readonly?: boolean
  /** 透传给 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'respond', toolCallId: string, approved: boolean): void
  (e: 'regenerate'): void
  (e: 'welcome-click', text: string): void
}>()

defineSlots<{
  /** 空闲欢迎区插槽（工作中自动切换为原位工作态），无作用域参数 */
  welcome(): any
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** renderTo: 'reply' 的调用：自定义渲染作为消息块进回复流 */
const isReplyTool = (call: ChatToolCall) => di?.tools.value[call.name]?.renderTo === 'reply'

/** 从步骤行（「执行了 N 个步骤」）隐藏的工具（例如已在回复流外层渲染的提问工具） */
const isHiddenInSteps = (call: ChatToolCall) => di?.tools.value[call.name]?.hideInSteps === true

/** tool 消息不单独渲染，其内容体现在工具卡片的结果区 */
const visibleMessages = computed(() => props.messages.filter((msg) => msg.role !== 'tool'))

/** 一段：两次文字回答之间的全部步骤；出现文字回答即闭合该段 */
interface TurnSegment {
  steps: TurnStep[]
  /** renderTo: 'reply' 的工具步：渲染在回复流（步骤行之后、段末回答之前），不随步骤行折叠 */
  replySteps: TurnStep[]
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
    // 按流式顺序切段：思考归属当前段；出现文字回答即闭合该段、开启新段。
    // renderTo: 'reply' 的工具面板挂入正文闭段前的当前段（同一条消息 content + 提问工具
    // 不再拆开：面板渲染在该段步骤行之后、段末正文之前）；普通工具调用仍落进正文后的新段
    const segments: TurnSegment[] = []
    let current: TurnSegment = { steps: [], replySteps: [] }
    for (const msg of turn.assistants) {
      if (msg.reasoning) {
        current.steps.push({ key: `${msg.id}:reasoning`, kind: 'reasoning', message: msg })
      }
      const calls = msg.toolCalls ?? []
      for (const call of calls) {
        if (!isReplyTool(call)) continue
        const step: TurnStep = { key: call.id, kind: 'tool', message: msg, toolCall: call }
        if (!isHiddenInSteps(call)) current.steps.push(step)
        current.replySteps.push(step)
      }
      if (msg.content) {
        current.answerMsg = msg
        segments.push(current)
        current = { steps: [], replySteps: [] }
      }
      for (const call of calls) {
        if (isReplyTool(call) || isHiddenInSteps(call)) continue
        current.steps.push({ key: call.id, kind: 'tool', message: msg, toolCall: call })
      }
    }
    if (current.steps.length || current.replySteps.length) segments.push(current)

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

const welcomeIndex = ref(0)

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

const cycleWelcome = () => {
  if (welcomeItems.value.length <= 1) return
  welcomeIndex.value += 1
  startWelcomeRotation()
}

const finishing = ref(false)

let finishTimer: ReturnType<typeof setTimeout> | undefined

/** 工作计时的起算时间戳（running 升起时记录） */
let workStartAt = 0
const elapsedMs = ref(0)
let tickTimer: ReturnType<typeof setInterval> | undefined

/** 各轮次总用时（key 同 turns；仅 live 轮次有，历史回放无计时数据） */
const turnDurations = shallowRef(new Map<string, number>())

const stopTick = () => {
  clearInterval(tickTimer)
  tickTimer = undefined
}

const lastTurnDuration = computed(() => {
  const last = turns.value[turns.value.length - 1]
  return last ? turnDurations.value.get(last.key) : undefined
})

const isWorking = computed(() => !!(props.running || finishing.value))

const orbRef = useTemplateRef<AiOrbExposed>('orb')

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

// 工具调用失败 → 活体球闭眼摇头（frustrated）；仅指纹变化时进回调，同一失败只 react 一次
watch(toolErrorFingerprint, () => {
  for (const msg of props.messages) {
    if (msg.role !== 'assistant' || !msg.toolCalls) continue
    for (const call of msg.toolCalls) {
      if (call.status !== 'error' || reactedToolErrorIds.has(call.id)) continue
      reactedToolErrorIds.add(call.id)
      orbRef.value?.react('frustrated')
    }
  }
})

/** 活体球状态：空闲或收尾停留 → idle；正文输出中 → speaking；其余生成阶段 → thinking */
const orbStatus = computed<AiOrbStatus>(() => {
  if (!props.running) return 'idle'
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
      clearTimeout(finishTimer)
      finishing.value = false
      workStartAt = Date.now()
      elapsedMs.value = 0
      stopTick()
      tickTimer = setInterval(() => {
        elapsedMs.value = Date.now() - workStartAt
      }, 100)
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

    // 清除会话后列表已空：跳过结束停留，立刻恢复欢迎语
    if (visibleMessages.value.length === 0) {
      finishing.value = false
      return
    }

    finishing.value = true
    const last = visibleMessages.value[visibleMessages.value.length - 1]
    let reaction: AiOrbReaction | undefined
    if (last?.role === 'assistant') {
      if (last.status === 'done') reaction = 'happy'
      else if (last.status === 'error') reaction = 'frustrated'
    }
    if (reaction) {
      nextTick(() => orbRef.value?.react(reaction))
    }
    finishTimer = setTimeout(() => {
      finishing.value = false
    }, WORKING_LINGER_MS)
  }
)

watch(
  () => visibleMessages.value.length,
  (len) => {
    if (len > 0) return
    clearTimeout(finishTimer)
    turnDurations.value = new Map()
    finishing.value = false
  }
)

watch(
  () => [welcomeItems.value.length, isWorking.value] as const,
  () => {
    if (!isWorking.value) startWelcomeRotation()
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

const showToLatest = computed(() => !stickToBottom.value && visibleMessages.value.length > 0)

/** 会话导航项：每轮取用户提问与首段文字回答的前面部分作 hover 预览 */
const navigatorItems = computed<NavigatorItem[]>(() => {
  return turns.value.map((turn, index) => {
    const rawQuestion = turn.userMsg?.content?.trim()
    const rawAnswer = turn.segments
      .find((s) => s.answerMsg?.content?.trim())
      ?.answerMsg?.content?.trim()
    return {
      key: turn.key,
      index,
      question: rawQuestion ? clipText(rawQuestion, 36) : '（无提问）',
      answer: rawAnswer ? clipText(rawAnswer, 48) : undefined
    }
  })
})

const activeTurnKey = ref<string>()

/** 列表是否真的溢出可滚：不溢出时导航没有意义，避免短对话出现多余圆点 */
const scrollable = ref(false)

const updateScrollable = (position?: Required<ScrollPosition>) => {
  const { sh, ch } = position ?? {}
  const container = scrollRef.value?.containerRef
  const scrollHeight = sh ?? container?.scrollHeight
  const clientHeight = ch ?? container?.clientHeight
  // 尚未布局（高度为 0）时不下结论，避免首帧把导航误判成不需要
  if (!scrollHeight || !clientHeight) return
  scrollable.value = scrollHeight - clientHeight > 8
}

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
  },
  { immediate: true }
)

/** 容器或内容高度变化时同步可滚状态与当前高亮轮次（覆盖流式撑高 / 异步渲染） */
const handleScrollResize = () => {
  updateScrollable()
  scheduleUpdateActiveTurn()
}

const handleScroll = (position: Required<ScrollPosition>) => {
  handleStickScroll(position)
  scheduleUpdateActiveTurn()
  updateScrollable(position)
}

const scrollToLatest = async () => {
  stickToBottom.value = true
  await nextTick()
  scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
}

let trailingScrollTimer: ReturnType<typeof setTimeout> | undefined

/** 上一次吸底 watch 触发时的 running：识别「本次触发是否为生成收尾」 */
let prevRunning = props.running

const lastVisibleMessage = computed(() => {
  const list = visibleMessages.value
  return list[list.length - 1]
})

const throttledContentLen = useStreamThrottle(
  () => lastVisibleMessage.value?.content.length ?? 0,
  () => lastVisibleMessage.value?.status === 'streaming'
)

const throttledReasoningLen = useStreamThrottle(
  () => lastVisibleMessage.value?.reasoning?.length ?? 0,
  () => lastVisibleMessage.value?.status === 'streaming' && !lastVisibleMessage.value.content
)

// 消息数量或流式内容变化时，若处于吸附状态则滚动到底部（滚动前二次确认，见内核）。
// running 也是依赖之一，生成收尾（true → false）同样走这里：终态渲染会再次改变高度，
// 同帧滚动可能够不到最终底部，追加一次延迟兜底滚动
watch(
  () => {
    const list = visibleMessages.value
    const last = lastVisibleMessage.value
    return [
      list.length,
      last?.id ?? '',
      throttledContentLen.value,
      throttledReasoningLen.value,
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
  clearTimeout(finishTimer)
  stopTick()
  clearTimeout(trailingScrollTimer)
  if (activeTurnRafId != null) cancelAnimationFrame(activeTurnRafId)
})
</script>
