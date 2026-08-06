# UAiChat - AI 对话

## 类型文件

见 `./types.d.ts`

## 示例

见 `./examples.md`

## 辅助工具

本组件通常配合以下工具来使用。

### createOpenAITransport

创建 OpenAI 兼容协议（chat/completions SSE）的对话传输层；支持多 Provider，按 `request.model` 路由到对应 `endpoint`（完整 URL 或相对路径均可）。也可自行实现 ChatTransport 接入任意后端。

返回值在函数对象上挂载只读 `.models`（扁平 `ChatModelOption[]`）与 `.defaultModel`，可直接传给 `UAiChat` 的 `models` / `model`。

**破坏性变更**：旧的单字段 `{ endpoint, apiKey, model }` 已移除，请改用 `providers`。

使用示例:

```ts
import { createOpenAITransport } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'deepseek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
      models: [{ id: 'deepseek-chat', label: 'DeepSeek Chat' }]
    }
  ]
})
```

### useChat

与 UI 解耦的对话编排状态机（消息管理 + 工具调用循环），UAiChat 内部即基于它实现；需要无头（headless）对话或完全自定义 UI 时直接使用。`useChat` 会始终注入内置工具（如 `askQuestion`），与传入的 `tools` 合并（同名内置优先）。请求会携带当前 `model` / `reasoningLevel`。

使用示例:

```ts
import { useChat, type AiChatEmits } from '@veltra/ai'

// emit 需满足 AiChatEmits 签名：'update:messages' | 'update:model' | 'update:reasoningLevel' | 'send' | 'finish' | 'error' | 'tool-call'
const emit = ((event: string, ...args: unknown[]) => {
  console.log(event, args)
}) as AiChatEmits

const chat = useChat({ props: { transport, tools, models: transport.models }, emit })

chat.send('你好')
// chat.messages.value / chat.model.value / chat.reasoningLevel.value / chat.running.value
// chat.abort() / chat.regenerate() / chat.clear()
```
