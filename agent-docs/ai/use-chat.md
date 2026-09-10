---
title: useChat 对话状态机与传输层
description: "@veltra/ai 的无头对话状态机 useChat 与传输层：createOpenAITransport（OpenAI 兼容 SSE）、自定义 ChatTransport 实现契约、createServerTransport 服务端会话；覆盖发送、中断、重新生成、清空、待发送队列与 token 统计。"
aliases: [use-chat, 对话状态机, Chat Hook, AI 对话 Hook]
keywords: [UAiChat, createOpenAITransport, createServerTransport, ChatTransport, ChatSessionEvent, SSE, 流式, 对话状态机, 打字机, 中断, 重新生成, 清空会话, 待发送队列, onTextDelta, onToolCall, onUsage, reasoning_effort, apiKey, 服务端代理, respondToolCall]
---

# useChat 对话状态机与传输层

`@veltra/ai` 导出与 UI 解耦的对话状态机 `useChat`，以及三种互斥的传输层形态：内置 `createOpenAITransport`（OpenAI 兼容 `chat/completions` SSE）、自定义函数 `ChatTransport`、服务端会话 `createServerTransport(adapter)`。`UAiChat` 内部即调用 `useChat`；自绘 UI 的无头场景直接使用本篇 API。

## 快速上手

无头场景下 `useChat` 与 `UAiChat` 共用同一套 `AiChatProps` / `AiChatEmits` 形状：`transport` 必填。无头 UI 不依赖组件样式，可不引入 `@veltra/ai/style`。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useChat, createOpenAITransport, type AiChatEmits } from '@veltra/ai'

// 指向服务端代理；API Key 只存在服务端
const transport = createOpenAITransport({
  providers: [{ id: 'proxy', endpoint: 'https://<你的代理地址>/chat/completions', models: [{ id: '<模型id>' }] }]
})

// 无头时自行实现 emit：按事件名分发给自己的逻辑
// 无头时自行实现 emit：按事件名分发给自己的逻辑（三处示例同此实现）
const emit = ((event: string, ...args: unknown[]) => { if (event === 'error') console.error(args[0]) }) as AiChatEmits

const chat = useChat({ props: { transport, systemPrompt: '你是业务助手' }, emit })

const input = ref('')
const send = () => {
  chat.send(input.value) // 空内容为空操作；生成中自动进入待发送队列
  input.value = ''
}
</script>

<template>
  <div>
    <div v-for="msg in chat.messages.value" :key="msg.id"><b>{{ msg.role }}</b>：{{ msg.content }}</div>
    <input v-model="input" @keydown.enter="send" />
    <button v-if="chat.running.value" type="button" @click="chat.abort()">停止</button>
  </div>
</template>
```

## API 签名

```ts
import type { Ref } from 'vue'
import type { AskQuestionItem } from '@veltra/ai'
import type { ChatAttachment, ChatJob, ChatMessage, ChatQueuedMessage, ChatTokenUsage,
  ChatTool, ChatToolCall, ChatTransport, ChatSessionTransport, ChatModelOption } from '@veltra/ai'

/** useChat 入参：与 UAiChat 的 props / emit 同形 */
export interface UseChatOptions { props: import('@veltra/ai').AiChatProps; emit: import('@veltra/ai').AiChatEmits }

export function useChat(options: UseChatOptions): {
  /** 消息列表（受控：props.messages 有值时受 v-model:messages 双向绑定） */
  messages: Ref<ChatMessage[]>
  /** 当前模型 id；models 有值时自动校正为合法项 */
  model: Ref<string | undefined>
  /** 当前推理等级；切换模型时校正（无 levels 清空，非法值落到默认/首项） */
  reasoningLevel: Ref<string | undefined>
  /** 是否生成中（含工具执行与多轮循环） */
  running: Ref<boolean>
  /** 待发送队列（函数 transport 下有效；session 下由 queue/snapshot 事件整体替换） */
  queue: Ref<ChatQueuedMessage[]>
  /** 服务端下发的作业条；函数 transport 下恒为 [] */
  jobs: Ref<ChatJob[]>
  /** 会话累计 token；从未收到 usage 时为 null */
  tokenUsage: Ref<ChatTokenUsage | null>
  /** 最近一轮用户对话（含工具多轮请求）的 token；该轮无 usage 时为 null */
  lastTurnUsage: Ref<ChatTokenUsage | null>
  /** session 投影数据（projection 事件写入）；函数 transport 下恒为 {} */
  projections: Ref<Record<string, unknown>>
  /** session 下发的会话标题；函数 transport 下恒为 null */
  title: Ref<string | null>
  /** session 审批数据（approval/requested 事件写入） */
  pendingApprovals: Ref<ChatPendingApproval[]>
  /** session 提问工具的待回答问题 */
  pendingQuestion: Ref<{ questions: AskQuestionItem[]; rpcId: string } | null>
  send(content: string, attachments?: ChatAttachment[]): void
  abort(): void
  regenerate(): void
  clear(): void
  respondToolCall(toolCallId: string, approved: boolean): void
  respondSession(rpcId: string, ok: boolean, value?: unknown): void
  enqueue(content: string, attachments?: ChatAttachment[], beforeId?: string): ChatQueuedMessage
  startQueued(id: string): void
  removeQueued(id: string): ChatQueuedMessage | undefined
}

/** transport 请求参数 */
export interface ChatTransportRequest {
  /** 完整消息历史（不含本轮刚插入的 assistant 占位消息） */
  messages: ChatMessage[]
  /** 系统提示词 */
  systemPrompt?: string
  /** 可用工具（含自动注入的内置 askQuestion） */
  tools?: ChatTool[]
  /** 选中的模型 id（内置 OpenAI transport 按此路由 Provider） */
  model?: string
  /** 选中的推理等级（不透明字符串，由 Provider.applyReasoning 写入请求体） */
  reasoningLevel?: string
  /** 中断信号 */
  signal: AbortSignal
}

export interface ChatTransportHandlers {
  /** 文本增量（打字机输出必经此回调，不调用则消息内容为空） */
  onTextDelta(delta: string): void
  /** 思考内容增量 */
  onReasoningDelta?(delta: string): void
  /** 一次完整的工具调用；参数必须为完整 JSON 串，禁止分片回调 */
  onToolCall?(call: { id: string; name: string; arguments: string }): void
  /** 本次请求的 token 用量；接口未返回 usage 时禁止调用、禁止填 0 */
  onUsage?(usage: ChatTokenUsage): void
  /** 请求错误；signal.aborted 后禁止再调用 */
  onError?(error: Error): void
}

/** 对话传输层抽象：函数形态，与 session 对象形态互斥；内置实现为 createOpenAITransport */
export type ChatTransport = (request: ChatTransportRequest, handlers: ChatTransportHandlers) => Promise<void> | void

export interface OpenAITransportOptions {
  /** 至少一个 Provider；模型 id 须跨 Provider 全局唯一 */
  providers: ChatProvider[]
  /** 全局额外请求头（与各 Provider headers 合并，Provider 优先） */
  headers?: Record<string, string>
  /** 全局额外请求体字段，如 temperature、top_p */
  body?: Record<string, unknown>
}

/** 带扁平模型列表元数据的 OpenAI 兼容 transport */
export type OpenAITransport = ChatTransport & {
  /** 供 UI 使用的扁平模型列表 */
  readonly models: ChatModelOption[]
  /** 默认模型 id（首个 Provider 的首个模型） */
  readonly defaultModel: string
}

export function createOpenAITransport(options: OpenAITransportOptions): OpenAITransport

/** 模型服务商配置（内嵌 models） */
export interface ChatProvider {
  id: string
  /** UI 显示名 */
  label?: string
  /** 完整 http(s) URL 或相对路径，如 /api/ai/chat */
  endpoint: string
  /** API Key（有则带 Authorization: Bearer；相对路径代理场景可省略，走 cookie/headers） */
  apiKey?: string
  /** Provider 级额外请求头 */
  headers?: Record<string, string>
  /** 将选中推理等级写入 body；缺省 body.reasoning_effort = level */
  applyReasoning?: (level: string, body: Record<string, unknown>) => void
  /** 至少一个模型，否则创建时抛错 */
  models: ChatModel[]
}

/** 服务端会话 transport：对象形态（kind: 'session'），与函数型 ChatTransport 互斥 */
export interface ChatSessionTransport {
  readonly kind: 'session'
  /** 订阅事件流；返回 disposer（useChat 在 transport 更换/组件卸载时调用） */
  open(handlers: { onEvent(event: ChatSessionEvent): void; onDisconnect?(): void }): () => void
  send(content: string, attachments?: ChatAttachment[]): Promise<void>
  cancel(): Promise<void>
  respond(rpcId: string, ok: boolean, value?: unknown): Promise<void>
  /** beforeSeq 缺省时从最早拉起 */
  fetchHistory(beforeSeq?: number): Promise<{ events: ChatSessionEvent[]; hasMore: boolean }>
  selectModel(provider: string, model: string): Promise<void>
}

/** 协议翻译层：由宿主按自有协议实现；时序校验/断线补拉/in-flight 去重由 createServerTransport 完成。方法签名与 ChatSessionTransport 完全一致（open 换成 subscribe） */
export interface ChatSessionAdapter {
  subscribe(handlers: { onEvent(event: ChatSessionEvent): void; onDisconnect?(): void }): () => void
  send(content: string, attachments?: ChatAttachment[]): Promise<void>
  cancel(): Promise<void>
  respond(rpcId: string, ok: boolean, value?: unknown): Promise<void>
  fetchHistory(beforeSeq?: number): Promise<{ events: ChatSessionEvent[]; hasMore: boolean }>
  selectModel(provider: string, model: string): Promise<void>
}

/** 用 adapter 包出 ChatSessionTransport */
export function createServerTransport(adapter: ChatSessionAdapter): ChatSessionTransport

/** 仅带 kind: 'session' 的对象为 true；函数 / null / 无 kind 均为 false */
export function isServerTransport(t: unknown): t is ChatSessionTransport

/** 协议无关的归一化会话事件 */
export type ChatSessionEvent =
  | { type: 'user/message'; messageId: string; seq: number; content: string; attachments?: ChatAttachment[] }
  | { type: 'assistant/chunk'; messageId: string; seq: number; delta: string; reasoningDelta?: string }
  | { type: 'assistant/message'; messageId: string; seq: number; content: string; reasoning?: string; toolCalls?: ChatToolCall[] }
  | { type: 'tool/call'; callId: string; name: string; arguments: string; seq: number; view?: unknown }
  | { type: 'tool/result'; callId: string; status: 'success' | 'error' | 'rejected'; result?: string; error?: string; seq: number; view?: unknown }
  | { type: 'approval/requested'; approvalId: string; toolName: string; callId?: string; reason?: string; rpcId: string }
  | { type: 'approval/resolved'; approvalId: string; outcome: string }
  | { type: 'question/requested'; questions: AskQuestionItem[]; rpcId: string }
  | { type: 'question/resolved'; questionRpcId: string; outcome: 'answered' | 'cancelled' }
  | { type: 'queue/snapshot'; items: ChatQueuedMessage[] }
  | { type: 'jobs/snapshot'; jobs: ChatJob[] }
  | { type: 'projection'; key: string; value: unknown; seq: number }
  | { type: 'running'; running: boolean }
  | { type: 'finish' }
  | { type: 'error'; code: string; message: string }

/** session 审批项（approval/requested 事件写入 pendingApprovals） */
export interface ChatPendingApproval { approvalId: string; toolName: string; callId?: string; reason?: string; rpcId: string }

/** 历史回放与实时事件共用的折叠状态与纯函数折叠器（后到的更小/重复 seq 不覆盖已应用事件） */
export interface ChatFoldState {
  lastSeq: number | null
  messages: ChatMessage[]
  queue: ChatQueuedMessage[]
  jobs: ChatJob[]
  tokenUsage: ChatTokenUsage | null
  projections: Record<string, unknown>
  title: string | null
  running: boolean
  pendingApprovals: ChatPendingApproval[]
  pendingQuestion: { questions: AskQuestionItem[]; rpcId: string } | null
  error: { code: string; message: string } | null
}

export function createFoldState(): ChatFoldState
export function foldSessionEvent(state: ChatFoldState, event: ChatSessionEvent): ChatFoldState
```

## 参数说明

### createOpenAITransport 配置

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `providers` | `ChatProvider[]` | — | 是 | 至少 1 个，空数组抛 `Error('[createOpenAITransport] providers 不能为空')` |
| `providers[].endpoint` | `string` | — | 是 | 完整 http(s) URL 或相对路径；请求固定 `POST <endpoint>` |
| `providers[].apiKey` | `string` | — | 否 | 有则带 `Authorization: Bearer <apiKey>`；相对路径代理场景可省略 |
| `providers[].headers` | `Record<string, string>` | — | 否 | 与全局 `headers` 合并，Provider 优先 |
| `providers[].applyReasoning` | `(level, body) => void` | 写 `body.reasoning_effort = level` | 否 | 仅在请求带 `reasoningLevel` 时调用 |
| `providers[].models` | `ChatModel[]` | — | 是 | 至少 1 个，否则抛 `Error('[createOpenAITransport] Provider "<id>" 未配置 models')`；`models[].id` 跨 Provider 全局唯一，重复抛 `Error('[createOpenAITransport] 模型 id "<id>" 重复（跨 Provider 须全局唯一）')` |
| `headers` | `Record<string, string>` | — | 否 | 全局请求头，叠加在 `Content-Type` 与 `Authorization` 之后（可覆盖） |
| `body` | `Record<string, unknown>` | — | 否 | 全局额外请求体字段；`body.stream_options` 会被合并且强制 `include_usage: true` |

### 请求形态（内置 OpenAI transport）

- 请求：`POST <provider.endpoint>`，`Content-Type: application/json`，有 `apiKey` 时带 `Authorization: Bearer <apiKey>`；请求体固定 `model`、`stream: true`、`stream_options: { include_usage: true }`、`messages`（`systemPrompt` 转为首条 `system` 消息），有 `tools` 时带 `tools`（OpenAI function 形态）。
- 用户附件转成 `image_url` 内容分片；`reasoningLevel` 经 `applyReasoning` 写入请求体（缺省 `reasoning_effort`）。
- 响应：按 SSE 逐行解析 `data:` 帧，兼容 `reasoning_content`（DeepSeek）与 `reasoning`（部分 OpenAI 兼容端点）；`usage` 从流式末包解析。
- 错误：模型 id 找不到 Provider 时回调 `onError(new Error('未找到模型 "<id>" 对应的 Provider'))`；非 2xx 包装为 `请求失败（<status>）：<响应文本>`；无响应体报 `响应不包含可读取的流`；网络失败与解析异常原样 `onError`（`signal.aborted` 后不再报）。

### useChat 返回值

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `messages` | `Ref<ChatMessage[]>` | `[]` | 消息列表；流式增量直接写入末尾 assistant 消息 |
| `model` | `Ref<string \| undefined>` | `models[0]?.id` | `models` 有值时自动校正为合法 id |
| `reasoningLevel` | `Ref<string \| undefined>` | — | 切模型时校正（无 levels 清空；非法落到默认/首项） |
| `running` | `Ref<boolean>` | `false` | 从发送到 finish/error/中断期间为 true |
| `queue` | `Ref<ChatQueuedMessage[]>` | `[]` | 待发送队列 |
| `jobs` | `Ref<ChatJob[]>` | `[]` | 仅 session 有值 |
| `tokenUsage` | `Ref<ChatTokenUsage \| null>` | `null` | 收到 usage 才有值，多次累加 |
| `lastTurnUsage` | `Ref<ChatTokenUsage \| null>` | `null` | 每轮开始时清零 |
| `projections` / `title` | `Ref<Record<string, unknown>>` / `Ref<string \| null>` | `{}` / `null` | 仅 session 有值 |
| `pendingApprovals` | `Ref<ChatPendingApproval[]>` | `[]` | 仅 session 有值 |
| `pendingQuestion` | `Ref<{ questions; rpcId } \| null>` | `null` | 仅 session 有值 |

## 方法与事件

### useChat 返回的方法

均为同步函数、返回 `void`（`enqueue` / `removeQueued` 除外），不抛错，非法调用按空操作处理：

| 方法 | 签名 | 语义与空操作条件 |
| --- | --- | --- |
| `send` | `(content, attachments?) => void` | 空内容且无附件为空操作；session 下转发 `transport.send`；空闲时立即开新一轮，生成中入队 |
| `abort` | `() => void` | 函数 transport 下中止 AbortController，挂起的工具确认按拒绝处理；session 下调 `transport.cancel()`；队列保留 |
| `regenerate` | `() => void` | 移除最后一条 user 消息之后的所有消息并重跑对话循环。session 下、生成中、无 user 消息或最后一条就是 user 时为空操作 |
| `clear` | `() => void` | 生成中先中止；清空 messages、queue、tokenUsage、lastTurnUsage。session 下走本地重置（fold 状态归零） |
| `enqueue` | `(content, attachments?, beforeId?) => ChatQueuedMessage` | 返回队列项；`beforeId` 指定插到某条之前（缺省追加尾部）；空闲时自动消耗队首。session 下仅返回对象、不入队 |
| `startQueued` | `(id) => void` | 立即执行队列中某条：空闲时直接开始；生成中把它插回队首并中断当前会话，收尾后自动接续。session 下为空操作 |
| `removeQueued` | `(id) => ChatQueuedMessage \| undefined` | 从队列移除并返回被移除项；未找到返回 undefined。session 下恒返回 undefined |
| `respondToolCall` | `(toolCallId, approved) => void` | 函数 transport 下兑现 `needsConfirm` 的挂起确认；session 下按 `pendingApprovals` 中 `callId` 匹配的 `rpcId` 调 `respond` |
| `respondSession` | `(rpcId, ok, value?) => void` | session 专用：直接 `respond(rpcId, ok, value)`；函数 transport 下为空操作 |

### 加载状态与队列接续规则

`running` 在发送后置 `true`，直到本轮结束（`finish` / `error` / 中断）。会话自然结束或插队时，队列按 FIFO 自动接续：

| 结束方式 | 队列行为 |
| --- | --- |
| `finish`（无工具调用、terminal 工具成功、达到 `maxToolRounds`） | FIFO 自动发送下一条 |
| `startQueued(id)` 插队 | 中断当前会话，该条作为下一条，其余保持原顺序 |
| 手动 `abort` / 用户停止 | 队列保留，不自动接续 |
| `error` | 队列保留，不自动接续 |
| `clear()` | 消息、队列与 token 统计一起清空（生成中先 abort） |

### 对话循环与消息状态流转

一轮对话：push assistant 占位（`status: 'streaming'`）→ 调 `transport(request, handlers)` → `onTextDelta` / `onReasoningDelta` 增量写入该消息 → 无 `onError` 且未中断时置 `status: 'done'`；有工具调用则按调用顺序串行执行、结果以 `role: 'tool'` 消息追加，然后递归下一轮；工具全部成功且命中 `terminal` 工具，或轮次达到 `maxToolRounds`（默认 10）时结束并发 `finish`。错误路径：transport 抛错或调 `onError` → 消息置 `status: 'error'` 并 emit `error`；中断路径：`signal.aborted` → 消息置 `status: 'aborted'`，不 emit `error`。

### 自定义 transport 实现契约

```ts
import type { ChatTransport } from '@veltra/ai'

const transport: ChatTransport = async (req, handlers) => {
  // req.messages 不含本轮 assistant 占位；model / reasoningLevel 可按需忽略
  const res = await fetch('https://<你的代理地址>/my-chat-api', {
    method: 'POST',
    signal: req.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: req.messages, systemPrompt: req.systemPrompt,
      model: req.model, reasoningLevel: req.reasoningLevel,
      tools: req.tools?.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters }))
    })
  })
  if (!res.ok) return void handlers.onError?.(new Error(`HTTP ${res.status}`))
  // 解析自有协议后逐段回调（示例为一次性给出）：
  handlers.onReasoningDelta?.('思考内容')
  handlers.onTextDelta('回答内容')
  handlers.onToolCall?.({ id: 'call-1', name: 'lookupOrder', arguments: '{"orderId":"A001"}' })
  // 接口有 usage 才回调；没有就不调，禁止填 0
  handlers.onUsage?.({ promptTokens: 12, completionTokens: 8, totalTokens: 20 })
}
```

契约要点：`onTextDelta` 必须调用，否则消息内容为空；`onToolCall` 只收完整参数串，流式分片由 transport 自行累积；`signal.aborted` 后禁止再调 `onError`（用户停止不是错误）；错误可以 `onError` 也可以直接 throw，两者效果一致。`execute` 的返回值（或 Promise 返回值）经 `JSON.stringify` 序列化后作为 `role: 'tool'` 消息追加并回灌模型；返回 `string` 时原样使用。

## 典型示例

### 多 Provider 与推理等级

```ts
import { createOpenAITransport } from '@veltra/ai'

const transport = createOpenAITransport({
  headers: { 'X-App': 'web' },
  body: { temperature: 0.2 },
  providers: [
    {
      id: 'proxy',
      label: '业务代理',
      // 指向服务端代理；API Key 留在服务端，不下发浏览器
      endpoint: 'https://<你的代理地址>/chat/completions',
      models: [{
        id: 'deepseek-chat',
        label: 'DeepSeek Chat',
        description: '通用对话',
        reasoningLevels: [{ value: 'low', label: '低' }, { value: 'medium', label: '中' }, { value: 'high', label: '高' }],
        defaultReasoningLevel: 'low'
      }]
    },
    {
      id: 'custom',
      endpoint: 'https://<你的代理地址>/custom/chat',
      // 请求体字段名不是 reasoning_effort 时用 applyReasoning 自定义写入
      applyReasoning: (level, body) => { body.thinking = { budget: level } },
      models: [{ id: 'custom-model', reasoningLevels: [{ value: '8k', label: '8K' }] }]
    }
  ]
})

console.log(transport.models) // => ChatModelOption[]，含 providerId / providerLabel
console.log(transport.defaultModel) // => 'deepseek-chat'（首个 Provider 的首个模型）
```

### 无头 useChat：确认工具、停止与重新生成

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useChat, createOpenAITransport, type AiChatEmits, type ChatTool, type ChatToolCall } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [{ id: 'proxy', endpoint: 'https://<你的代理地址>/chat/completions', models: [{ id: '<模型id>' }] }]
})

const tools: ChatTool[] = [{
  name: 'deleteFile',
  description: '删除指定路径的文件',
  needsConfirm: true,
  parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  execute: async ({ path }: { path: string }) => ({ deleted: path })
}]

// 无头时自行实现 emit：按事件名分发给自己的逻辑（三处示例同此实现）
const emit = ((event: string, ...args: unknown[]) => { if (event === 'error') console.error(args[0]) }) as AiChatEmits

const chat = useChat({ props: { transport, tools }, emit })

// needsConfirm 工具挂起时自绘「允许 / 拒绝」，用 toolCall.id 兑现
const confirm = (call: ChatToolCall, approved: boolean) => {
  chat.respondToolCall(call.id, approved)
}

const input = ref('')
</script>

<template>
  <div>
    <div v-for="msg in chat.messages.value" :key="msg.id">{{ msg.role }}：{{ msg.content }}</div>
    <div v-for="call in chat.messages.value.flatMap((m) => m.toolCalls ?? [])" :key="call.id">
      <span v-if="call.status === 'awaiting-confirm'">
        {{ call.name }} 等待确认
        <button type="button" @click="confirm(call, true)">允许</button>
        <button type="button" @click="confirm(call, false)">拒绝</button>
      </span>
    </div>
    <input v-model="input" @keydown.enter="chat.send(input); input = ''" />
    <button v-if="chat.running.value" type="button" @click="chat.abort()">停止</button>
    <button v-else type="button" @click="chat.regenerate()">重新生成</button>
  </div>
</template>
```

### 服务端会话：createServerTransport + adapter

```vue
<script setup lang="ts">
import { useChat, createServerTransport, isServerTransport, type AiChatEmits, type ChatSessionAdapter } from '@veltra/ai'

// 宿主按自有协议实现 adapter；这里用页内定时器模拟事件流
const adapter: ChatSessionAdapter = {
  subscribe(handlers) {
    let seq = 0
    const timers = [
      setTimeout(() => handlers.onEvent({ type: 'running', running: true, seq: ++seq }), 0),
      setTimeout(() => handlers.onEvent({ type: 'assistant/chunk', messageId: 'a1', delta: '你好', seq: ++seq }), 100),
      setTimeout(() => handlers.onEvent({ type: 'assistant/message', messageId: 'a1', content: '你好！', seq: ++seq }), 200),
      setTimeout(() => handlers.onEvent({ type: 'finish', seq: ++seq }), 300)
    ]
    return () => timers.forEach(clearTimeout)
  },
  async send(content) { console.log('发给服务端：', content) },
  async cancel() {},
  async respond(rpcId, ok, value) { console.log('respond：', rpcId, ok, value) },
  async fetchHistory(beforeSeq) { return { events: [], hasMore: false } }, // 实际实现按 beforeSeq 向前翻页
  async selectModel(provider, model) { console.log('切换模型：', provider, model) }
}

const transport = createServerTransport(adapter)
console.log(isServerTransport(transport)) // => true（kind === 'session'）

// 无头时自行实现 emit：按事件名分发给自己的逻辑（三处示例同此实现）
const emit = ((event: string, ...args: unknown[]) => { if (event === 'error') console.error(args[0]) }) as AiChatEmits

const chat = useChat({ props: { transport }, emit })
chat.send('在吗') // 走 adapter.send，回包经 subscribe 折叠进 chat.messages
</script>

<template>
  <div>
    <div v-for="msg in chat.messages.value" :key="msg.id">{{ msg.role }}：{{ msg.content }}</div>
    <div v-if="chat.title.value">{{ chat.title.value }}</div>
  </div>
</template>
```

## 注意事项

> [!WARNING]
> - 生产环境禁止把 API Key 下发到浏览器：`endpoint` 用相对路径 + 服务端代理，Key 只存在服务端环境变量；`apiKey` 字段仅限本机调试。参考 playground 服务端：从环境变量 `DEEPSEEK_API_KEY` 读 Key，把 `/ai/chat/completions` 的 SSE 原样转发给上游。
> - 两种 transport 形态互斥：`kind: 'session'` 的对象按服务端会话处理（不注入内置工具、不执行客户端 `execute`，`tools` 只作渲染元信息）；函数按单轮客户端驱动处理。用 `isServerTransport()` 判别。
> - `onToolCall` 必须给完整 JSON 参数串，禁止分片回调；分片累积由 transport 自己完成。
> - 接口未返回 usage 时禁止调用 `onUsage`，禁止用 0 补数；`tokenUsage` 为 `null` 即表示从未收到 usage。
> - `signal.aborted` 后禁止再调 `onError`；`send` 空内容且无附件是空操作；`enqueue` 在 session 下只返回对象不入队（发送必须走 `send`）。
> - 内置提问工具 `askQuestion` 自动注入且同名优先：与它同名的自定义工具会被忽略。工具工厂 `createBuiltinTools` 不对外导出。
> - 本库 `ChatTransport` 是 `(request, handlers) => void` 的回调形态，不是 fetch 包装，也不是 React AI SDK 的 `streamText`/`useChat`；流式 UI 增量只经 `handlers` 回调。
> - `createServerTransport` 丢弃 `seq <= lastSeq` 的乱序事件并 `console.warn('[ChatSessionTransport] 丢弃乱序事件 seq=... lastSeq=...')`；`send` / `cancel` / `respond` / `selectModel` 各自做 in-flight 去重（进行中重复调用被静默忽略）。
> - `useChat` 的 `props` 是普通对象，不需响应式：`transport` / `tools` / `systemPrompt` 等传组件 props 或静态对象均可；`messages` / `model` / `reasoningLevel` 受控走 `props.messages` + `emit('update:messages')`。

## 常见问题

### 报错 `[createOpenAITransport] providers 不能为空`

原因：`providers` 传了空数组。修复：至少配置一个 Provider，且每个 Provider 至少一个 `models` 项。

### 报错 `[createOpenAITransport] Provider "p" 未配置 models`

原因：某个 Provider 没写 `models` 或写了空数组。修复：为该 Provider 补至少一个模型：

```ts
import { createOpenAITransport } from '@veltra/ai'

createOpenAITransport({
  providers: [{ id: 'p', endpoint: 'https://<你的代理地址>/chat/completions', models: [{ id: '<模型id>' }] }]
})
```

### `error` 事件报 `未找到模型 "x" 对应的 Provider`

原因：`model` 的值不在任何 Provider 的 `models[].id` 里（传错 id 或没传 `models`）。修复：让 `model` 取 `transport.defaultModel` 或 `transport.models` 中的 id。

### `error` 事件报 `请求失败（401）：...`

原因：代理未注入鉴权或 Key 失效。内置 transport 把非 2xx 响应包装为 `请求失败（<status>）：<响应文本>`。修复：检查服务端代理的 `Authorization: Bearer` 与 Key 配置。
