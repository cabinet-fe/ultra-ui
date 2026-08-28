# @veltra/ai

对话 UI（`UAiChat`）与 UI 无关的 `useChat` 状态机。按 transport 形态接入两种工具来源。

## 客户端驱动

传入函数型 `ChatTransport`（通常 `createOpenAITransport`）和带 `execute` 的 `ChatTool[]`。前端持有历史，每轮把全量消息发给 OpenAI 兼容 SSE 端点，并在本地执行工具、维护队列与 `needsConfirm`。

```ts
import { createOpenAITransport, type ChatTool } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [{ id: 'openai', label: 'OpenAI', endpoint: '/ai/chat/completions', models: [...] }]
})

const tools: ChatTool[] = [
  {
    name: 'ping',
    description: '探测',
    parameters: { type: 'object', properties: {} },
    execute: async () => ({ ok: true })
  }
]
```

已有调用方无需改代码：`ChatTransport` / `ChatTool.execute` 必填签名不变。

## 服务端驱动

传入 `createServerTransport(adapter)`。`adapter` 只做协议翻译（订阅事件流、把 `send` / `cancel` / `respond` / `selectModel` / `fetchHistory` 打到远端）。包内完成 seq 校验、断线补拉、动作去重，再 fold 成消息 / 队列 / 作业。

```ts
import { createServerTransport, type ChatSessionAdapter } from '@veltra/ai'

const transport = createServerTransport(adapter)
```

此模式下 `tools` 只作按 `name` 的可选渲染元信息（`ChatToolMeta`），前端不定义、不执行工具。未注册的工具名走通用工具卡片。

## 本包不含 bedrock / DSH 桥

不实现、不导出 `createBedrockTransport`。DeepSeek harness（DSH）的 HTTP/WS 与 bedrock 适配由其它仓库提供 `ChatSessionAdapter`。
