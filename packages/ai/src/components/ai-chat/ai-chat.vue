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
      <MessageList
        :messages="messages"
        :welcome="welcome"
        :running="running"
        :renderer-props="rendererProps"
        @respond="respondToolCall"
        @regenerate="regenerate"
        @welcome-click="(text) => handleSend(text, [])"
      >
        <template v-if="$slots.welcome" #welcome>
          <slot name="welcome" />
        </template>
      </MessageList>

      <QueueList
        :queue="queue"
        @start-now="startQueued"
        @edit="handleQueueEdit"
        @remove="removeQueued"
      />

      <ChatInput
        ref="chatInputRef"
        v-model:model="model"
        v-model:reasoning-level="reasoningLevel"
        :running="running"
        :models="models"
        :placeholder="placeholder"
        :accept="accept"
        :max-attachment-size="maxAttachmentSize"
        @send="handleSend"
        @abort="abort"
      />
    </div>

    <!-- 侧边面板（renderTo: 'panel' 的工具渲染区），与会话区宽度经 ULayout 拖拽手柄调节 -->
    <SidePanel
      v-if="activePanelCall"
      ref="panelRef"
      :tool-call="activePanelCall"
      @close="closePanel"
    />
  </ULayout>
</template>

<script lang="ts" setup>
import { useResizeObserver } from '@veltra/compositions'
import { ULayout } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, provide, ref, useSlots, useTemplateRef, watch } from 'vue'

import type { ChatAttachment, ChatToolCall } from '../../chat/types'
import { useChat } from '../../chat/use-chat'
import { createBuiltinTools } from '../../tools'
import type { _AiChatExposed, AiChatEmits, AiChatProps } from '../../types'
import ChatInput from './chat-input.vue'
import { AiChatDIKey } from './di'
import MessageList from './message-list.vue'
import QueueList from './queue-list.vue'
import SidePanel from './side-panel.vue'

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

/** 内置 + 用户工具（同名内置优先），供工具卡片解析 icon/label/render/renderTo/autoCollapse */
const toolMap = computed(() => {
  const builtins = createBuiltinTools()
  const names = new Set(builtins.map((t) => t.name))
  const tools = [...builtins, ...(props.tools ?? []).filter((t) => !names.has(t.name))]
  return Object.fromEntries(tools.map((t) => [t.name, t]))
})

const {
  messages,
  model,
  reasoningLevel,
  running,
  queue,
  send,
  abort,
  regenerate,
  clear,
  respondToolCall,
  enqueue,
  startQueued,
  removeQueued
} = useChat({ props, emit })

/** 空会话（无可见消息）：输入区垂直居中；欢迎区钉在滚动容器外、贴于输入框上方 */
const isEmpty = computed(() => !messages.value.some((msg) => msg.role !== 'tool'))

/** 所有 renderTo: 'panel' 的工具调用（按消息顺序，面板内容的来源） */
const panelCalls = computed(() => {
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

provide(AiChatDIKey, { cls, slots, tools: toolMap, openPanel })

/**
 * 面板宽度：经 ULayout 列轨施加（cols = 1fr + 面板宽度），
 * 拖拽手柄由 ULayout 提供（colMinSizes 约束会话区 / 面板最小宽度）。
 */
const PANEL_MIN_WIDTH = 320
const MAIN_MIN_WIDTH = 360
/** 面板打开时默认给会话区留的宽度（即面板默认尽可能大） */
const MAIN_DEFAULT_WIDTH = 860

const layoutRef = useTemplateRef<InstanceType<typeof ULayout>>('layoutRef')
const panelRef = useTemplateRef<InstanceType<typeof SidePanel>>('panelRef')
const panelWidth = ref(PANEL_MIN_WIDTH)
const resizing = ref(false)

const layoutCols = computed(() => {
  return panelOpen.value ? ['1fr', `${panelWidth.value}px`] : ['1fr']
})

const containerWidth = () => (layoutRef.value?.$el as HTMLElement | undefined)?.clientWidth ?? 0

/** 面板默认宽度：容器宽减去会话区默认保留宽度（缺省给会话区留 MAIN_DEFAULT_WIDTH） */
const defaultPanelWidth = () => {
  const width = containerWidth()
  return width ? width - MAIN_DEFAULT_WIDTH : 420
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
// 应用默认宽（会话区留 860px）；面板已打开时切换聚焦保持当前宽度（含用户拖拽结果）
watch(activePanelCall, (call, prevCall) => {
  if (!call) return
  const toolWidth = toolMap.value[call.name]?.panelWidth
  const width = toolWidth ?? (prevCall ? undefined : defaultPanelWidth())
  if (typeof width !== 'number') return
  panelWidth.value = clampPanelWidth(width)
})

// 跟踪面板实际宽度（含用户拖拽结果）：面板关闭重开、切换到未指定宽度的工具时保持
useResizeObserver({
  targets: computed(() => (panelRef.value?.$el as HTMLElement | undefined) ?? undefined),
  onResize(entries) {
    // borderBoxSize 随通知携带（含边框、零布局开销），不读 offsetWidth/clientWidth
    const inlineSize = entries[0]?.borderBoxSize?.[0]?.inlineSize
    if (!inlineSize) return
    const width = Math.round(inlineSize)
    // 滞回：忽略亚像素/边框级的微小偏差（< 2px），阻断任何「观测→回写→再观测」的微缩反馈回路
    if (Math.abs(width - panelWidth.value) < 2) return
    panelWidth.value = width
  }
})

const chatInputRef = useTemplateRef<InstanceType<typeof ChatInput>>('chatInputRef')

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
  if (item) chatInputRef.value?.setContent(item.content)
}

/** 将输入框中未提交的编辑内容按原锚点插回队列 */
const restoreEditing = () => {
  if (editingSuccessor.value === undefined) return
  const content = chatInputRef.value?.getContent().trim()
  if (content) enqueue(content, undefined, editingSuccessor.value ?? undefined)
  editingSuccessor.value = undefined
}

const handleSend = (content: string, attachments: ChatAttachment[]) => {
  // 编辑态提交：插回原锚点位置（会话进行中则留在队列，空闲时由 enqueue 自动消耗队首）
  if (editingSuccessor.value !== undefined) {
    enqueue(content, attachments, editingSuccessor.value ?? undefined)
    editingSuccessor.value = undefined
    return
  }
  send(content, attachments)
}

defineExpose<_AiChatExposed>({
  send,
  abort,
  regenerate,
  clear,
  queue,
  startQueued,
  removeQueued,
  enqueue
})
</script>
