---
title: requestAiText AI 文本请求与 SSE 解析
description: OpenAI 兼容 chat/completions 请求层：requestAiText 用单份服务商配置发系统/用户提示词并流式或一次性取回文本；buildOpenAIBody 构造请求体，parseOpenAISSEStream / parseOpenAICompletionText 解析流式与非流式响应，requestOpenAIStream 发送流式请求。
aliases: [requestAiText, requestOpenAIStream, buildOpenAIBody, parseOpenAISSEStream, parseOpenAICompletionText, AiProviderConfig, OpenAI transport, AI 请求]
keywords:
  [
    requestAiText,
    requestOpenAIStream,
    buildOpenAIBody,
    parseOpenAISSEStream,
    parseOpenAICompletionText,
    AiProviderConfig,
    AiTokenUsage,
    AiStreamHandlers,
    reasoning_effort,
    stream_options,
    include_usage,
    chat/completions,
    SSE,
    流式,
    推理等级,
    中断请求,
    AbortSignal,
    token用量,
    工具调用
  ]
---

# requestAiText AI 文本请求与 SSE 解析

`@veltra/utils` 导出 OpenAI 兼容（chat/completions）请求层：`requestAiText` 面向组件的单配置入口，`requestOpenAIStream` / `buildOpenAIBody` / `parseOpenAISSEStream` / `parseOpenAICompletionText` 为可复用的协议原语，配套 `AiProviderConfig` 等类型。手写 `fetch` + SSE 解析，无第三方依赖；不依赖 `@veltra/ai`。

## 快速上手

用一份服务商配置把「系统提示词 + 用户提示词」发给 OpenAI 兼容端点，一次性取回完整文本：

```ts
import { requestAiText } from '@veltra/utils'

await requestAiText({
  config: {
    url: 'https://api.example.com/v1/chat/completions', // OpenAI 兼容端点完整地址
    apiKey: 'sk-<your-key>',
    model: 'gpt-x',
    stream: false // 缺省即 false，一次性返回
  },
  systemPrompt: '你是表单填充助手',
  prompt: '生成一段收货地址',
  onSuccess: (text) => {
    console.log(text) // => 完整回复文本
  },
  onError: (error) => {
    console.error(error.message) // 网络错误 / 非 2xx / 流中断
  }
})
```

## API 签名

```ts
/** AI 服务商配置（OpenAI 兼容 chat/completions），可全局共享、字段级合并 */
export interface AiProviderConfig {
  /** 完整请求地址（语义同 @veltra/ai 的 endpoint） */
  url: string
  /** Bearer Token，缺省不带 Authorization 头 */
  apiKey?: string
  /** 模型 id */
  model: string
  /** 推理等级；缺省不写入请求体，提供时默认写 reasoning_effort */
  reasoningLevel?: string
  /** 是否流式返回，缺省 false */
  stream?: boolean
}

/** 一次完整的工具调用 */
export interface AiToolCall {
  id: string
  name: string
  /** 模型输出的原始 JSON 参数串 */
  arguments: string
}

/** 请求侧消息的最小结构；@veltra/ai 的 ChatMessage 满足该形状 */
export interface AiMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  /** 用户消息图片附件（转 OpenAI image_url 内容分片） */
  attachments?: ReadonlyArray<{ dataUrl: string }>
  toolCalls?: ReadonlyArray<AiToolCall>
  toolCallId?: string
}

/** 请求侧工具定义的最小结构；@veltra/ai 的 ChatTool 满足该形状 */
export interface AiTool {
  name: string
  description: string
  parameters: Record<string, unknown>
}

/** token 用量；仅含接口实际返回的字段，缓存类数字缺省 undefined 不补 0 */
export interface AiTokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cacheHitTokens?: number
  cacheMissTokens?: number
  cacheCreationTokens?: number
}

/** SSE 流事件回调（请求错误由请求层处理，不经此抛出） */
export interface AiStreamHandlers {
  onTextDelta(delta: string): void
  onReasoningDelta?(delta: string): void
  onToolCall?(call: AiToolCall): void
  /** 流式末包 usage；接口未返回时不调用 */
  onUsage?(usage: AiTokenUsage): void
}

/** requestAiText 的入参 */
export interface AiTextRequestOptions {
  config: AiProviderConfig
  /** 用户提示词（user 消息） */
  prompt: string
  /** 系统提示词，存在时作为首条 system 消息 */
  systemPrompt?: string
  /** 中断信号；中断后不触发任何回调（静默） */
  signal?: AbortSignal
  /** 文本增量，仅流式时逐段触发 */
  onDelta?(delta: string): void
  /** 成功：流式为全部增量拼接，非流式为完整响应文本 */
  onSuccess?(text: string): void
  /** 失败：网络错误、非 2xx 响应、流中断 */
  onError?(error: Error): void
}

/** 面向组件的单配置请求入口，返回 Promise<void>（结果经回调交付） */
export function requestAiText(options: AiTextRequestOptions): Promise<void>

/** 请求体构造选项 */
export interface OpenAIBodyOptions {
  model: string
  messages: readonly AiMessage[]
  systemPrompt?: string
  tools?: readonly AiTool[]
  /** 缺省 false */
  stream?: boolean
  reasoningLevel?: string
  /** 自定义推理等级写入，缺省写 reasoning_effort */
  applyReasoning?(level: string, body: Record<string, unknown>): void
  /** 额外请求体字段，展开在最前，同名字段以构造结果为准 */
  extraBody?: Record<string, unknown>
}

/** 构造 OpenAI 兼容请求体；stream=true 时带 stream_options.include_usage */
export function buildOpenAIBody(options: OpenAIBodyOptions): Record<string, unknown>

/** 逐行解析 SSE 流；signal 中断即停；读流异常原样向外传播 */
export function parseOpenAISSEStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal | undefined,
  handlers: AiStreamHandlers
): Promise<void>

/** 从非流式 JSON 响应取 choices[0].message.content；形状不含文本返回 undefined */
export function parseOpenAICompletionText(json: unknown): string | undefined

/** OpenAI 兼容请求发送选项 */
export interface OpenAIRequestOptions {
  url: string
  apiKey?: string
  /** 额外请求头，覆盖同名默认头 */
  headers?: Record<string, string>
  body: Record<string, unknown>
  signal?: AbortSignal
}

/** OpenAI 兼容流式请求回调 */
export interface OpenAIStreamCallbacks extends AiStreamHandlers {
  /** 请求错误（网络错误、非 2xx、流中断）；signal 中断时静默 */
  onError?(error: Error): void
}

/** 流式请求：fetch + SSE 解析；返回流是否完整读取（false = 失败或已中断） */
export function requestOpenAIStream(
  options: OpenAIRequestOptions,
  callbacks: OpenAIStreamCallbacks
): Promise<boolean>
```

## 参数说明

### requestAiText

| 参数           | 类型                | 默认 | 必填 | 约束                                                                 |
| -------------- | ------------------- | ---- | :--: | -------------------------------------------------------------------- |
| `config`       | `AiProviderConfig`  | —    |  是  | `url` / `model` 必填；`stream` 缺省 `false`                           |
| `prompt`       | `string`            | —    |  是  | 作为 user 消息                                                       |
| `systemPrompt` | `string`            | —    |  否  | 存在（非空串）时作为首条 system 消息                                 |
| `signal`       | `AbortSignal`       | —    |  否  | 中断后不触发任何回调（静默）                                         |
| `onDelta`      | `(delta) => void`   | —    |  否  | 仅 `config.stream === true` 时逐段触发                               |
| `onSuccess`    | `(text) => void`    | —    |  否  | 流式为全部增量拼接；非流式为完整响应文本                             |
| `onError`      | `(error) => void`   | —    |  否  | 网络 / 非 2xx / 流中断 / 响应缺可解析文本                            |

请求行为：

- 方法 `POST`，头 `Content-Type: application/json`；`apiKey` 存在时附 `Authorization: Bearer <apiKey>`，缺省不带。
- 请求体含 `model`、`stream`、`messages`；`stream: true` 时附 `stream_options: { include_usage: true }`。
- `reasoningLevel` 提供时写 `reasoning_effort`，缺省不写该字段。
- 非 2xx 触发 `onError`，message 为 `请求失败（<status>）：<响应体或statusText>`。
- 非流式响应无 `choices[0].message.content` 字符串时触发 `onError`，message 为 `响应不包含可解析的文本内容`。

### buildOpenAIBody

| 参数             | 类型                            | 默认 | 必填 | 约束                                                       |
| ---------------- | ------------------------------- | ---- | :--: | ---------------------------------------------------------- |
| `model`          | `string`                        | —    |  是  | 写入请求体 `model`                                         |
| `messages`       | `readonly AiMessage[]`          | —    |  是  | 转 wire 格式：附件转 `image_url` 分片、toolCalls 转 `tool_calls` |
| `systemPrompt`   | `string`                        | —    |  否  | 存在时作为首条 system 消息                                 |
| `tools`          | `readonly AiTool[]`             | —    |  否  | 非空才写 `tools` 字段                                      |
| `stream`         | `boolean`                       | 否   |  否  | 写入请求体 `stream`；`true` 时附 `stream_options.include_usage` |
| `reasoningLevel` | `string`                        | —    |  否  | 提供时由 `applyReasoning` 写入，缺省写 `reasoning_effort`   |
| `applyReasoning` | `(level, body) => void`         | —    |  否  | 自定义推理等级写入字段                                     |
| `extraBody`      | `Record<string, unknown>`       | —    |  否  | 展开在最前；其 `stream_options` 与 `include_usage` 合并保留 |

## 方法与事件

### requestAiText / requestOpenAIStream / parseOpenAISSEStream

均返回 `Promise`，异步执行，不抛请求错误（错误经 `onError` 交付；`parseOpenAISSEStream` 例外：读流异常原样向外传播，由调用方处理）。

### SSE 解析规则（parseOpenAISSEStream）

- 只处理以 `data:` 开头的行；`data: [DONE]` 结束标记跳过；单帧 JSON 解析失败静默跳过。
- 文本增量 `choices[0].delta.content` → `onTextDelta`。
- 思考增量兼容 `delta.reasoning_content`（DeepSeek 风格）与 `delta.reasoning`，均触发 `onReasoningDelta`。
- `delta.tool_calls` 按 `index` 累积参数分片，同一调用完整后才触发 `onToolCall`；流结束统一 flush。
- `usage` 解析：`prompt_tokens`/`input_tokens`、`completion_tokens`/`output_tokens` 任一命中即触发 `onUsage`；缓存命中来源 `prompt_tokens_details.cached_tokens` / `input_tokens_details.cached_tokens` / `prompt_cache_hit_tokens` / `cache_read_input_tokens` / `cached_tokens`；未命中缺省时为 `prompt − 命中`；`cache_creation_input_tokens` 映射 `cacheCreationTokens`。无 usage 不触发。

## 典型示例

### 流式逐段渲染

```ts
import { requestAiText } from '@veltra/utils'

const controller = new AbortController()

await requestAiText({
  config: {
    url: 'https://api.example.com/v1/chat/completions',
    apiKey: 'sk-<your-key>',
    model: 'deepseek-chat',
    reasoningLevel: 'high',
    stream: true
  },
  prompt: '写一句欢迎语',
  signal: controller.signal,
  onDelta: (delta) => {
    console.log(delta) // 每次一段增量文本
  },
  onSuccess: (text) => {
    console.log(text) // => 全部增量拼接的完整文本
  },
  onError: (error) => {
    console.error(error.message)
  }
})

// 需要停止时：controller.abort()；之后不再触发任何回调
```

### 自定义传输层复用协议原语

```ts
import { buildOpenAIBody, requestOpenAIStream } from '@veltra/utils'

async function streamOnce(signal: AbortSignal) {
  const body = buildOpenAIBody({
    model: 'gpt-x',
    messages: [{ role: 'user', content: 'hi' }],
    tools: [{ name: 'lookup', description: '查数据', parameters: { type: 'object' } }],
    stream: true,
    extraBody: { temperature: 0.7 }
  })

  const completed = await requestOpenAIStream(
    {
      url: 'https://api.example.com/v1/chat/completions',
      apiKey: 'sk-<your-key>',
      headers: { 'X-Trace-Id': '1' },
      body,
      signal
    },
    {
      onTextDelta: (delta) => console.log(delta),
      onReasoningDelta: (delta) => console.log('[思考]', delta),
      onToolCall: (call) => console.log(call.id, call.name, call.arguments),
      onUsage: (usage) => console.log(usage.totalTokens),
      onError: (error) => console.error(error.message)
    }
  )
  // completed === false 表示失败（onError 已触发）或 signal 已中断
}
```

### 直接解析已拿到的响应体

```ts
import { parseOpenAICompletionText, parseOpenAISSEStream } from '@veltra/utils'

// 非流式 JSON
const text = parseOpenAICompletionText({ choices: [{ message: { content: '答案' } }] })
console.log(text) // => '答案'

// 流式 Response.body
const response = await fetch('https://api.example.com/v1/chat/completions', { method: 'POST' })
if (response.body) {
  await parseOpenAISSEStream(response.body, undefined, {
    onTextDelta: (delta) => console.log(delta)
  })
}
```

## 注意事项

> [!WARNING]
>
> - 本模块字段名是 `url` / `reasoningLevel`，不是 `@veltra/ai` Provider 的 `endpoint` / `reasoningLevel` 写入差异：`url` 语义与 `endpoint` 一致，都是完整请求地址。
> - `stream` 缺省是 `false`（一次性返回），不是 OpenAI SDK 某些封装的流式默认。
> - `signal` 中断后 `requestAiText` / `requestOpenAIStream` 不触发任何回调（静默）；需要呈现中断态时由调用方监听自己的 `AbortSignal`。
> - `onUsage` 只在接口返回 usage 时触发，不填 0 充数；流式要拿到末包 usage 依赖请求体里的 `stream_options.include_usage`（`buildOpenAIBody` 在 `stream: true` 时自动写入）。
> - `reasoning_effort` 仅在 `reasoningLevel` 为非空字符串时写入请求体；自定义字段用 `applyReasoning` 覆盖。
> - 错误 message 前缀固定为 `请求失败（<status>）：`（非 2xx）；按原文检索排障。
