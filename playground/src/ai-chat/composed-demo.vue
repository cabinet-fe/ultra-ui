<template>
  <ULayout
    class="composed-demo"
    :cols="panelOpen ? ['1fr', `${panelWidth}px`] : ['1fr']"
    rows="1fr"
    :resizable="panelOpen"
    :col-min-sizes="panelOpen ? [360, 320] : undefined"
  >
    <div class="composed-demo__main">
      <div class="composed-demo__header">
        <span class="composed-demo__badge">无 UAiChat 壳层 · 自由组合模式（无清除会话按钮）</span>
        <div class="composed-demo__actions">
          <UButton size="small" plain @click="triggerStreamingDemo">思考与流式回答</UButton>
          <UButton size="small" plain @click="triggerPanelDemo">打开后台面板</UButton>
          <UButton size="small" plain @click="triggerQuestionDemo">独立提问卡</UButton>
          <UButton size="small" plain @click="triggerBannerAndJobDemo">作业与审批横幅</UButton>
          <UButton size="small" plain @click="triggerQueueDemo">演示入队</UButton>
        </div>
      </div>

      <UAiMessageList
        class="composed-demo__list"
        :messages="messages"
        :welcome="welcomeItems"
        :running="running"
        :tools="demoTools"
        @respond="respondToolCall"
        @regenerate="regenerate"
        @welcome-click="(text) => handleSend(text, [])"
        @open-panel="openPanel"
        @preview-image="openPreview"
      />

      <div v-if="questionState" class="composed-demo__question-wrap">
        <div class="composed-demo__question-head">
          <span>独立 UAiQuestionCard 示例</span>
          <UButton size="small" text @click="questionState = null">收起</UButton>
        </div>
        <UAiQuestionCard
          :questions="questionState.questions"
          :answers="questionState.answers"
          @submit="handleQuestionSubmit"
        />
      </div>

      <UAiApprovalBanner :approvals="approvals" @respond="handleApprovalRespond" />

      <UAiMessageQueue
        :queue="queue"
        @start-now="startQueued"
        @edit="handleQueueEdit"
        @remove="removeQueued"
      />

      <UAiJobBar :jobs="jobs" />

      <UAiComposer
        ref="composerRef"
        :running="running"
        placeholder="输入消息，Enter 发送（此组合刻意不放置清除会话按钮）"
        @send="handleSend"
        @abort="abort"
        @preview-image="openPreview"
      >
        <template #toolbar-left="{ addAttachments, disabled }">
          <UAiContextPicker
            :items="contextItems"
            :disabled="disabled"
            @add-attachments="addAttachments"
            @select="handleContextSelect"
          />
        </template>

        <template #toolbar-right="{ disabled }">
          <UAiContextUsage
            :usage="tokenUsage"
            :last-request-usage="lastRequestUsage"
            :context-window="currentModel?.contextWindow"
            detail
          />
          <UAiModelPicker v-model="model" :models="demoModels" :disabled="disabled" />
          <UAiReasoningPicker
            v-model="reasoningLevel"
            :levels="reasoningLevels"
            :disabled="disabled"
          />
        </template>
      </UAiComposer>

      <UImagePreviewer
        v-model:open="previewOpen"
        :src="previewTarget?.src"
        :alt="previewTarget?.alt"
      />
    </div>

    <UAiSidePanel
      v-if="activePanelCall"
      v-model:fullscreen="panelFullscreen"
      :tool-call="activePanelCall"
      :tool="toolMap[activePanelCall.name]"
      @refresh="handlePanelRefresh"
      @close="activePanelCallId = null"
    />
  </ULayout>
</template>

<script lang="ts" setup>
import {
  type AiChatEmits,
  type AiComposerExposed,
  type AiContextPickerItem,
  type AskQuestionAnswer,
  type AskQuestionItem,
  type ChatAttachment,
  type ChatJob,
  type ChatModelOption,
  type ChatPendingApproval,
  type ChatTool,
  type ChatToolCall,
  type ChatTransport,
  UAiApprovalBanner,
  UAiComposer,
  UAiContextPicker,
  UAiContextUsage,
  UAiJobBar,
  UAiMessageList,
  UAiMessageQueue,
  UAiModelPicker,
  UAiQuestionCard,
  UAiReasoningPicker,
  UAiSidePanel,
  useChat
} from '@veltra/ai'
import { UButton, UImagePreviewer, ULayout, message } from '@veltra/desktop'
import { Books, Delete, Folder, Link, Monitor, Sun } from '@veltra/icons/normal'
import { computed, onBeforeUnmount, reactive, ref, shallowRef, useTemplateRef, watch } from 'vue'

import AdminPanel from './admin-panel.vue'
import WeatherCard from './weather-card.vue'

defineOptions({ name: 'AiChatComposedDemo' })

const demoModels: ChatModelOption[] = [
  {
    id: 'demo-pro',
    providerId: 'local',
    providerLabel: 'Local Mock',
    label: 'Veltra-Pro',
    description: '多档推理演示模型（200K 上下文窗口）',
    contextWindow: 200_000,
    reasoningLevels: [
      { value: 'low', label: '标准' },
      { value: 'high', label: '深度' },
      { value: 'max', label: '极致' }
    ],
    defaultReasoningLevel: 'high'
  },
  {
    id: 'demo-lite',
    providerId: 'local',
    providerLabel: 'Local Mock',
    label: 'Veltra-Lite',
    description: '轻量快速模型（64K 上下文窗口）',
    contextWindow: 64_000
  }
]

const contextItems: AiContextPickerItem[] = [
  {
    key: 'spec',
    label: '注入接口契约',
    description: '附加 OpenAPI 对话字段规范作为文本上下文',
    icon: Books
  },
  {
    key: 'workspace',
    label: '关联当前目录',
    description: '附加 @veltra/ai 组件导出目录结构',
    icon: Folder
  },
  { key: 'doc-link', label: '引用主题规范', description: '附加 --u-* 设计令牌约定说明', icon: Link }
]

const welcomeItems = [
  '展示思考过程与流式代码回答',
  '打开后台用户信息面板（右侧 UAiSidePanel）',
  '查询北京天气（reply 流卡片即答复）',
  '模拟危险操作：删除 /tmp/demo.log（需确认）'
]

const waitMs = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve()
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true }
    )
  })

const streamChunks = (
  chunks: string[],
  emitChunk: (chunk: string) => void,
  signal: AbortSignal,
  intervalMs = 65,
  index = 0
): Promise<void> => {
  if (signal.aborted || index >= chunks.length) return Promise.resolve()
  emitChunk(chunks[index]!)
  return waitMs(intervalMs, signal).then(() =>
    streamChunks(chunks, emitChunk, signal, intervalMs, index + 1)
  )
}

const demoTools: ChatTool[] = [
  {
    name: 'getWeather',
    description: '查询城市实时天气',
    label: '查天气',
    icon: Sun,
    render: WeatherCard,
    renderTo: 'reply',
    terminal: true,
    parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
    execute: async ({ city }: { city: string }, { signal }) => {
      await waitMs(450, signal)
      return {
        city: city || '北京',
        region: '直辖市',
        weather: '晴',
        code: 0,
        temperature: 23,
        feelsLike: 22,
        low: 14,
        high: 25,
        humidity: 36,
        wind: '11 km/h'
      }
    }
  },
  {
    name: 'deleteFile',
    description: '删除指定文件（需要审批确认）',
    label: '删除文件',
    icon: Delete,
    needsConfirm: true,
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    execute: async ({ path }: { path: string }, { signal }) => {
      await waitMs(450, signal)
      return { deleted: path, confirmed: true }
    }
  },
  {
    name: 'openAdminPage',
    description: '在右侧侧边面板打开后台管理页面',
    label: '打开后台页面',
    icon: Monitor,
    render: AdminPanel,
    renderTo: 'panel',
    panelWidth: 420,
    panelTitle: (toolCall) => {
      try {
        const page = JSON.parse(toolCall.arguments || '{}').page as string
        const titleMap: Record<string, string> = {
          'user-form': '编辑用户信息',
          'sales-chart': '查看销售图表',
          'order-list': '管理订单列表'
        }
        return titleMap[page] ?? '后台页面'
      } catch {
        return '后台页面'
      }
    },
    parameters: { type: 'object', properties: { page: { type: 'string' } }, required: ['page'] },
    execute: async ({ page }: { page: string }, { signal }) => {
      await waitMs(350, signal)
      return { page, opened: true }
    }
  }
]

const toolMap = computed<Record<string, ChatTool>>(() =>
  Object.fromEntries(demoTools.map((item) => [item.name, item]))
)

let mockCallSeq = 0

/** 纯前端模拟流式传输层，无需后端代理即可演示完整组件协作 */
const mockTransport: ChatTransport = async (request, handlers) => {
  const last = request.messages[request.messages.length - 1]
  if (last?.role === 'tool') {
    await streamChunks(
      ['工具已执行完成。', '你可以继续输入指令，或在右侧面板中直接操作、刷新或全屏查看。'],
      handlers.onTextDelta,
      request.signal,
      90
    )
    if (!request.signal.aborted) {
      handlers.onUsage?.({ promptTokens: 420, completionTokens: 64, totalTokens: 484 })
    }
    return
  }

  const prompt = last?.content ?? ''
  const attachmentNames = last?.attachments?.map((a) => a.name) ?? []

  if (/面板|后台|panel/i.test(prompt)) {
    await streamChunks(
      ['分析用户意图：需要打开后台系统界面。\n', '准备调用 `openAdminPage` 并挂载到右侧面板…'],
      (d) => handlers.onReasoningDelta?.(d),
      request.signal,
      110
    )
    if (request.signal.aborted) return
    const page = /图表|sales/i.test(prompt)
      ? 'sales-chart'
      : /订单|order/i.test(prompt)
        ? 'order-list'
        : 'user-form'
    handlers.onToolCall?.({
      id: `mock-call-${++mockCallSeq}`,
      name: 'openAdminPage',
      arguments: JSON.stringify({ page })
    })
    handlers.onUsage?.({ promptTokens: 560, completionTokens: 88, totalTokens: 648 })
    return
  }

  if (/天气|weather/i.test(prompt)) {
    await streamChunks(
      ['识别到城市天气查询请求，调用终结式卡片工具 `getWeather`。'],
      (d) => handlers.onReasoningDelta?.(d),
      request.signal,
      110
    )
    if (request.signal.aborted) return
    handlers.onToolCall?.({
      id: `mock-call-${++mockCallSeq}`,
      name: 'getWeather',
      arguments: JSON.stringify({ city: '北京' })
    })
    handlers.onUsage?.({ promptTokens: 390, completionTokens: 42, totalTokens: 432 })
    return
  }

  if (/删除|确认|confirm/i.test(prompt)) {
    await streamChunks(
      ['检测到危险操作请求，将发起需要二次确认的 `deleteFile` 调用。'],
      (d) => handlers.onReasoningDelta?.(d),
      request.signal,
      110
    )
    if (request.signal.aborted) return
    handlers.onToolCall?.({
      id: `mock-call-${++mockCallSeq}`,
      name: 'deleteFile',
      arguments: JSON.stringify({ path: '/tmp/demo.log' })
    })
    handlers.onUsage?.({ promptTokens: 340, completionTokens: 45, totalTokens: 385 })
    return
  }

  await streamChunks(
    [
      `当前选用模型 **${request.model ?? 'demo-pro'}**`,
      request.reasoningLevel ? `（推理档位：${request.reasoningLevel}）。\n` : '。\n',
      '正在整理基于独立原子组件的回复结构…'
    ],
    (d) => handlers.onReasoningDelta?.(d),
    request.signal,
    120
  )
  if (request.signal.aborted) return

  const attSummary = attachmentNames.length
    ? `\n\n已收到附加上下文：**${attachmentNames.join('、')}**。`
    : ''

  await streamChunks(
    [
      '### 原子组件自由组合示例\n\n',
      '本页完全脱离 `UAiChat`，由独立组件拼装而成：',
      '\n- 消息渲染：`UAiMessageList` + `UAiBubble` + `UAiStepGroup`',
      '\n- 工具栏：`UAiContextPicker` + `UAiContextUsage` + `UAiModelPicker` + `UAiReasoningPicker`',
      '\n- 状态编排：`UAiMessageQueue`、`UAiJobBar`、`UAiApprovalBanner`、`UAiQuestionCard`',
      attSummary
    ],
    handlers.onTextDelta,
    request.signal,
    90
  )
  if (!request.signal.aborted) {
    handlers.onUsage?.({
      promptTokens: 680,
      completionTokens: 145,
      totalTokens: 825,
      cacheHitTokens: 320,
      cacheMissTokens: 360
    })
  }
}

const chatProps = reactive({
  transport: mockTransport,
  tools: demoTools,
  models: demoModels,
  systemPrompt: '你是脱离 UAiChat 组合构建的独立组件工作台助手'
})

const chatEmit = ((event: string, arg: unknown) => {
  if (event === 'error' && arg instanceof Error) {
    message.error(arg.message)
  }
}) as AiChatEmits

const {
  messages,
  model,
  reasoningLevel,
  running,
  queue,
  tokenUsage,
  lastRequestUsage,
  send,
  abort,
  regenerate,
  respondToolCall,
  enqueue,
  startQueued,
  removeQueued
} = useChat({ props: chatProps, emit: chatEmit })

const currentModel = computed(() => demoModels.find((item) => item.id === model.value))
const reasoningLevels = computed(() => currentModel.value?.reasoningLevels ?? [])

const composerRef = useTemplateRef<AiComposerExposed>('composerRef')
const editingSuccessor = ref<string | null | undefined>(undefined)

const handleQueueEdit = (id: string) => {
  const index = queue.value.findIndex((item) => item.id === id)
  if (index === -1) return
  editingSuccessor.value = queue.value[index + 1]?.id ?? null
  const removed = removeQueued(id)
  if (removed) composerRef.value?.setContent(removed.content)
}

const handleSend = (content: string, attachments: ChatAttachment[]) => {
  if (editingSuccessor.value !== undefined) {
    enqueue(content, attachments, editingSuccessor.value ?? undefined)
    editingSuccessor.value = undefined
    return
  }
  send(content, attachments)
}

const handleContextSelect = (item: AiContextPickerItem) => {
  const contentMap: Record<string, string> = {
    spec: '{\n  "endpoint": "/api/ai/chat",\n  "mode": "responses"\n}',
    workspace: 'packages/ai/src/components/{ai-composer,ai-message-list,ai-side-panel}',
    'doc-link': '遵循 @veltra/styles token：var(--u-bg-color-top) 与 var(--u-text-color-main)'
  }
  const textContent = contentMap[item.key] ?? item.description ?? item.label
  const attachment: ChatAttachment = {
    name: `${item.key}-context.txt`,
    mimeType: 'text/plain',
    size: new Blob([textContent]).size,
    dataUrl: '',
    textContent
  }
  composerRef.value?.addAttachments([attachment])
  composerRef.value?.focus()
}

/** 面板工具管理：脱离 UAiChat 时由宿主自行追踪 panelCalls 与当前聚焦 call */
const panelWidth = ref(420)
const panelFullscreen = ref(false)
const activePanelCallId = ref<string | null>(null)

const panelCalls = computed<ChatToolCall[]>(() => {
  const calls: ChatToolCall[] = []
  for (const msg of messages.value) {
    if (msg.role !== 'assistant' || !msg.toolCalls) continue
    for (const call of msg.toolCalls) {
      if (toolMap.value[call.name]?.renderTo === 'panel') calls.push(call)
    }
  }
  return calls
})

const activePanelCall = computed(() => {
  if (!activePanelCallId.value) return null
  return panelCalls.value.find((call) => call.id === activePanelCallId.value) ?? null
})

const panelOpen = computed(() => activePanelCall.value != null)

watch(
  () => panelCalls.value[panelCalls.value.length - 1]?.id,
  (id) => {
    if (id) activePanelCallId.value = id
  }
)

const openPanel = (toolCallId: string) => {
  if (panelCalls.value.some((call) => call.id === toolCallId)) {
    activePanelCallId.value = toolCallId
  }
}

const handlePanelRefresh = () => {
  message.info('已刷新侧边面板渲染实例')
}

/** 图片预览：脱离 UAiChat 时由宿主监听 preview-image 后打开 UImagePreviewer */
const previewOpen = ref(false)
const previewTarget = shallowRef<{ src: string; alt?: string } | null>(null)

const openPreview = (src: string, alt?: string) => {
  if (!src) return
  previewTarget.value = { src, alt }
  previewOpen.value = true
}

/** 独立 UAiQuestionCard 示例状态 */
const questionState = ref<{ questions: AskQuestionItem[]; answers?: AskQuestionAnswer[] } | null>(
  null
)

const triggerQuestionDemo = () => {
  questionState.value = {
    questions: [
      {
        header: '部署方式',
        question: '请选择期望的对话接入模式',
        options: [
          { label: '独立组件自由拼装 (推荐)', description: '自由控制工具栏插槽与状态编排' },
          { label: 'UAiChat 完整壳层', description: '开箱即用的内置布局与全部默认控件' }
        ]
      },
      {
        header: '扩展能力',
        question: '需要开启哪些增强能力？（可多选）',
        multiple: true,
        options: ['上下文用量明细', '自定义上下文选项', '右侧工具面板']
      }
    ]
  }
}

const handleQuestionSubmit = (answers: AskQuestionAnswer[]) => {
  if (!questionState.value) return
  questionState.value = { ...questionState.value, answers }
  message.success('已记录独立提问卡回答')
}

/** 独立 UAiApprovalBanner 与 UAiJobBar 示例状态 */
const approvals = ref<ChatPendingApproval[]>([])
const jobs = ref<ChatJob[]>([])
let jobTimer: ReturnType<typeof setTimeout> | undefined

const triggerBannerAndJobDemo = () => {
  clearTimeout(jobTimer)
  approvals.value = [
    {
      approvalId: 'appr-demo-1',
      toolName: 'syncDatabase',
      reason: '执行敏感操作：同步生产库只读索引缓存',
      rpcId: 'rpc-demo-1'
    }
  ]
  jobs.value = [
    { id: 'job-1', kind: 'bash', label: '构建类型索引与样式映射', status: 'running' },
    { id: 'job-2', kind: 'fs', label: '读取工作区上下文文件', status: 'done' }
  ]
  jobTimer = setTimeout(() => {
    jobs.value = jobs.value.map((job) =>
      job.id === 'job-1' ? { id: job.id, kind: job.kind, label: job.label, status: 'done' } : job
    )
  }, 1800)
}

const handleApprovalRespond = (rpcId: string, approved: boolean) => {
  approvals.value = approvals.value.filter((item) => item.rpcId !== rpcId)
  message[approved ? 'success' : 'info'](approved ? '已允许审批请求' : '已拒绝审批请求')
}

const triggerStreamingDemo = () => handleSend('展示思考过程与流式代码回答', [])
const triggerPanelDemo = () => handleSend('打开后台用户信息面板', [])

const triggerQueueDemo = () => {
  if (!running.value) {
    handleSend('展示思考过程与流式代码回答', [])
  }
  enqueue('排队问题：请补充组件插槽扩展要点')
}

onBeforeUnmount(() => {
  clearTimeout(jobTimer)
})
</script>

<style scoped>
.composed-demo {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  background-color: var(--u-bg-color-bottom);
}

.composed-demo__main {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px var(--u-gap-default) var(--u-gap-default);
  box-sizing: border-box;
}

.composed-demo__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--u-radius-default);
  background-color: var(--u-bg-color-top);
  box-shadow: var(--u-shadow-sm);
}

.composed-demo__badge {
  font-size: 12px;
  font-weight: 500;
  color: var(--u-text-color-second);
}

.composed-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.composed-demo__list {
  flex: 1;
  min-height: 0;
}

.composed-demo__question-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.composed-demo__question-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--u-text-color-assist);
}
</style>
