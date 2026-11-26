<template>
  <div :class="cls.b">
    <UScroll
      ref="scrollRef"
      :class="cls.e('scroll')"
      :content-class="cls.e('content')"
      @scroll="handleScroll"
      @resize="handleScrollResize"
      @wheel.passive="handleWheel"
    >
      <template v-for="turn in turns" :key="turn.key">
        <!-- 轮次容器：导航指示器按 data-turn 定位与跳转，本身不产生视觉影响 -->
        <div :data-turn="turn.key">
          <UAiBubble
            v-if="turn.userMsg"
            :message="turn.userMsg"
            :is-last="false"
            :show-regenerate="!readonly"
            :renderer-props="rendererProps"
            @regenerate="emit('regenerate')"
            @preview-image="handlePreviewImage"
          />

          <!-- 过程按文字回答切段：live 期间按段展开；轮次结束后将最终回复之外的步骤、中间文本与 reply 卡片
               收拢到单个完成态 UAiStepGroup，下方只保留最终回复。
               段 key 优先取段内首步 key（段内天然稳定）：闭合瞬间首步 key 不变，
               段（含 UAiStepGroup 的展开状态）不会因首条 content 到达而重挂；content-only 段退回答 id -->
          <template
            v-for="(segment, segIndex) in turn.segments"
            :key="
              segment.key ??
              segment.steps[0]?.key ??
              segment.blocks[0]?.key ??
              segment.answerMsg?.id ??
              segIndex
            "
          >
            <UAiStepGroup
              v-if="segment.steps.length || segment.processItems?.length"
              :steps="segment.steps"
              :live="turn.live && segIndex === turn.segments.length - 1 && !segment.blocks.length"
              :end-status="
                segIndex === turn.segments.length - 1 && !segment.blocks.length
                  ? turn.tailEndStatus
                  : undefined
              "
              :tools="toolMap"
              :tool-icons="resolvedToolIcons"
              @respond="(id, approved) => emit('respond', id, approved)"
              @open-panel="handleOpenPanel"
            >
              <template v-if="segment.processItems?.length" #default>
                <template v-for="item in segment.processItems" :key="item.key">
                  <UAiReasoning
                    v-if="item.kind === 'reasoning'"
                    :content="item.message.reasoning ?? ''"
                    :thinking="false"
                    :cache-key="item.message.id"
                  />
                  <UAiToolCall
                    v-else-if="item.kind === 'tool' && item.toolCall"
                    :tool-call="item.toolCall"
                    :tool="toolMap[item.toolCall.name]"
                    :tool-icons="resolvedToolIcons"
                    @respond="(approved) => emit('respond', item.toolCall!.id, approved)"
                    @open-panel="handleOpenPanel"
                  />
                  <ReplyToolCard
                    v-else-if="item.kind === 'reply'"
                    :class="cls.e('process-reply')"
                    :tool-call="item.step.toolCall"
                    :tool="toolMap[item.step.toolCall.name]"
                    :tool-icons="resolvedToolIcons"
                    @respond="(approved) => emit('respond', item.step.toolCall.id, approved)"
                    @open-panel="handleOpenPanel"
                  />
                  <UAiBubble
                    v-else-if="item.kind === 'text'"
                    :class="cls.e('process-bubble')"
                    :message="item.message"
                    :show-actions="false"
                    :renderer-props="rendererProps"
                    @preview-image="handlePreviewImage"
                  >
                    <template v-if="hasReplyPiece(item.pieces)" #default="{ content, streaming }">
                      <template
                        v-for="part in shownReplyParts(content, item.pieces, streaming)"
                        :key="part.key"
                      >
                        <MarkdownRender
                          v-if="part.kind === 'text'"
                          mode="chat"
                          :fade="false"
                          v-bind="rendererProps"
                          :content="part.text"
                          :final="part.final"
                        />
                        <ReplyToolCard
                          v-else
                          :class="cls.e('process-reply')"
                          :tool-call="replyStepOf(item, part.id).toolCall"
                          :tool="toolMap[replyStepOf(item, part.id).toolCall.name]"
                          :tool-icons="resolvedToolIcons"
                          @respond="
                            (approved) =>
                              emit('respond', replyStepOf(item, part.id).toolCall.id, approved)
                          "
                          @open-panel="handleOpenPanel"
                        />
                      </template>
                    </template>
                  </UAiBubble>
                </template>
              </template>
            </UAiStepGroup>
            <!-- 有正文的 reply 卡片放进同一个气泡的插槽，复制 / 状态行 / 操作区仍只挂一次 -->
            <template v-for="block in segment.blocks" :key="block.key">
              <ReplyToolCard
                v-if="block.kind === 'reply'"
                :tool-call="block.step.toolCall"
                :tool="toolMap[block.step.toolCall.name]"
                :tool-icons="resolvedToolIcons"
                @respond="(approved) => emit('respond', block.step.toolCall.id, approved)"
                @open-panel="handleOpenPanel"
              />
              <UAiBubble
                v-else
                :message="block.message"
                :is-last="turn.isLast && turn.finalMsg === block.message"
                :show-regenerate="!readonly"
                :duration="
                  !turn.live && turn.finalMsg === block.message
                    ? turnDurations.get(turn.key)
                    : undefined
                "
                :renderer-props="rendererProps"
                @regenerate="emit('regenerate')"
                @preview-image="handlePreviewImage"
              >
                <template
                  v-if="hasReplyPiece(blockPieces(block))"
                  #default="{ content, streaming }"
                >
                  <template
                    v-for="part in shownReplyParts(content, blockPieces(block), streaming)"
                    :key="part.key"
                  >
                    <MarkdownRender
                      v-if="part.kind === 'text'"
                      mode="chat"
                      :fade="false"
                      v-bind="rendererProps"
                      :content="part.text"
                      :final="part.final"
                    />
                    <ReplyToolCard
                      v-else
                      :tool-call="replyStepOf(block, part.id).toolCall"
                      :tool="toolMap[replyStepOf(block, part.id).toolCall.name]"
                      :tool-icons="resolvedToolIcons"
                      @respond="
                        (approved) =>
                          emit('respond', replyStepOf(block, part.id).toolCall.id, approved)
                      "
                      @open-panel="handleOpenPanel"
                    />
                  </template>
                </template>
              </UAiBubble>
            </template>
          </template>

          <!-- 末条消息无正文且终态为出错/中止：状态行与操作区的载体 -->
          <UAiBubble
            v-if="turn.tailStatusMsg"
            :message="turn.tailStatusMsg"
            :is-last="turn.isLast"
            :show-regenerate="!readonly"
            :duration="turnDurations.get(turn.key)"
            :renderer-props="rendererProps"
            @regenerate="emit('regenerate')"
            @preview-image="handlePreviewImage"
          />
        </div>
      </template>
    </UScroll>

    <!-- 吉祥物栏：固定在滚动容器外、列表底部，待在原位不进入对话列表 -->
    <div v-if="showWelcome" :class="[cls.e('welcome'), bem.is('working', isWorking)]">
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

    <UAiSessionNav
      v-if="showNavigator"
      :class="cls.e('nav')"
      :items="navigatorItems"
      :active-key="activeTurnKey"
      :scrollable="scrollable"
      @jump="jumpToTurn"
    />
  </div>
</template>

<script lang="ts" setup>
import './style'
import { last } from '@cat-kit/core'
import { UIcon, UScroll } from '@veltra/desktop'
import type { ScrollPosition } from '@veltra/desktop'
import { ArrowDown } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import MarkdownRender from 'markstream-vue'
import {
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  onBeforeUnmount,
  provide,
  ref,
  shallowRef,
  useSlots,
  useTemplateRef,
  watch,
  type Slots
} from 'vue'

import type { ChatMessage, ChatToolCall } from '../../chat/types'
import type {
  _AiMessageListExposed,
  AiMessageListEmits,
  AiMessageListProps,
  AiSessionNavItem,
  AiStepItem
} from '../../types'
import type { AiOrbExposed, AiOrbReaction, AiOrbStatus } from '../../types/ai-orb'
import { AiChatDIKey } from '../_shared/di'
import { formatDuration } from '../_shared/format-duration'
import { normalizeToolsMap } from '../_shared/tool-call-brief'
import { clipText } from '../_shared/tool-format'
import { useStickScroll } from '../_shared/use-stick-scroll'
import { useStreamThrottle } from '../_shared/use-stream-throttle'
import { UAiBubble } from '../ai-bubble'
import UAiOrb from '../ai-orb/ai-orb.vue'
import { UAiReasoning } from '../ai-reasoning'
import { UAiSessionNav } from '../ai-session-nav'
import { UAiStepGroup } from '../ai-step-group'
import { UAiToolCall } from '../ai-tool-call'
import { replyPieces, shownReplyParts, type ReplyPiece } from './reply-flow'
import ReplyToolCard from './reply-tool.vue'

defineOptions({ name: 'UAiMessageList' })

/** 活体球直径（px） */
const ORB_SIZE = 48
/** 生成结束 / 失败后工作态短暂停留，播完表情与耗时再恢复欢迎语 */
const WORKING_LINGER_MS = 2500

const props = withDefaults(defineProps<AiMessageListProps>(), {
  running: false,
  readonly: false,
  showWelcome: true,
  showNavigator: true
})

const emit = defineEmits<AiMessageListEmits>()

defineSlots<{
  /** 空闲欢迎区插槽（工作中自动切换为原位工作态），无作用域参数 */
  welcome(): any
  /** 按工具名自定义工具结果展示，如 tool-getWeather */
  [name: `tool-${string}`]: (scope: { toolCall: ChatToolCall }) => any
}>()

const cls = bem('ai-message-list')
const parentDi = inject(AiChatDIKey, undefined)
const slots = useSlots()
const instance = getCurrentInstance()

/** 合并自身插槽与父级 DI 插槽（自身优先），保证独立挂载与嵌套透传下 tool-* 插槽均可达 */
const mergedSlotsProxy: Slots = new Proxy(slots, {
  get(target, prop, receiver) {
    if (typeof prop === 'string' && prop !== '_' && !prop.startsWith('$')) {
      return target[prop] ?? parentDi?.slots?.[prop]
    }
    return Reflect.get(target, prop, receiver)
  },
  has(target, prop) {
    if (typeof prop === 'string' && prop !== '_' && !prop.startsWith('$')) {
      return prop in target || Boolean(parentDi?.slots && prop in parentDi.slots)
    }
    return Reflect.has(target, prop)
  },
  ownKeys(target) {
    const keys = new Set<string | symbol>(Reflect.ownKeys(target))
    if (parentDi?.slots) {
      for (const key of Reflect.ownKeys(parentDi.slots)) keys.add(key)
    }
    return [...keys]
  },
  getOwnPropertyDescriptor(target, prop) {
    if (typeof prop === 'string' && prop !== '_' && !prop.startsWith('$')) {
      if (prop in target) return Reflect.getOwnPropertyDescriptor(target, prop)
      if (parentDi?.slots && prop in parentDi.slots) {
        return Reflect.getOwnPropertyDescriptor(parentDi.slots, prop)
      }
    }
    return Reflect.getOwnPropertyDescriptor(target, prop)
  }
})

/** 显式 tools 优先于父级 DI 回落 */
const toolMap = computed(() => normalizeToolsMap(props.tools) ?? parentDi?.tools?.value ?? {})
const resolvedToolIcons = computed(() => props.toolIcons ?? parentDi?.toolIcons?.value)

/** 打开右侧面板：先派发 open-panel 事件；未显式监听时回落父级 DI openPanel */
const handleOpenPanel = (toolCallId: string) => {
  emit('open-panel', toolCallId)
  const vnodeProps = instance?.vnode.props
  if (!vnodeProps?.onOpenPanel && !vnodeProps?.['onOpen-panel']) {
    parentDi?.openPanel?.(toolCallId)
  }
}

/** 预览图片：先派发 preview-image 事件；未显式监听时回落父级 DI previewImage */
const handlePreviewImage = (src: string, alt?: string) => {
  emit('preview-image', src, alt)
  const vnodeProps = instance?.vnode.props
  if (!vnodeProps?.onPreviewImage && !vnodeProps?.['onPreview-image']) {
    parentDi?.previewImage?.(src, alt)
  }
}

// 为内部 UAiStepGroup / UAiToolCall / ReplyToolCard / UAiBubble 提供一致的 DI 上下文，支持脱离 UAiChat 独立运行
provide(AiChatDIKey, {
  slots: mergedSlotsProxy,
  tools: toolMap,
  toolIcons: resolvedToolIcons,
  openPanel: handleOpenPanel,
  previewImage: handlePreviewImage,
  pendingQuestion: parentDi?.pendingQuestion,
  questionCalls: parentDi?.questionCalls,
  resolvedQuestionAnswers: parentDi?.resolvedQuestionAnswers,
  respondQuestion: parentDi?.respondQuestion
})

/** session 模式下由 question/requested 关联过来的提问调用 */
const isLinkedQuestionCall = (call: ChatToolCall) =>
  Boolean(parentDi?.questionCalls?.value?.[call.id])

/** renderTo: 'reply' 的调用（含关联的 session 提问）：作为主线块在回复流外层渲染，不进步骤行 */
const isReplyTool = (call: ChatToolCall) =>
  toolMap.value[call.name]?.renderTo === 'reply' || isLinkedQuestionCall(call)

/** tool 消息不单独渲染，其内容体现在工具卡片的结果区 */
const visibleMessages = computed(() => props.messages.filter((msg) => msg.role !== 'tool'))

type ReplyStep = AiStepItem & { toolCall: ChatToolCall }

/** 回复流里的一块：正文气泡（可在气泡内按切点夹 reply 卡片），或尚无正文时单独挂出的卡片 */
type SegmentBlock =
  | { key: string; kind: 'reply'; step: ReplyStep }
  | { key: string; kind: 'text'; message: ChatMessage; pieces: ReplyPiece[]; replies: ReplyStep[] }

function blockPieces(block: SegmentBlock) {
  return block.kind === 'text' ? block.pieces : []
}

function hasReplyPiece(pieces: ReplyPiece[]) {
  return pieces.some((piece) => piece.kind === 'reply')
}

function replyStepOf(block: Extract<SegmentBlock, { kind: 'text' }>, id: string) {
  return block.replies.find((step) => step.key === id) ?? block.replies[0]!
}

/** 收拢进已完成容器的过程项（思考 / 普通工具 / 中间 reply 卡片 / 中间说明正文） */
type ProcessItem = AiStepItem | SegmentBlock

/** 一段：两次文字回答之间的全部步骤；出现文字回答即闭合该段 */
interface TurnSegment {
  /** 段稳定 key（单段无过程块时沿用首步 key，多段收拢后用轮次过程容器 key） */
  key?: string
  steps: AiStepItem[]
  /** 轮次结束后收拢的完整过程项；仅包含中间文本或中间 reply 时存在 */
  processItems?: ProcessItem[]
  /** 步骤行之后、按 contentOffset 与正文交错 */
  blocks: SegmentBlock[]
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
    const previous = last(grouped)
    // 兼容 assistant 开头的历史会话：归入无用户消息的轮次
    if (previous) previous.assistants.push(msg)
    else grouped.push({ key: msg.id, assistants: [msg] })
  }
  return grouped.map((turn, index) => {
    // 按流式顺序切段：思考与普通工具归属当前段；一旦产出主线块（文字正文或 renderTo: 'reply' 外层工具），
    // 即闭合当前段并开启新段，使前后普通工具各自独立成组、保持时间顺序。
    // 有正文时 reply 工具按 contentOffset 切进同一个气泡，同消息非 reply 工具落在下一段。
    const segments: TurnSegment[] = []
    let current: TurnSegment = { steps: [], blocks: [] }
    for (const msg of turn.assistants) {
      if (msg.reasoning) {
        current.steps.push({ key: `${msg.id}:reasoning`, kind: 'reasoning', message: msg })
      }
      const calls = msg.toolCalls ?? []
      if (msg.content) {
        const replySteps: ReplyStep[] = []
        const trailingSteps: AiStepItem[] = []
        for (const call of calls) {
          if (isReplyTool(call)) {
            replySteps.push({ key: call.id, kind: 'tool', message: msg, toolCall: call })
          } else {
            trailingSteps.push({ key: call.id, kind: 'tool', message: msg, toolCall: call })
          }
        }
        current.answerMsg = msg
        current.blocks.push({
          key: `${msg.id}:text`,
          kind: 'text',
          message: msg,
          pieces: replyPieces(
            msg.content,
            replySteps.map((step) => ({ id: step.key, offset: step.toolCall.contentOffset }))
          ),
          replies: replySteps
        })
        segments.push(current)
        current = { steps: trailingSteps, blocks: [] }
      } else {
        for (const call of calls) {
          if (isReplyTool(call)) {
            const step: ReplyStep = { key: call.id, kind: 'tool', message: msg, toolCall: call }
            current.blocks.push({ key: step.key, kind: 'reply', step })
            segments.push(current)
            current = { steps: [], blocks: [] }
          } else {
            current.steps.push({ key: call.id, kind: 'tool', message: msg, toolCall: call })
          }
        }
      }
    }
    if (current.steps.length || current.blocks.length) segments.push(current)

    const isLastTurn = index === grouped.length - 1
    const lastMsg = last(turn.assistants)
    // 末段 live 判定：running 或末消息未进终态都算进行中，防断连时行内状态来回翻转
    const live = isLastTurn && (props.running || !isFinalStatus(lastMsg))
    // 末条消息无正文（terminal「UI 即答复」工具轮 / 出错 / 中止）：作为状态行与操作区的载体渲染
    const tailStatusMsg =
      lastMsg && !lastMsg.content && isFinalStatus(lastMsg) ? lastMsg : undefined
    /** 步骤行完成态摘要的终态标注：仅出错/中止着危险色，done 走普通完成态 */
    const tailEndStatus =
      tailStatusMsg && (tailStatusMsg.status === 'error' || tailStatusMsg.status === 'aborted')
        ? tailStatusMsg.status
        : undefined
    const lastAnswer = segments.findLast((segment) => segment.answerMsg)?.answerMsg
    const finalMsg = tailStatusMsg ?? lastAnswer

    let displaySegments = segments
    if (!live && segments.length > 0) {
      // 轮次结束后确定外层保留的最终回复段：末段有正文/reply 块则留末段；
      // 否则若存在 tailStatusMsg（出错/中止/无正文终结工具）则全部进过程容器；
      // 再否则回退到最后一个有正文答复的段（如正文后还有纯步骤调用）。
      const lastSeg = last(segments)!
      const finalSegIndex =
        lastSeg.blocks.length > 0
          ? segments.length - 1
          : tailStatusMsg
            ? -1
            : segments.findLastIndex((s) => Boolean(s.answerMsg))

      const finalSeg = finalSegIndex >= 0 ? segments[finalSegIndex]! : undefined
      const finalBlocks = finalSeg ? finalSeg.blocks : []
      const finalAnswerMsg = finalSeg?.answerMsg

      const allProcessItems: ProcessItem[] = []
      const allProcessSteps: AiStepItem[] = []
      let hasNonStepProcess = false

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]!
        allProcessItems.push(...seg.steps)
        allProcessSteps.push(...seg.steps)
        if (i !== finalSegIndex && seg.blocks.length > 0) {
          hasNonStepProcess = true
          for (const block of seg.blocks) {
            allProcessItems.push(block)
            if (block.kind === 'reply') {
              allProcessSteps.push(block.step)
            } else {
              allProcessSteps.push(...block.replies)
            }
          }
        }
      }

      if (allProcessItems.length === 0 && finalBlocks.length === 0) {
        displaySegments = []
      } else {
        displaySegments = [
          {
            key: hasNonStepProcess
              ? `${turn.key}:process`
              : (allProcessSteps[0]?.key ?? finalBlocks[0]?.key ?? finalAnswerMsg?.id),
            steps: allProcessSteps,
            processItems: hasNonStepProcess ? allProcessItems : undefined,
            blocks: finalBlocks,
            answerMsg: finalAnswerMsg
          }
        ]
      }
    }

    return {
      key: turn.key,
      userMsg: turn.userMsg,
      segments: displaySegments,
      tailStatusMsg,
      tailEndStatus,
      live,
      finalMsg,
      isLast: isLastTurn && !live && !!finalMsg
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
  const latest = last(turns.value)
  return latest ? turnDurations.value.get(latest.key) : undefined
})

const isWorking = computed(() => !!(props.running || finishing.value))

const orbRef = useTemplateRef<AiOrbExposed>('orb')

/** 工具调用失败的 id 去重集合：同一次失败只播一次沮丧表情 */
const reactedToolErrorIds = new Set<string>()

/** 工具调用失败的轻量指纹（错误数 + 最后一个错误 id）：避免每个 delta 都分配完整 id 列表 */
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
  const latest = last(visibleMessages.value)
  if (latest?.role === 'assistant' && latest.status === 'streaming' && latest.content) {
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
    const lastTurn = last(turns.value)
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
    const latest = last(visibleMessages.value)
    let reaction: AiOrbReaction | undefined
    if (latest?.role === 'assistant') {
      if (latest.status === 'done') reaction = 'happy'
      else if (latest.status === 'error') reaction = 'frustrated'
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

const scrollRef = useTemplateRef<InstanceType<typeof UScroll>>('scrollRef')

/** 流式吸底内核：消息列表内容在尾部增长，吸底 scroll 事件位置滞后，需按方向识别用户上翻 */
const {
  stuck: stickToBottom,
  handleScroll: handleStickScroll,
  handleWheel,
  scrollToBottomIfStuck
} = useStickScroll({
  getScroller: () => scrollRef.value ?? undefined,
  bottomThreshold: 60,
  directionAware: true
})

const showToLatest = computed(() => !stickToBottom.value && visibleMessages.value.length > 0)

/** 会话导航项：每轮取用户提问与最终回答（无最终回答时回退首段文字回答）的前面部分作 hover 预览 */
const navigatorItems = computed<AiSessionNavItem[]>(() => {
  return turns.value.map((turn, index) => {
    const rawQuestion = turn.userMsg?.content?.trim()
    const rawAnswer =
      turn.finalMsg?.content?.trim() ||
      turn.segments.find((s) => s.answerMsg?.content?.trim())?.answerMsg?.content?.trim()
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
 * 直接算相对容器的偏移再 scrollTo——scrollIntoView 会连带滚动外层容器。
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

const lastVisibleMessage = computed(() => last(visibleMessages.value))

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
    const latest = lastVisibleMessage.value
    return [
      list.length,
      latest?.id ?? '',
      throttledContentLen.value,
      throttledReasoningLen.value,
      latest?.toolCalls?.length ?? 0,
      props.running
    ].join('|')
  },
  async () => {
    // 用户刚发出消息时强制回到底部（无论之前是否在上翻）
    const list = visibleMessages.value
    if (last(list)?.role === 'user') stickToBottom.value = true
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

defineExpose<_AiMessageListExposed>({ scrollToLatest, jumpToTurn })
</script>
