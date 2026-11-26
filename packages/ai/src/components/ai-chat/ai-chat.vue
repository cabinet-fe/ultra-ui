<template>
  <ULayout
    ref="layoutRef"
    :class="[cls.b, bem.is('resizing', resizing)]"
    :cols="layoutCols"
    rows="1fr"
    :resizable="panelOpen"
    :col-min-sizes="panelOpen ? [MAIN_MIN_WIDTH, PANEL_MIN_WIDTH] : undefined"
    @resize-start="resizing = true"
    @resize-end="resizing = false"
  >
    <div :class="[cls.e('main'), bem.is('empty', isEmpty)]">
      <UAiMessageList
        :messages="messages"
        :welcome="welcome"
        :running="running"
        :readonly="readonly"
        :tools="toolMap"
        :tool-icons="toolIcons"
        :renderer-props="rendererProps"
        @respond="respondToolCall"
        @regenerate="regenerate"
        @welcome-click="(text) => handleSend(text, [])"
        @open-panel="openPanel"
        @preview-image="previewImage"
      >
        <template v-if="$slots.welcome" #welcome>
          <slot name="welcome" />
        </template>
      </UAiMessageList>

      <div v-if="pendingQuestion && !hasLinkedQuestionCall" :class="cls.e('session-question')">
        <UAiQuestionCard :questions="pendingQuestion.questions" @submit="handleQuestionSubmit" />
      </div>

      <UAiApprovalBanner :approvals="pendingApprovals" @respond="respondSession" />

      <UAiMessageQueue
        :queue="queue"
        :readonly="readonly"
        @start-now="startQueued"
        @edit="handleQueueEdit"
        @remove="removeQueued"
      />

      <UAiJobBar :jobs="jobs" :tool-icons="toolIcons" />

      <UAiComposer
        v-if="!readonly"
        ref="composerRef"
        :running="running"
        :placeholder="placeholder"
        :max-attachment-size="maxAttachmentSize"
        @send="handleSend"
        @abort="abort"
        @preview-image="previewImage"
      >
        <template #toolbar-left="{ addAttachments, disabled }">
          <UAiContextPicker
            :accept="accept"
            :max-attachment-size="maxAttachmentSize"
            :disabled="disabled"
            @add-attachments="addAttachments"
          />
          <span :class="[cls.e('clear-wrap'), bem.is('disabled', !clearable)]">
            <UPopConfirm
              title="清空当前对话？进行中的生成将被中止。"
              confirm-text="清空"
              direction="top"
              alignment="start"
              @confirm="clear"
            >
              <template #reference>
                <UIcon :class="cls.e('clear')" title="清除会话">
                  <Clear />
                </UIcon>
              </template>
            </UPopConfirm>
          </span>
        </template>

        <template #toolbar-right>
          <UAiContextUsage
            :usage="tokenUsage"
            :last-request-usage="lastRequestUsage"
            :context-window="currentContextWindow"
            :detail="tokenUsageDetail"
          />
          <UAiModelPicker v-if="models?.length" v-model="model" :models="models" />
          <UAiReasoningPicker
            v-if="models?.length"
            v-model="reasoningLevel"
            :levels="reasoningLevels"
          />
        </template>
      </UAiComposer>

      <UImagePreviewer
        v-model:open="previewOpen"
        :src="previewTarget?.src"
        :alt="previewTarget?.alt"
      />
    </div>

    <!-- 侧边面板（renderTo: 'panel' 的工具渲染区），与会话区宽度经 ULayout 拖拽手柄调节 -->
    <UAiSidePanel
      v-if="activePanelCall"
      ref="panelRef"
      :tool-call="activePanelCall"
      :tool="toolMap[activePanelCall.name]"
      :tool-icons="toolIcons"
      @close="closePanel"
    />
  </ULayout>
</template>

<script lang="ts" setup>
import './style'
import { useResizeObserver } from '@veltra/compositions'
import { UIcon, UImagePreviewer, ULayout, UPopConfirm } from '@veltra/desktop'
import { Clear } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, provide, ref, shallowRef, useSlots, useTemplateRef, watch } from 'vue'

import { isServerTransport } from '../../chat/session'
import type { ChatAttachment, ChatTool, ChatToolCall, ChatToolMeta } from '../../chat/types'
import { useChat } from '../../chat/use-chat'
import { createBuiltinTools, type AskQuestionAnswer } from '../../tools'
import type { _AiChatExposed, AiChatEmits, AiChatProps } from '../../types'
import { AiChatDIKey } from '../_shared/di'
import { UAiApprovalBanner } from '../ai-approval-banner'
import { UAiComposer } from '../ai-composer'
import { UAiContextPicker } from '../ai-context-picker'
import { UAiContextUsage } from '../ai-context-usage'
import { UAiJobBar } from '../ai-job-bar'
import { UAiMessageList } from '../ai-message-list'
import { UAiMessageQueue } from '../ai-message-queue'
import { UAiModelPicker } from '../ai-model-picker'
import { UAiQuestionCard } from '../ai-question-card'
import { UAiReasoningPicker } from '../ai-reasoning-picker'
import { UAiSidePanel } from '../ai-side-panel'

defineOptions({ name: 'UAiChat' })

const props = defineProps<AiChatProps>()

const emit = defineEmits<AiChatEmits>()

defineSlots<{
  /** 空闲欢迎区插槽（输入框上方；工作中跳到列表末尾） */
  welcome(): any
  /** 按工具名自定义工具结果展示，如 tool-getWeather */
  [name: `tool-${string}`]: (scope: { toolCall: ChatToolCall }) => any
}>()

const cls = bem('ai-chat')

const slots = useSlots()

/**
 * 按 name 查表：session 下 tools 仅为渲染元信息（不注入内置工具，忽略 execute 等）。
 * 函数 transport 仍注入 createBuiltinTools（同名内置优先）。
 */
const toolMap = computed((): Record<string, ChatTool | ChatToolMeta | undefined> => {
  if (isServerTransport(props.transport)) {
    return Object.fromEntries((props.tools ?? []).map((t) => [t.name, t]))
  }
  const builtins = createBuiltinTools()
  const names = new Set(builtins.map((t) => t.name))
  const tools = [...builtins, ...(props.tools ?? []).filter((t) => !names.has(t.name))]
  return Object.fromEntries(tools.map((t) => [t.name, t]))
})

const toolIcons = computed(() => props.toolIcons)

const {
  messages,
  model,
  reasoningLevel,
  running,
  queue,
  jobs,
  tokenUsage,
  lastTurnUsage,
  lastRequestUsage,
  pendingApprovals,
  pendingQuestion,
  questionCalls,
  send,
  abort,
  regenerate,
  clear,
  respondToolCall,
  respondSession,
  enqueue,
  startQueued,
  removeQueued
} = useChat({ props, emit })

/** 空会话（无可见消息）：输入区垂直居中；欢迎区钉在滚动容器外、贴于输入框上方 */
const isEmpty = computed(() => !messages.value.some((msg) => msg.role !== 'tool'))

/** 有对话内容、队列或生成中才允许清除，避免误触空会话 */
const clearable = computed(
  () => messages.value.length > 0 || queue.value.length > 0 || running.value
)

const currentModel = computed(() => props.models?.find((m) => m.id === model.value))
const currentContextWindow = computed(() => currentModel.value?.contextWindow)
const reasoningLevels = computed(() => currentModel.value?.reasoningLevels ?? [])

/** 任一工具声明 renderTo: 'panel'：绝大多数会话没有面板工具，
 * 先短路避免流式期间每个 delta 都全量扫描消息找面板调用 */
const hasPanelTools = computed(() =>
  Object.values(toolMap.value).some((t) => t?.renderTo === 'panel')
)

/** 短路时的共享空数组：引用稳定，下游 watch(panelCalls) 不因流式 delta 反复触发 */
const NO_PANEL_CALLS: ChatToolCall[] = []

/** 所有 renderTo: 'panel' 的工具调用（按消息顺序，面板内容的来源） */
const panelCalls = computed<ChatToolCall[]>(() => {
  if (!hasPanelTools.value) return NO_PANEL_CALLS
  const calls: ChatToolCall[] = []
  for (const msg of messages.value) {
    if (msg.role !== 'assistant' || !msg.toolCalls) continue
    for (const call of msg.toolCalls) {
      if (toolMap.value[call.name]?.renderTo === 'panel') calls.push(call)
    }
  }
  return calls
})

/** 当前展示在右侧面板的工具调用 id；null 表示面板关闭 */
const activePanelCallId = ref<string | null>(null)

const activePanelCall = computed(() => {
  if (!activePanelCallId.value) return null
  return panelCalls.value.find((call) => call.id === activePanelCallId.value) ?? null
})

const panelOpen = computed(() => activePanelCall.value != null)

// 出现新的面板工具调用时自动打开并聚焦到它
watch(
  () => panelCalls.value[panelCalls.value.length - 1]?.id,
  (id) => {
    if (id) activePanelCallId.value = id
  }
)

// 聚焦的调用消失（清空消息 / 重新生成）时，回落到最近一次面板调用或关闭
watch(panelCalls, (calls) => {
  const id = activePanelCallId.value
  if (id && !calls.some((call) => call.id === id)) {
    activePanelCallId.value = calls[calls.length - 1]?.id ?? null
  }
})

/** 打开面板并聚焦到指定工具调用（工具卡片「查看面板」入口，经 DI 下发） */
const openPanel = (toolCallId: string) => {
  if (panelCalls.value.some((call) => call.id === toolCallId)) {
    activePanelCallId.value = toolCallId
  }
}

const closePanel = () => {
  activePanelCallId.value = null
}

const previewOpen = ref(false)
const previewTarget = shallowRef<{ src: string; alt?: string } | null>(null)

const previewImage = (src: string, alt?: string) => {
  if (!src) return
  previewTarget.value = { src, alt }
  previewOpen.value = true
}

const resolvedQuestionAnswers = shallowRef(new Map<string, AskQuestionAnswer[]>())

watch([() => props.transport, () => messages.value.length], ([transport, len], [prevTransport]) => {
  if (transport !== prevTransport || len === 0) {
    if (resolvedQuestionAnswers.value.size > 0) {
      resolvedQuestionAnswers.value = new Map()
    }
  }
})

/** 当前挂起的 session 提问是否已关联到消息流中的 tool/call */
const hasLinkedQuestionCall = computed(() => {
  const callId = pendingQuestion.value?.callId
  if (!callId) return false
  return messages.value.some(
    (msg) => msg.role === 'assistant' && msg.toolCalls?.some((call) => call.id === callId)
  )
})

const handleLinkedQuestionSubmit = (
  rpcId: string,
  callId: string,
  answers: AskQuestionAnswer[]
) => {
  const next = new Map(resolvedQuestionAnswers.value)
  next.set(callId, answers)
  resolvedQuestionAnswers.value = next
  respondSession(rpcId, true, answers)
}

provide(AiChatDIKey, {
  slots,
  tools: toolMap,
  toolIcons,
  openPanel,
  previewImage,
  pendingQuestion,
  questionCalls,
  resolvedQuestionAnswers,
  respondQuestion: handleLinkedQuestionSubmit
})

/**
 * 面板宽度：经 ULayout 列轨施加（cols = 1fr + 面板宽度），
 * 拖拽手柄由 ULayout 提供（colMinSizes 约束会话区 / 面板最小宽度）。
 */
const PANEL_MIN_WIDTH = 320
const MAIN_MIN_WIDTH = 360

const layoutRef = useTemplateRef<InstanceType<typeof ULayout>>('layoutRef')
const panelRef = useTemplateRef<InstanceType<typeof UAiSidePanel>>('panelRef')
const panelWidth = ref(PANEL_MIN_WIDTH)
const resizing = ref(false)

const layoutCols = computed(() => {
  return panelOpen.value ? ['1fr', `${panelWidth.value}px`] : ['1fr']
})

const containerWidth = () => (layoutRef.value?.$el as HTMLElement | undefined)?.clientWidth ?? 0

/** 面板默认宽度：平分容器宽度（容器宽度未知时回退 420px） */
const defaultPanelWidth = () => {
  const width = containerWidth()
  return width ? Math.round(width / 2) : 420
}

/** 钳位面板宽度在 [PANEL_MIN_WIDTH, 容器宽 - MAIN_MIN_WIDTH] 区间 */
const clampPanelWidth = (width: number) => {
  const width0 = containerWidth()
  const maxWidth = width0
    ? Math.max(PANEL_MIN_WIDTH, width0 - MAIN_MIN_WIDTH)
    : Number.MAX_SAFE_INTEGER
  return Math.min(Math.max(width, PANEL_MIN_WIDTH), maxWidth)
}

// 聚焦到指定了 panelWidth 的工具调用时应用其宽度；面板从关闭到打开且工具未指定宽度时
// 应用默认宽（平分容器宽度）；面板已打开时切换聚焦保持当前宽度（含用户拖拽结果）
watch(activePanelCall, (call, prevCall) => {
  if (!call) return
  const toolWidth = toolMap.value[call.name]?.panelWidth
  const width = toolWidth ?? (prevCall ? undefined : defaultPanelWidth())
  if (typeof width !== 'number') return
  panelWidth.value = clampPanelWidth(width)
})

// 跟踪面板实际宽度（含用户拖拽结果）：面板关闭重开、切换到未指定宽度的工具时保持。
// 全屏态下面板铺满容器，宽度并非拖拽结果，跳过回写以免破坏还原后的列宽
useResizeObserver({
  targets: computed(() => (panelRef.value?.$el as HTMLElement | undefined) ?? undefined),
  onResize(entries) {
    if (panelRef.value?.fullscreen) return
    // borderBoxSize 随通知携带（含边框、零布局开销），不读 offsetWidth/clientWidth
    const inlineSize = entries[0]?.borderBoxSize?.[0]?.inlineSize
    if (!inlineSize) return
    const width = Math.round(inlineSize)
    // 滞回：忽略亚像素/边框级的微小偏差（< 2px），阻断任何「观测→回写→再观测」的微缩反馈回路
    if (Math.abs(width - panelWidth.value) < 2) return
    panelWidth.value = width
  }
})

const composerRef = useTemplateRef<InstanceType<typeof UAiComposer>>('composerRef')

/**
 * 编辑中的队列项原后继 id（编辑态标记）：
 * undefined 表示无编辑；null 表示原位置在队尾；否则重新提交时插回该后继之前，
 * 使前后项顺序不受编辑影响（前项已执行则该项自然成为最前待执行项）。
 */
const editingSuccessor = ref<string | null | undefined>(undefined)

/** 编辑队列项：取回输入框重新编辑；已有未完成编辑时先按锚点还原，避免内容丢失 */
const handleQueueEdit = (id: string) => {
  restoreEditing()

  const index = queue.value.findIndex((item) => item.id === id)
  if (index === -1) return
  editingSuccessor.value = queue.value[index + 1]?.id ?? null

  const item = removeQueued(id)
  if (item) composerRef.value?.setContent(item.content)
}

/** 将输入框中未提交的编辑内容按原锚点插回队列 */
const restoreEditing = () => {
  if (editingSuccessor.value === undefined) return
  const content = composerRef.value?.getContent().trim()
  if (content) enqueue(content, undefined, editingSuccessor.value ?? undefined)
  editingSuccessor.value = undefined
}

const handleSend = (content: string, attachments: ChatAttachment[]) => {
  if (props.readonly) return
  // 编辑态提交：插回原锚点位置（会话进行中则留在队列，空闲时由 enqueue 自动消耗队首）
  if (editingSuccessor.value !== undefined) {
    enqueue(content, attachments, editingSuccessor.value ?? undefined)
    editingSuccessor.value = undefined
    return
  }
  send(content, attachments)
}

const handleQuestionSubmit = (answers: AskQuestionAnswer[]) => {
  const pending = pendingQuestion.value
  if (!pending) return
  respondSession(pending.rpcId, true, answers)
}

defineExpose<_AiChatExposed>({
  send,
  abort,
  regenerate,
  clear,
  tokenUsage,
  lastTurnUsage,
  queue,
  startQueued,
  removeQueued,
  enqueue
})
</script>
