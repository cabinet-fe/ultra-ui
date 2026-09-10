---
title: UAiChat AI 对话组件
description: "@veltra/ai 的 AI 对话组件：必填 transport 接入任意 OpenAI 兼容或自定义后端，内置流式打字机消息列表、工具调用卡片与侧边面板、待发送队列、模型/推理等级选择器、图片附件与 token 用量展示。"
aliases: [AiChat, ai-chat, AI 对话, 聊天组件, Chat]
keywords: [useChat, createOpenAITransport, SSE, 流式, 对话, 打字机, 活体球, 工具调用, maxToolRounds, v-model:messages, 待发送队列, needsConfirm, welcome, 图片附件, 模型选择, reasoningLevel, token 用量, readonly]
---

# UAiChat AI 对话组件

`@veltra/ai` 导出 Vue 组件 `UAiChat`：一层完整对话 UI，覆盖消息列表、流式打字机输出、思考过程展示、工具调用编排（确认、侧边面板）、待发送队列、模型/推理等级选择器与图片附件。`transport` 必填。自绘 UI 的无头场景改用同包 `useChat`（见 `use-chat.md`），`UAiChat` 内部即调用它。

## 快速上手

前置：应用入口已初始化主题（`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`），并引入组件样式 `import '@veltra/ai/style'`。组件根节点 `height: 100%`，父容器必须给明确高度。

```vue
<script setup lang="ts">
import { UAiChat, createOpenAITransport } from '@veltra/ai'
import '@veltra/ai/style'

// 指向服务端代理；API Key 只存在服务端，不下发浏览器
const transport = createOpenAITransport({
  providers: [{
    id: 'proxy', endpoint: 'https://<你的代理地址>/chat/completions',
    models: [{ id: '<模型id>', label: '<显示名>' }]
  }]
})
</script>

<template>
  <div style="height: 100vh">
    <u-ai-chat :transport="transport" :models="transport.models" :model="transport.defaultModel" />
  </div>
</template>
```

## API 签名

```ts
import type { Component } from 'vue'
import type { ChatSessionTransport } from '@veltra/ai'

export interface AiChatProps {
  /** 传输层（必填）；函数型 ChatTransport 或 kind: 'session' 会话对象 */
  transport: ChatTransport | ChatSessionTransport
  /** 工具列表；函数 transport 传 ChatTool[]，session 下可传 ChatToolMeta[] */
  tools?: (ChatTool | ChatToolMeta)[]
  /** 系统提示词 */
  systemPrompt?: string
  /** 单次发送最大生成轮次，默认 10 */
  maxToolRounds?: number
  /** 消息列表，支持 v-model:messages 受控 */
  messages?: ChatMessage[]
  /** 模型列表；有值才显示模型选择器，可传 transport.models */
  models?: ChatModelOption[]
  /** 当前模型 id，支持 v-model:model */
  model?: string
  /** 当前推理等级，支持 v-model:reasoning-level */
  reasoningLevel?: string
  /** 空闲时输入框上方的快捷提问（点击即发送）；字符串按单项处理 */
  welcome?: string | string[]
  /** 输入框占位文本 */
  placeholder?: string
  /** 附件 accept 类型，默认 'image/*' */
  accept?: string
  /** 单个附件最大字节数，默认 10485760（10MB） */
  maxAttachmentSize?: number
  /** 透传给内部 MarkdownRender（markstream-vue）的属性 */
  rendererProps?: Record<string, unknown>
  /** 是否展示 token 用量明细（缓存命中/未命中），默认 false */
  tokenUsageDetail?: boolean
  /** 覆盖包内 toolName → icon 映射（精确名优先于内置名称规则） */
  toolIcons?: Record<string, Component>
  /** 只读：不展示输入区、欢迎语不可发送、队列无插队/编辑/移除，默认 false */
  readonly?: boolean
}

export interface AiChatEmits {
  /** 消息列表变化（流式 delta 不逐字 emit，只在关键节点同步快照） */
  (e: 'update:messages', messages: ChatMessage[]): void
  (e: 'update:model', model: string | undefined): void
  (e: 'update:reasoningLevel', reasoningLevel: string | undefined): void
  /** 用户发送消息（消息已 push 进列表后触发） */
  (e: 'send', message: ChatMessage): void
  /** 一轮对话完成：无更多工具调用、terminal 工具成功或达到 maxToolRounds 上限 */
  (e: 'finish', message: ChatMessage): void
  /** 对话出错（transport 报 onError / 抛错，且未被中断） */
  (e: 'error', error: Error): void
  /** 模型发起一次工具调用 */
  (e: 'tool-call', toolCall: ChatToolCall): void
}

// 插槽（defineSlots 内联声明，无同名导出类型）：
//   #welcome       —— 空闲欢迎区插槽（工作中活体球跳到列表末尾），无作用域参数
//   #tool-<工具名> —— 自定义工具结果展示，作用域槽参数 { toolCall: ChatToolCall }

/** 模板引用上可直接访问的暴露成员；defineExpose 的 Ref 已解包（chatRef.value?.tokenUsage 即值，无需再 .value） */
export interface AiChatExposed {
  /** 发送一条用户消息（同步；会话进行中时进入待发送队列） */
  send: (content: string, attachments?: ChatAttachment[]) => void
  /** 中断当前生成（同步；保留待发送队列，挂起的工具确认按拒绝处理） */
  abort: () => void
  /** 重新生成最后一条 assistant 回复（同步；session 下或生成中为空操作） */
  regenerate: () => void
  /** 清空消息、待发送队列与 token 统计（同步；生成中先中止） */
  clear: () => void
  /** 会话累计 token；从未收到 usage 时为 null */
  tokenUsage: ChatTokenUsage | null
  /** 最近一轮用户对话的 token；该轮无 usage 时为 null */
  lastTurnUsage: ChatTokenUsage | null
  /** 待发送消息队列（收尾后 FIFO 自动接续） */
  queue: ChatQueuedMessage[]
  /** 立即执行队列中的某条：中断当前会话并插队为下一条 */
  startQueued: (id: string) => void
  /** 从队列移除某条（返回被移除项；未找到返回 undefined） */
  removeQueued: (id: string) => ChatQueuedMessage | undefined
  /** 向队列插入一条消息（beforeId 插到某条之前，缺省追加尾部；空闲时自动消耗队首） */
  enqueue: (content: string, attachments?: ChatAttachment[], beforeId?: string) => ChatQueuedMessage
}

export interface ChatMessage {
  id: string
  /** 角色：user / assistant / tool */
  role: 'user' | 'assistant' | 'tool'
  /** markdown 内容 */
  content: string
  /** 思考过程（reasoning） */
  reasoning?: string
  /** 用户消息携带的附件 */
  attachments?: ChatAttachment[]
  /** assistant 消息上的工具调用列表 */
  toolCalls?: ChatToolCall[]
  /** role 为 'tool' 时关联的工具调用 id */
  toolCallId?: string
  /** 消息状态，仅 assistant 消息使用 */
  status?: 'streaming' | 'done' | 'error' | 'aborted'
}

/** 聊天附件（首版仅支持图片）：dataUrl 为 base64 data URL */
export interface ChatAttachment { name: string; mimeType: string; size: number; dataUrl: string }

/** 队列中的待发送消息 */
export interface ChatQueuedMessage { id: string; content: string; attachments?: ChatAttachment[] }

export interface ChatTokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  /** 缓存命中，有才有 */
  cacheHitTokens?: number
  /** 缓存未命中，有才有 */
  cacheMissTokens?: number
  /** 写入缓存，有才有 */
  cacheCreationTokens?: number
}

/** 工具调用状态 */
export type ToolCallStatus = 'pending' | 'awaiting-confirm' | 'running' | 'success' | 'error' | 'rejected'

/** 一次工具调用 */
export interface ChatToolCall {
  id: string
  name: string
  /** 模型输出的原始 JSON 参数串 */
  arguments: string
  status: ToolCallStatus
  /** 序列化后的工具执行结果 */
  result?: string
  error?: string
  /** 服务端下发的展示视图原文（session 模式可选） */
  view?: unknown
}

/** 对话工具定义（客户端执行；发给模型的只有 name / description / parameters） */
export interface ChatTool<A = any> {
  /** 工具名（传给模型，需唯一） */
  name: string
  /** 工具描述（传给模型） */
  description: string
  /** 参数 JSON Schema（原样传给模型） */
  parameters: Record<string, unknown>
  /** 执行前是否需要用户在工具卡片内确认（允许/拒绝） */
  needsConfirm?: boolean
  /** 工具图标组件，缺省用内置状态图标 */
  icon?: Component
  /** 工具显示名，缺省取 name */
  label?: string
  /** 自定义卡片内容渲染组件，props 为 ChatToolRenderProps；优先级高于 tool-<name> 插槽 */
  render?: Component
  /** 渲染位置：缺省 'inline'（会话内卡片）；'panel' 为右侧侧边面板 */
  renderTo?: 'inline' | 'panel'
  /** 侧边面板默认宽度（px，最小 320），仅 renderTo: 'panel' 时生效 */
  panelWidth?: number
  /** 侧边面板标题，仅 renderTo: 'panel'；缺省取 label ?? name */
  panelTitle?: string | ((toolCall: ChatToolCall) => string)
  /** 执行完成后是否自动折叠（缺省规则见本节末尾） */
  autoCollapse?: boolean
  /** 终结工具：执行成功后对话即结束（发 finish），结果不再回灌模型；失败/被拒绝仍回灌 */
  terminal?: boolean
  /** 工具实现；args 为 JSON.parse(arguments)，返回值 JSON 序列化后回灌模型 */
  execute: (args: A, ctx: { toolCall: ChatToolCall; signal: AbortSignal }) => unknown
}

/** 服务端驱动模式 tools：纯渲染元信息（执行在服务端，忽略 execute 等字段），字段语义同 ChatTool 对应字段 */
export interface ChatToolMeta { name: string; icon?: Component; label?: string; render?: Component; renderTo?: 'inline' | 'panel'; panelWidth?: number; panelTitle?: string | ((toolCall: ChatToolCall) => string); autoCollapse?: boolean }

/** render 组件 / tool-<name> 插槽收到的 props：toolCall 含 status/arguments/result/error，实时更新 */
export interface ChatToolRenderProps { toolCall: ChatToolCall }

/** 推理等级选项（值不透明，由宿主/服务商约定） */
export interface ChatReasoningLevel { value: string; label: string }

/** 单个模型配置：id 跨 Provider 全局唯一；label 缺省取 id；description 为选择器副标题；reasoningLevels 未设或空数组 → 不展示推理选择器；defaultReasoningLevel 须落在 reasoningLevels 内 */
export interface ChatModel {
  id: string
  label?: string
  description?: string
  reasoningLevels?: ChatReasoningLevel[]
  defaultReasoningLevel?: string
}

/** 模型选择器使用的扁平模型项 */
export interface ChatModelOption extends ChatModel { providerId: string; providerLabel?: string }

/** transport 请求参数（自定义 transport 时按此收到请求） */
export interface ChatTransportRequest {
  /** 完整消息历史（不含本轮刚插入的 assistant 占位消息） */
  messages: ChatMessage[]
  systemPrompt?: string
  tools?: ChatTool[]
  model?: string
  reasoningLevel?: string
  signal: AbortSignal
}

/**
 * transport 流式事件回调：
 * onTextDelta 必须调用（否则消息内容为空）；onToolCall 只收完整 JSON 参数串，禁止分片；
 * onUsage 在接口未返回 usage 时禁止调用、禁止填 0；onError 在 signal.aborted 后禁止再调用。
 */
export interface ChatTransportHandlers {
  onTextDelta(delta: string): void
  onReasoningDelta?(delta: string): void
  onToolCall?(call: { id: string; name: string; arguments: string }): void
  onUsage?(usage: ChatTokenUsage): void
  onError?(error: Error): void
}

/**
 * 函数型 transport 签名：自行实现接入任意后端（实现契约详见 use-chat.md）。
 * 与 session 对象形态（ChatSessionTransport，kind: 'session'）互斥。
 */
export type ChatTransport = (request: ChatTransportRequest, handlers: ChatTransportHandlers) => Promise<void> | void
```

`autoCollapse` 缺省规则：`renderTo: 'panel'` 时为 `true`；设置了 `render` 时为 `false`；否则为 `true`。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `transport` | `ChatTransport \| ChatSessionTransport` | — | 是 | 函数型（如 `createOpenAITransport()` 返回值）或 `kind: 'session'` 对象（`createServerTransport()` 返回值），二者互斥；缺失时用户消息仍入列显示，但不请求模型、无回复 |
| `tools` | `(ChatTool \| ChatToolMeta)[]` | — | 否 | 函数 transport 下传 `ChatTool[]`；session 下传 `ChatToolMeta[]`；与内置 `askQuestion` 同名的项被忽略（内置优先） |
| `systemPrompt` | `string` | — | 否 | 不参与 UI，仅发给模型 |
| `maxToolRounds` | `number` | `10` | 否 | 一轮 = 一次模型生成加其后的工具执行；轮次耗尽即停止请求并发出 `finish` |
| `messages` | `ChatMessage[]` | `[]` | 否 | `v-model:messages`；可做会话持久化 |
| `models` | `ChatModelOption[]` | — | 否 | 不传则不显示模型选择器；模型 `id` 跨 Provider 全局唯一 |
| `model` | `string` | `models[0].id` | 否 | `v-model:model`；`models` 有值时自动校正为合法项 |
| `reasoningLevel` | `string` | — | 否 | `v-model:reasoning-level`；切换模型时校正：无 levels 清空，非法值落到 `defaultReasoningLevel` 或首项 |
| `welcome` | `string \| string[]` | — | 否 | 字符串按单项处理；未传或为空时仅显示活体球，不带快捷提问 |
| `placeholder` | `string` | `'输入消息，Enter 发送，Shift + Enter 换行'` | 否 | 生成中占位文案固定为「会话进行中，发送的消息将进入待发送队列」 |
| `accept` | `string` | `'image/*'` | 否 | 透传文件选择的 accept，仅支持图片附件 |
| `maxAttachmentSize` | `number` | `10485760` | 否 | 字节；超限忽略该文件并 `console.warn('[UAiChat] 附件 <name> 超过大小限制，已忽略')` |
| `rendererProps` | `Record<string, unknown>` | — | 否 | 透传 markstream-vue 的 `MarkdownRender`（mermaid/katex 等需宿主自装 peer 并经此打开） |
| `tokenUsageDetail` | `boolean` | `false` | 否 | 仅影响明细展示；无 usage 时一律不展示 |
| `toolIcons` | `Record<string, Component>` | — | 否 | 键为工具名，精确名覆盖内置名称规则 |
| `readonly` | `boolean` | `false` | 否 | 不渲染输入区，欢迎语点击不发送，队列无插队/编辑/移除 |

## 方法与事件

### 事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:messages` | `ChatMessage[]` | 消息列表在关键节点变化（发送、工具结果追加、流式收尾）；流式 delta 不逐字 emit |
| `update:model` | `string \| undefined` | 模型选择器切换或自动校正 |
| `update:reasoningLevel` | `string \| undefined` | 推理等级切换或校正 |
| `send` | `ChatMessage` | 用户消息 push 进列表后（点击发送、欢迎语点击、`send()`） |
| `finish` | `ChatMessage` | 最后一条 assistant 完成：无更多工具调用 / terminal 工具成功 / 达到 `maxToolRounds` |
| `error` | `Error` | transport 调 `onError` 或抛错，且请求未被中断 |
| `tool-call` | `ChatToolCall` | 模型每次发起工具调用（状态初始为 `pending`） |

### 暴露方法（模板引用）

用 `const chatRef = useTemplateRef<AiChatExposed>('chatRef')`（`import { useTemplateRef } from 'vue'`、`import type { AiChatExposed } from '@veltra/ai'`）取得引用。`send` / `abort` / `regenerate` / `clear` / `startQueued` / `removeQueued` / `enqueue` 均为同步函数，不抛错：空内容发送、生成中 `regenerate` 等非法调用按空操作处理。`enqueue` 返回 `ChatQueuedMessage`，`removeQueued` 返回被移除项或 `undefined`；`tokenUsage` / `lastTurnUsage` / `queue` 在引用上已解包，直接读值。

### 插槽

- `#welcome`：替换默认欢迎区（活体球 + 快捷提问）。作用域无参数。
- `#tool-<name>`（如 `#tool-getWeather`）：该工具的调用有结果（`result` 或 `error` 非空）时替换工具卡片 body，作用域槽参数 `{ toolCall: ChatToolCall }`。工具定义了 `render` 时插槽不生效（`render` 优先）。

### 内置交互行为

- 输入：Enter 发送，Shift + Enter 换行，多行自适应高度上限 160px。生成中输入为空显示「停止生成」，有内容显示发送（点击入队）。
- 清除：输入栏左侧清除按钮带 `UPopConfirm` 二次确认（文案「清空当前对话？进行中的生成将被中止。」）；仅在有消息、有队列或生成中可点。
- 重新生成：最后一条 assistant 进入 `done` / `error` / `aborted` 终态后，在其下方提供复制 / 重新生成操作。
- 欢迎区：默认为活体球 + 快捷提问；多条每 4000ms 轮换，点文案即发送，点球立即换下一条并重置计时。
- 生成中活体球跳到列表末尾，结束后停留 2500ms 跳回；工具调用失败自动播 `frustrated` 表情，收尾按终态播表情（`done` → `happy`，`error` → `frustrated`，中断只停留）。
- 流式输出默认吸底滚动；用户上翻立即取消吸底，此时提供「最新消息」回底入口。
- 消息、队列、输入区限宽 800px 居中；空会话（只有 tool 消息视为空）时输入区垂直居中。token 展示：数字 <1000 原样，≥1000 用 K、≥100 万用 M（最多 1 位小数，整数不带 `.0`，如 1500 → 1.5K）。
- 队列：生成中提交的消息进入「待发送队列」条，可「立即开始」（中断当前会话插队）、取回输入框编辑（按原锚点插回）、移出。

## 典型示例

### 工具编排：确认、终结工具与结果插槽

```vue
<script setup lang="ts">
import { UAiChat, createOpenAITransport, type ChatTool } from '@veltra/ai'
import '@veltra/ai/style'

const transport = createOpenAITransport({
  providers: [{
    id: 'proxy', endpoint: 'https://<你的代理地址>/chat/completions',
    models: [{ id: '<模型id>', label: '<显示名>' }]
  }]
})

const tools: ChatTool[] = [
  {
    // 普通工具：结果 JSON 序列化后回灌模型继续生成
    name: 'lookupOrder',
    description: '按订单号查询订单状态',
    parameters: { type: 'object', properties: { orderId: { type: 'string' } }, required: ['orderId'] },
    execute: async ({ orderId }: { orderId: string }) =>
      (await fetch(`/api/orders/${orderId}`)).json()
  },
  {
    // 危险操作：工具卡片内先出「允许 / 拒绝」
    name: 'deleteFile',
    description: '删除指定路径的文件',
    needsConfirm: true,
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    execute: async ({ path }: { path: string }) => {
      await fetch(`/api/files?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
      return { deleted: path }
    }
  },
  {
    // 终结工具：天气卡片即最终答复，执行成功后不再回灌模型
    name: 'getWeather',
    description: '查询城市实时天气，结果以卡片直接展示，无需再用文字复述',
    terminal: true,
    parameters: { type: 'object', properties: { city: { type: 'string', description: '城市名' } }, required: ['city'] },
    execute: async ({ city }: { city: string }) =>
      (await fetch(`/api/weather?city=${encodeURIComponent(city)}`)).json() as Promise<{ city: string; temperature: number }>
  }
]

const onFinish = (message: { content: string }) => console.log('本轮结束：', message.content)
</script>

<template>
  <div style="height: calc(100vh - 40px)">
    <u-ai-chat
      :transport="transport"
      :tools="tools"
      :welcome="['北京天气怎么样', '查一下订单 A001']"
      token-usage-detail
      @finish="onFinish"
      @error="(error: Error) => console.error(error)"
    >
      <!-- 工具定义了 render 时此插槽不生效；本例 getWeather 未定义 render -->
      <template #tool-getWeather="{ toolCall }">
        <pre v-if="toolCall.result">{{ toolCall.result }}</pre>
        <span v-else-if="toolCall.status === 'error'">查询失败：{{ toolCall.error }}</span>
        <span v-else>查询中…</span>
      </template>
    </u-ai-chat>
  </div>
</template>
```

### 受控消息与会话操作（v-model + 模板引用）

```vue
<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { UAiChat, createOpenAITransport, type AiChatExposed, type ChatMessage } from '@veltra/ai'
import '@veltra/ai/style'

const transport = createOpenAITransport({
  providers: [{
    id: 'proxy', endpoint: 'https://<你的代理地址>/chat/completions',
    models: [{ id: '<模型id>' }]
  }]
})

// v-model:messages 受控：watch 即可做 localStorage 持久化
const messages = ref<ChatMessage[]>([])
watch(messages, (list) => localStorage.setItem('chat', JSON.stringify(list)), { deep: true })

const chatRef = useTemplateRef<AiChatExposed>('chatRef')

const sendProgrammatic = () => {
  chatRef.value?.send('帮我总结上面的内容') // 空闲时立即开始；生成中进入待发送队列
}

const insertQueued = () => {
  // enqueue 返回队列项，可用其 id 插队或移除
  const item = chatRef.value?.enqueue('排队的问题')
  console.log('队列长度：', chatRef.value?.queue.length) // => 1
  chatRef.value?.startQueued(item!.id) // 中断当前生成，让该条插队为下一条
}

const stopAndReset = () => {
  chatRef.value?.abort() // 中断；队列保留
  chatRef.value?.clear() // 清空消息、队列与 token 统计
  console.log('累计 token：', chatRef.value?.tokenUsage) // => null
}
</script>

<template>
  <div style="height: calc(100vh - 40px)">
    <u-ai-chat
      ref="chatRef"
      v-model:messages="messages"
      :transport="transport"
      :models="transport.models"
      :model="transport.defaultModel"
    />
    <button type="button" @click="sendProgrammatic">发送</button>
    <button type="button" @click="insertQueued">入队并插队</button>
    <button type="button" @click="stopAndReset">停止并清空</button>
  </div>
</template>
```

### 只读回显与自定义欢迎区

```vue
<script setup lang="ts">
import { UAiChat, createOpenAITransport, type ChatMessage } from '@veltra/ai'
import '@veltra/ai/style'

const transport = createOpenAITransport({
  providers: [{
    id: 'proxy', endpoint: 'https://<你的代理地址>/chat/completions',
    models: [{ id: '<模型id>' }]
  }]
})

// 从服务端拉取历史后回显：readonly 下不渲染输入区，消息不可再发送
const history: ChatMessage[] = [
  { id: 'm1', role: 'user', content: '帮我看看这个报错' },
  { id: 'm2', role: 'assistant', content: '这是 **TypeError**：读取了 `undefined` 的属性。', status: 'done' }
]
</script>

<template>
  <div style="height: 480px">
    <u-ai-chat :transport="transport" readonly :messages="history">
      <template #welcome>
        <div>工单已关闭，如需继续请新建工单</div>
      </template>
    </u-ai-chat>
  </div>
</template>
```

## 注意事项

> [!WARNING]
> - `transport` 必填，无默认值；缺失时用户消息仍会入列显示，但不会请求模型、没有回复。OpenAI 兼容后端用 `createOpenAITransport`，其它协议自行实现 `ChatTransport`（契约见上方 API 签名与 `use-chat.md`）。
> - 生产环境禁止把 API Key 下发到浏览器：`endpoint` 必须指向服务端代理（相对路径或同源 URL），Key 只存在服务端（参考 playground：服务端从环境变量 `DEEPSEEK_API_KEY` 读取 Key，把 `/ai/chat/completions` 的 SSE 转发给上游）。`apiKey` 字段仅限本机调试。
> - 无头自绘 UI 用同包 `useChat`（本库的方案是 `{ props, emit }` 签名的 Vue 组合式函数，不是 React AI SDK 那个 `useChat`）。
> - 组件不暴露 `running` / `respondToolCall`：`needsConfirm` 的「允许 / 拒绝」由工具卡片内部处理；无头场景需要确认 UI 时用 `useChat().respondToolCall`。
> - 内置提问工具 `askQuestion` 自动注入且同名优先；禁止再传 `name: 'askQuestion'` 的工具（会被忽略）。工具工厂 `createBuiltinTools` 不对外导出。
> - 发给模型的只有 `name` / `description` / `parameters`；`execute` / `needsConfirm` / `terminal` / 渲染相关字段只在本端生效。
> - `finish` 不等于「回答成功」：达到 `maxToolRounds` 上限、terminal 工具成功也会发 `finish`；失败走 `error` 事件。
> - 本库是 `UAiChat` 组件 + `useChat` 状态机两层，不是 Element/AntD 那类纯展示组件，也没有 `loading` prop——加载状态用暴露的 `queue` 与 `finish` / `error` 事件推导，或改用 `useChat().running`。
> - 视觉依赖主题初始化：入口 `import '@veltra/styles/normalize'` 并调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色；样式再引入 `import '@veltra/ai/style'`。

## 常见问题

### 创建 transport 时报错 `[createOpenAITransport] 模型 id "gpt-4o" 重复（跨 Provider 须全局唯一）`

原因：多个 `providers` 里出现了相同 `models[].id`。修复：保证模型 id 跨 Provider 全局唯一，同一上游模型挂多个 Provider 时用不同 id 区分。

### 输入栏不显示模型选择器

原因：未传 `models`。修复：把 transport 返回的扁平模型列表传入：

```vue
<u-ai-chat :transport="transport" :models="transport.models" :model="transport.defaultModel" />
```

### `error` 事件报 `请求失败（401）：...`

原因：代理未携带鉴权或 Key 失效。内置 transport 把非 2xx 响应包装为 `请求失败（<status>）：<响应文本>`。修复：检查服务端代理的 `Authorization: Bearer` 注入与 Key 配置。
