---
title: "UAiChat - AI 对话"
description: "用必填 transport 接入 UAiChat，生产环境走相对路径代理、不要把 API Key 写进浏览器"
---

# UAiChat - AI 对话

## 引入

```ts
import { UAiChat } from '@veltra/ai'
```

## 示例

`UAiChat` 必须传入 `transport`。OpenAI 兼容的 `chat/completions` SSE 用 `createOpenAITransport({ providers })`；其它协议实现 `ChatTransport`。根节点高度为 `100%`，外层容器要有明确高度。样式：`import '@veltra/ai/style'`，或用 `VeltraUIResolver` 解析 `<u-ai-chat>`。

模型 `id` 跨 Provider 必须全局唯一。生产环境只写相对路径 `endpoint`，由后端代理持有密钥；**不要把 API Key 写进浏览器代码**。`apiKey` 仅适合本机调试。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UAiChat, createOpenAITransport } from '@veltra/ai'
import '@veltra/ai/style'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'proxy',
      label: '业务代理',
      endpoint: '/api/ai/chat',
      models: [{ id: 'gpt-4o-mini', label: 'GPT-4o mini' }]
    }
  ]
})

const model = ref(transport.defaultModel)
</script>

<template>
  <div style="height: 100vh">
    <u-ai-chat
      v-model:model="model"
      :transport="transport"
      :models="transport.models"
      placeholder="输入问题"
    />
  </div>
</template>
```

带工具时传入 `ChatTool[]`。发给模型的只有 `name` / `description` / `parameters`；`execute` 与 `needsConfirm` 只在本端执行。

```vue
<script setup lang="ts">
import { UAiChat, createOpenAITransport, type ChatTool } from '@veltra/ai'
import '@veltra/ai/style'

const transport = createOpenAITransport({
  providers: [{ id: 'proxy', endpoint: '/api/ai/chat', models: [{ id: 'gpt-4o-mini' }] }]
})

const tools: ChatTool[] = [
  {
    name: 'lookup_order',
    description: '按订单号查询状态',
    parameters: {
      type: 'object',
      properties: { orderId: { type: 'string' } },
      required: ['orderId']
    },
    execute: async ({ orderId }: { orderId: string }) => {
      const res = await fetch(`/api/orders/${orderId}`)
      return res.json()
    }
  }
]
</script>

<template>
  <div style="height: 640px">
    <u-ai-chat :transport="transport" :tools="tools" />
  </div>
</template>
```

无头自绘 UI 用同包 `useChat`，props 形状与 `UAiChat` 相同，同样必须传 `transport`。服务端会话用 `createServerTransport(adapter)`。

## API / 类型

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export interface ChatSessionTransport {
  readonly kind: 'session'
  open(handlers: { onEvent(event: ChatSessionEvent): void; onDisconnect?(): void }): () => void
  send(content: string, attachments?: ChatAttachment[]): Promise<void>
  cancel(): Promise<void>
  respond(rpcId: string, ok: boolean, value?: unknown): Promise<void>
  fetchHistory(beforeSeq?: number): Promise<{ events: ChatSessionEvent[]; hasMore: boolean }>
  selectModel(provider: string, model: string): Promise<void>
}

export interface ChatAttachment {
  /** 文件名 */
  name: string
  /** MIME 类型 */
  mimeType: string
  /** 字节大小 */
  size: number
  /** base64 data URL */
  dataUrl: string
}

export interface ChatMessage {
  /** 消息 id */
  id: string
  /** 角色 */
  role: 'user' | 'assistant' | 'tool'
  /** markdown 内容 */
  content: string
  /** 思考过程（reasoning） */
  reasoning?: string
  /** 用户消息携带的附件 */
  attachments?: ChatAttachment[]
  /** assistant 消息上的工具调用列表 */
  toolCalls?: ChatToolCall[]
  /** role 为 tool 时关联的工具调用 id */
  toolCallId?: string
  /** 消息状态，仅 assistant 消息使用 */
  status?: 'streaming' | 'done' | 'error' | 'aborted'
}

export interface ChatQueuedMessage {
  /** 队列项 id */
  id: string
  /** 消息内容 */
  content: string
  /** 携带的附件 */
  attachments?: ChatAttachment[]
}

export interface ChatTokenUsage {
  /** 输入 token */
  promptTokens: number
  /** 输出 token */
  completionTokens: number
  /** 合计 token */
  totalTokens: number
  /**
   * 缓存命中。
   * 来源：`prompt_tokens_details.cached_tokens` / `prompt_cache_hit_tokens` /
   * `cache_read_input_tokens` / `cached_tokens`。
   */
  cacheHitTokens?: number
  /**
   * 缓存未命中。
   * 来源：`prompt_cache_miss_tokens`；若无该字段但有命中与 prompt，则为 prompt − 命中。
   */
  cacheMissTokens?: number
  /** 写入缓存（Anthropic 风格 `cache_creation_input_tokens`），有才有 */
  cacheCreationTokens?: number
}

export interface ChatTool<A = any> {
  /** 工具名（传给模型，需唯一） */
  name: string
  /** 工具描述（传给模型） */
  description: string
  /** 参数 JSON Schema（原样传给模型） */
  parameters: Record<string, unknown>
  /** 执行前是否需要用户在 UI 中确认 */
  needsConfirm?: boolean
  /** 工具图标组件，缺省用内置状态图标（状态颜色/加载旋转仍作用于图标容器） */
  icon?: Component
  /** 工具显示名，缺省取 name */
  label?: string
  /**
   * 自定义工具卡片内容渲染（组件或渲染函数），props 为 ChatToolRenderProps。
   * 设置后替换卡片 body 的默认参数/结果展示；优先级高于 tool-<name> 插槽。
   * renderTo 为 'panel' 时改为在右侧侧边面板中渲染。
   */
  render?: Component
  /**
   * 渲染位置。缺省 'inline'：render 组件展示在会话内的工具卡片中；
   * 'panel'：render 组件展示在对话区右侧的侧边面板（新调用自动打开面板，
   * 工具卡片内仅保留「查看面板」入口，面板与会话区宽度可拖拽调节）。
   * 适合打开后台页面、表单、图表、列表等需要较大交互区域的工具。
   */
  renderTo?: 'inline' | 'panel'
  /**
   * 侧边面板默认宽度（px，最小 320），仅 renderTo: 'panel' 时生效。
   * 聚焦到该工具的调用时应用；缺省时面板打开取「容器宽 - 860」（即默认尽可能大，
   * 给会话区保留 860px）；面板已打开时切换聚焦保持当前宽度（含用户拖拽结果）。
   */
  panelWidth?: number
  /**
   * 侧边面板标题，仅 renderTo: 'panel' 时生效。
   * 面板标题通常是「业务对象 + 动作」（如「编辑用户 · 张三」）而非工具名，
   * 可传固定字符串，或传函数按本次调用的参数动态生成。缺省取 label ?? name。
   */
  panelTitle?: string | ((toolCall: ChatToolCall) => string)
  /** 执行完成后是否自动折叠。缺省：renderTo 为 'panel' 时为 true；否则设置了 render 时为 false，否则为 true */
  autoCollapse?: boolean
  /**
   * 终结工具：执行成功后对话即结束，结果不再回灌模型生成额外文字（工具 UI 即最终答复）。
   * 适合天气卡片这类"UI 即答案"的工具，需配合 render 或 tool-<name> 插槽提供完整结果 UI。
   * 工具结果仍会记录到消息历史供后续轮次使用；执行失败/被拒绝时错误照常回灌模型。
   */
  terminal?: boolean
  /** 工具实现，返回值（或 Promise 返回值）会被 JSON 序列化后回灌给模型 */
  execute: (args: A, ctx: ChatToolContext) => unknown
}

export interface ChatToolCall {
  /** 调用 id（由模型生成） */
  id: string
  /** 工具名 */
  name: string
  /** 模型输出的原始 JSON 参数串 */
  arguments: string
  /** 调用状态 */
  status: ToolCallStatus
  /** 序列化后的工具执行结果 */
  result?: string
  /** 执行失败信息 */
  error?: string
  /** 服务端下发的展示视图原文（session 模式可选） */
  view?: unknown
}

export interface ChatToolMeta {
  /** 与服务端 tool/call.name 匹配 */
  name: string
  /** 覆盖通用图标 */
  icon?: Component
  /** 工具显示名，缺省取 name */
  label?: string
  /** 自定义卡片/面板渲染，props 为 ChatToolRenderProps */
  render?: Component
  /** 渲染位置，语义同 ChatTool.renderTo */
  renderTo?: 'inline' | 'panel'
  /** 侧边面板默认宽度，语义同 ChatTool.panelWidth */
  panelWidth?: number
  /** 侧边面板标题，语义同 ChatTool.panelTitle */
  panelTitle?: string | ((toolCall: ChatToolCall) => string)
  /** 执行完成后是否自动折叠 */
  autoCollapse?: boolean
}

export type ChatTransport = (
  request: ChatTransportRequest,
  handlers: ChatTransportHandlers
) => Promise<void> | void

import type { Component, Ref } from 'vue'

export interface AiChatProps {
  /** 传输层（必填）；函数型 ChatTransport 或 session 对象，可使用 createOpenAITransport / createServerTransport */
  transport: ChatTransport | ChatSessionTransport
  /**
   * 工具列表。函数 transport 传入 ChatTool[]（必有 execute）；
   * session 下可为 ChatToolMeta[]（仅渲染元信息）。ChatTool[] 仍可赋值。
   */
  tools?: (ChatTool | ChatToolMeta)[]
  /** 系统提示词 */
  systemPrompt?: string
  /**
   * 单次发送允许的最大生成轮次（一轮 = 一次模型生成 + 可能的工具执行），默认 10。
   * 模型持续调用工具不收敛时，达到上限即停止继续请求并发出 finish，防止失控循环。
   */
  maxToolRounds?: number
  /** 消息列表，支持 v-model:messages 受控 */
  messages?: ChatMessage[]
  /**
   * 可选模型列表；有值则在输入栏展示模型选择器。
   * 可从 createOpenAITransport() 返回值的 `.models` 直接传入。
   */
  models?: ChatModelOption[]
  /** 当前模型 id，支持 v-model:model */
  model?: string
  /** 当前推理等级，支持 v-model:reasoning-level */
  reasoningLevel?: string
  /** 空闲时输入框上方的快捷提问（点击即发送）；字符串按单项处理 */
  welcome?: string | string[]
  /** 输入框占位文本 */
  placeholder?: string
  /** 附件 accept 类型，默认 image/* */
  accept?: string
  /** 单个附件最大字节数，默认 10MB */
  maxAttachmentSize?: number
  /** 透传给内部 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
  /**
   * 是否展示 token 用量明细（缓存命中 / 未命中；缺字段不显示）。
   * 默认 false：仅在拿到 usage 时显示会话累计「总 token」。接口未返回 usage 时不展示。
   */
  tokenUsageDetail?: boolean
  /**
   * 覆盖包内 toolName → icon 映射（精确名优先于内置名称规则）。
   * 缺省不传则走内置表；未命中的名称仍用兜底图标，不得 throw。
   */
  toolIcons?: Record<string, Component>
  /** 只读：不展示输入区、欢迎语不可发送、队列无插队/编辑/移除。默认 false */
  readonly?: boolean
}

export interface AiChatEmits {
  /** 消息列表变化 */
  (e: 'update:messages', messages: ChatMessage[]): void
  /** 当前模型变化 */
  (e: 'update:model', model: string | undefined): void
  /** 当前推理等级变化 */
  (e: 'update:reasoningLevel', reasoningLevel: string | undefined): void
  /** 用户发送消息 */
  (e: 'send', message: ChatMessage): void
  /** 一轮对话完成（无更多工具调用、命中 terminal 工具或达到 maxToolRounds 上限） */
  (e: 'finish', message: ChatMessage): void
  /** 对话出错 */
  (e: 'error', error: Error): void
  /** 模型发起工具调用 */
  (e: 'tool-call', toolCall: ChatToolCall): void
}

export interface _AiChatExposed {
  /** 发送一条用户消息（会话进行中时进入待发送队列） */
  send: (content: string, attachments?: ChatAttachment[]) => void
  /** 中断当前生成（保留待发送队列） */
  abort: () => void
  /** 重新生成最后一条 assistant 回复 */
  regenerate: () => void
  /** 清空消息、待发送队列与 token 统计（生成中会先中止） */
  clear: () => void
  /** 当前会话累计 token（从未收到 usage 时为 null） */
  tokenUsage: Ref<ChatTokenUsage | null>
  /** 最近一轮用户对话的 token（含工具多轮请求；该轮无 usage 时为 null） */
  lastTurnUsage: Ref<ChatTokenUsage | null>
  /** 待发送消息队列（会话进行中提交的消息按序排队，收尾后 FIFO 自动接续） */
  queue: Ref<ChatQueuedMessage[]>
  /** 立即执行队列中的某条：中断当前会话并插队为下一条 */
  startQueued: (id: string) => void
  /** 从队列移除某条（返回被移除项） */
  removeQueued: (id: string) => ChatQueuedMessage | undefined
  /** 向队列插入一条消息（beforeId 插到某条之前，缺省追加尾部；空闲时自动消耗队首） */
  enqueue: (content: string, attachments?: ChatAttachment[], beforeId?: string) => ChatQueuedMessage
}

export type AiChatExposed = DeconstructValue<_AiChatExposed>
```

### 辅助工具

本组件通常配合以下工具来使用。

#### useChat

与 UI 解耦的对话状态机；`UAiChat` 内部即用它，无头场景直接调用。

使用示例:

```ts
import { useChat } from '@veltra/ai'
```

#### createOpenAITransport

OpenAI 兼容 SSE transport；按 `request.model` 选择 Provider。

使用示例:

```ts
import { createOpenAITransport } from '@veltra/ai'
```

## 避坑与使用要点

- `transport` 必填。函数型 transport 用 `createOpenAITransport`；生产环境不要把 API Key 下发到浏览器。无头场景用 `useChat`。
