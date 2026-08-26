# @veltra/ai API

完整声明见 `./types.d.ts`。本节只列公共契约与使用要点。

## UAiChat

对话 UI。内部调用 `useChat`，负责消息列表、工具卡片 / 侧边面板、待发送队列、输入区与模型选择。

类型：

```ts
interface AiChatProps {
  transport: ChatTransport
  tools?: ChatTool[]
  systemPrompt?: string
  maxToolRounds?: number // 默认 10；一轮 = 一次模型生成 + 可能的工具执行
  messages?: ChatMessage[] // v-model:messages
  models?: ChatModelOption[] // 有值才显示模型选择器；可用 transport.models
  model?: string // v-model:model
  reasoningLevel?: string // v-model:reasoning-level
  welcome?: string | string[] // 空闲时输入框上方的快捷提问；多条时逐条轮换
  placeholder?: string
  accept?: string // 附件 accept，默认 image/*
  maxAttachmentSize?: number // 默认 10MB；超限忽略并 console.warn
  rendererProps?: Record<string, unknown> // 透传 markstream-vue 的 MarkdownRender
  tokenUsageDetail?: boolean // 默认 false：有 usage 时只显示「总 token」；true 再拼有数据的缓存命中/未命中
}

interface AiChatEmits {
  (e: 'update:messages', messages: ChatMessage[]): void
  (e: 'update:model', model: string | undefined): void
  (e: 'update:reasoningLevel', reasoningLevel: string | undefined): void
  (e: 'send', message: ChatMessage): void
  (e: 'finish', message: ChatMessage): void // 无更多工具 / terminal 成功 / 触及 maxToolRounds
  (e: 'error', error: Error): void
  (e: 'tool-call', toolCall: ChatToolCall): void
}

defineSlots<{
  welcome(): any
  [name: `tool-${string}`]: (scope: { toolCall: ChatToolCall }) => any
}>()

interface AiChatExposed {
  send(content: string, attachments?: ChatAttachment[]): void
  abort(): void
  regenerate(): void
  clear(): void
  tokenUsage: ChatTokenUsage | null // 会话累计；从未收到 usage 时为 null
  lastTurnUsage: ChatTokenUsage | null // 最近一轮用户对话（含工具多轮）
  queue: ChatQueuedMessage[]
  startQueued(id: string): void
  removeQueued(id: string): ChatQueuedMessage | undefined
  enqueue(content: string, attachments?: ChatAttachment[], beforeId?: string): ChatQueuedMessage
}
```

要点：

- `welcome` 插槽替换默认欢迎区（活体球 + 快捷提问，空闲时钉在输入框上方）。默认：点文案即发送，点球换下一条；多条约每 4s 轮换。工作中活体球跳到列表末尾，结束后跳回。
- `tool-<name>` 在工具有结果时替换卡片 body；工具定义了 `render` 时 **render 优先**。
- 输入：Enter 发送，Shift+Enter 换行。生成中空输入显示停止；有内容则发送入队。
- 输入栏左侧有清除按钮（`UPopConfirm` 二次确认）。`clear()` 中止进行中的请求、清空消息与队列、重置 token 统计；生成中清除会立刻回到欢迎区。
- 最后一条 assistant 结束后提供复制 / 重新生成。`regenerate` 会删掉最后一条用户消息之后的所有消息再跑一轮。
- Token：接口返回 `usage` 后才显示会话累计。默认 `总 token N`；`tokenUsageDetail` 为 true 时再拼有数据的 `缓存命中` / `缓存未命中`。不展示本次、不拆输入/输出。数字 ≥1000 用 K、≥100 万用 M（最多 1 位小数，整数不写 `.0`）。无 usage 不展示、不补 0。
- `UAiChat` **不**暴露 `running` / `respondToolCall`（确认按钮由工具卡片处理）。无头场景用 `useChat`。

## ChatTool

```ts
interface ChatTool<A = any> {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema，原样传给模型
  execute: (args: A, ctx: ChatToolContext) => unknown
  needsConfirm?: boolean
  icon?: Component
  label?: string
  render?: Component // props: ChatToolRenderProps；优先于 tool-<name>
  renderTo?: 'inline' | 'panel' // 默认 inline
  panelWidth?: number // 仅 panel；px，最小 320
  panelTitle?: string | ((toolCall: ChatToolCall) => string)
  autoCollapse?: boolean
  terminal?: boolean
}

interface ChatToolContext {
  toolCall: ChatToolCall
  signal: AbortSignal // 用户停止时 abort
}

interface ChatToolRenderProps {
  toolCall: ChatToolCall // 含 status / arguments / result / error，随调用实时更新
}
```

执行与回灌：

- `args` 来自 `JSON.parse(toolCall.arguments)`（空串则 `{}`）。
- 返回值：`string` 原样回灌；其它值 `JSON.stringify`。`render` 里读 `toolCall.result` 时再 `JSON.parse`。
- `throw` → `status: 'error'`，追加 `Error: <message>` 给模型。
- 未知工具名 → `status: 'error'`，回灌 `Error: tool "…" is not available.`。
- `needsConfirm`：卡片内「允许 / 拒绝」。拒绝回灌 `The user rejected the execution of tool "…".`。停止生成时未确认的调用按拒绝处理。
- `terminal: true` 且执行成功：发 `finish`，不再请求模型生成文字。失败 / 拒绝仍回灌并继续循环。
- `autoCollapse` 缺省：`renderTo: 'panel'` → `true`；有 `render` → `false`；否则 `true`。

侧边面板（`renderTo: 'panel'`）：

- `render` 画在右侧面板，卡片 body 只留「查看面板」。新调用自动打开并聚焦；可切回历史调用。
- 会话区最小 360px、面板最小 320px，中间可拖拽。
- `panelWidth`：聚焦该工具时应用。未指定时，**面板从关闭到打开**取「容器宽 − 860」（会话区尽量留 860px；量不到容器宽时回落 420）。面板已打开时切换聚焦保持当前宽度（含用户拖拽），除非新工具自己声明了 `panelWidth`。
- `panelTitle`：业务化标题（「业务对象 + 动作」）。缺省 `label ?? name`。

## 消息模型

```ts
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  reasoning?: string
  attachments?: ChatAttachment[]
  toolCalls?: ChatToolCall[]
  toolCallId?: string // role === 'tool'
  status?: 'streaming' | 'done' | 'error' | 'aborted' // 仅 assistant
}

type ToolCallStatus = 'pending' | 'awaiting-confirm' | 'running' | 'success' | 'error' | 'rejected'
```

一轮带工具的典型顺序：`user` → `assistant`（`toolCalls`）→ 若干 `tool`（`toolCallId`）→ 再一条 `assistant`。

`v-model:messages` 可做会话持久化。流式 delta 不逐字 `emit`，只在关键节点同步快照。空会话判定忽略 `role === 'tool'` 的消息。

附件（首版仅图片）：

```ts
interface ChatAttachment {
  name: string
  mimeType: string
  size: number
  dataUrl: string // base64 data URL
}
```

内置 OpenAI transport 会把附件编成 `image_url` 多模态 content。

## createOpenAITransport

OpenAI 兼容 `POST chat/completions` SSE，无第三方 LLM SDK。按 `request.model` 选 Provider。

```ts
function createOpenAITransport(options: OpenAITransportOptions): OpenAITransport

interface OpenAITransportOptions {
  providers: ChatProvider[] // 至少 1 个；每个至少 1 个 model
  headers?: Record<string, string> // 全局头，Provider.headers 优先
  body?: Record<string, unknown> // 全局额外字段，如 temperature
}

type OpenAITransport = ChatTransport & {
  readonly models: ChatModelOption[]
  readonly defaultModel: string // 第一个 Provider 的第一个模型
}

interface ChatProvider {
  id: string
  label?: string
  endpoint: string // 完整 URL 或相对路径
  apiKey?: string // 有则 Authorization: Bearer；相对路径场景可省略
  headers?: Record<string, string>
  applyReasoning?: (level: string, body: Record<string, unknown>) => void
  models: ChatModel[]
}

interface ChatModel {
  id: string
  label?: string
  description?: string // 选择器副标题
  reasoningLevels?: ChatReasoningLevel[]
  defaultReasoningLevel?: string
}
```

请求体（公共契约）：

```ts
{
  ...globalBody,
  model: modelId,
  stream: true,
  stream_options: { include_usage: true },
  messages: /* 见下 */,
  tools?: [{ type: 'function', function: { name, description, parameters } }]
  // 若有 reasoningLevel：缺省 body.reasoning_effort = level；否则走 applyReasoning
}
```

`messages` 转换：

- `systemPrompt` → 首条 `{ role: 'system', content }`
- `user` + 附件 → `content: [{ type: 'text' }, { type: 'image_url', image_url: { url: dataUrl } }]`
- `assistant` + `toolCalls` → OpenAI `tool_calls`（`type: 'function'`）
- `tool` → `{ role: 'tool', tool_call_id, content }`

SSE：`delta.content` → `onTextDelta`；`delta.reasoning_content ?? delta.reasoning` → `onReasoningDelta`；`tool_calls` 按 index 累积参数，完整后才 `onToolCall`；`usage` → `onUsage`（含缓存命中/未命中，缺字段不补 0）。未找到 model 时 `onError` 且不发请求。

未传 `models` 给 `UAiChat` 时不显示选择器。传入后切换模型会校正 `reasoningLevel`（无 levels 则清空；非法则落到 `defaultReasoningLevel` 或第一项）。

## ChatTransport

```ts
type ChatTransport = (
  request: ChatTransportRequest,
  handlers: ChatTransportHandlers
) => Promise<void> | void

interface ChatTransportRequest {
  messages: ChatMessage[] // 不含本轮刚插入的 assistant 占位
  systemPrompt?: string
  tools?: ChatTool[] // 含内置工具；自定义 transport 应自行决定是否下发
  model?: string
  reasoningLevel?: string
  signal: AbortSignal
}

interface ChatTransportHandlers {
  onTextDelta(delta: string): void
  onReasoningDelta?(delta: string): void
  onToolCall?(call: { id: string; name: string; arguments: string }): void // 完整参数，不要分片
  onUsage?(usage: ChatTokenUsage): void // 接口未返回 usage 时不要调用
  onError?(error: Error): void
}

interface ChatTokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cacheHitTokens?: number // cached_tokens / prompt_cache_hit_tokens / cache_read_input_tokens
  cacheMissTokens?: number // prompt_cache_miss_tokens，或 prompt − 命中
  cacheCreationTokens?: number // cache_creation_input_tokens
}
```

自定义 transport 可忽略 `model` / `reasoningLevel`。`signal.aborted` 时不要再调 `onError`（用户停止不是错误）。

## useChat

与 UI 解耦的状态机。`UAiChat` 内部即用它。

```ts
function useChat(options: { props: AiChatProps; emit: AiChatEmits }): {
  messages: Ref<ChatMessage[]>
  model: Ref<string | undefined>
  reasoningLevel: Ref<string | undefined>
  running: Ref<boolean>
  queue: Ref<ChatQueuedMessage[]>
  tokenUsage: Ref<ChatTokenUsage | null>
  lastTurnUsage: Ref<ChatTokenUsage | null>
  send(content: string, attachments?: ChatAttachment[]): void
  abort(): void
  regenerate(): void
  clear(): void
  respondToolCall(toolCallId: string, approved: boolean): void
  enqueue(content: string, attachments?: ChatAttachment[], beforeId?: string): ChatQueuedMessage
  startQueued(id: string): void
  removeQueued(id: string): ChatQueuedMessage | undefined
}
```

与 `AiChatExposed` 的差异：多了 `messages` / `model` / `reasoningLevel` / `running` / `respondToolCall`。无头 UI 必须自己画确认按钮并调用 `respondToolCall`。

队列：

| 事件                                               | 队列                                                |
| -------------------------------------------------- | --------------------------------------------------- |
| `finish`（含 terminal 成功、触及 `maxToolRounds`） | FIFO 自动发下一条                                   |
| `startQueued(id)`                                  | 中断当前，该条插队为下一条                          |
| 手动 `abort` / 用户停止                            | 保留，不自动接续                                    |
| `error`                                            | 保留，不自动接续                                    |
| `clear()`                                          | 消息、队列与 token 统计一起清空（生成中会先 abort） |

`send` 空内容且无附件时是空操作。生成中 `send` 等价于 `enqueue`。

## 内置 askQuestion

`useChat` / `UAiChat` 始终注入，无需注册。模型在需求不清时调用，UI 为分页表单（选项或自定义输入），提交后回灌。

传给模型的 schema：

```ts
{
  name: 'askQuestion',
  description: '当需求不明确或存在歧义时，向用户提问以澄清。一次可提 1-4 个关键问题；每个问题可提供若干预设选项，用户可选择选项或自定义输入。用户作答后再继续生成。',
  parameters: {
    type: 'object',
    required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        minItems: 1,
        maxItems: 4,
        items: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            placeholder: { type: 'string' }
          }
        }
      }
    }
  }
}
```

结果类型（已导出）：`AskQuestionArgs` / `AskQuestionResult` / `AskQuestionItem` / `AskQuestionAnswer`。用户停止时提问 Promise 以 `AbortError` 失败。

## UAiOrb

独立 canvas 活体球。`UAiChat` 空闲欢迎区与生成中「工作中…」已内置，一般不必再嵌一套。`status: 'thinking'` 时右上角绘制与球体同色的「?」。

```ts
interface AiOrbProps {
  size?: number // 直径 px，默认 48
  status?: 'idle' | 'thinking' | 'speaking' // 默认 idle
}

interface AiOrbEmits {
  (e: 'click'): void
}

interface AiOrbExposed {
  react(reaction: 'happy' | 'shock' | 'frustrated'): void // 约 1–2s 后回到 status
}
```

`UAiChat` 内：工具失败播 `frustrated`；对话结束停留约 2.5s（成功 `happy`，出错 `frustrated`，用户中断只停留）。

## 布局与交互（UAiChat）

- 消息 / 队列 / 输入限宽 800px 居中；侧边面板开合时主列排版不跟着挤。
- 流式输出默认吸底；用户上翻立即取消，顶部「最新消息」回底。
- 空会话时输入区垂直居中，欢迎区贴在输入框上方。
- Markdown 由 `markstream-vue` 渲染；mermaid / katex 等可选能力不内置，需宿主自行装 peer 并经 `rendererProps` 打开。
