# @veltra/ai

AI 能力包：对话组件、编排状态机与可插拔传输层。以工具定义为核心：在不同场景传入不同 `tools`，即可赋予对话助手不同能力，组件自动编排工具调用循环（tool_calls → 执行 → 结果回灌 → 继续生成）。

前置依赖 `@veltra/desktop`（内部使用 UButton / UIcon / UScroll）与 `markstream-vue`（流式 markdown 渲染）。

```ts
import { UAiChat, useChat, createOpenAITransport } from '@veltra/ai'
import type { ChatTool, ChatTransport, ChatMessage, AiChatExposed } from '@veltra/ai'
import '@veltra/ai/style'
```

## 详细文档

- API 与辅助工具（createOpenAITransport / useChat）：`./ai-chat/api.md`
- 示例（基础对话 / 工具定义 / needsConfirm 确认 / 自定义结果插槽 / 自定义 transport / 受控消息）：`./ai-chat/examples.md`
- 类型：`./ai-chat/types.d.ts`

## 核心概念

- **ChatTool**：`{ name, description, parameters(JSON Schema), needsConfirm?, execute }`；`needsConfirm` 工具执行前在工具卡片内联「允许 / 拒绝」。
- **ChatTransport**：通信层适配器，组件不绑定具体 LLM 协议。内置 `createOpenAITransport()`（OpenAI 兼容 SSE，零额外依赖），也可自行实现 `ChatTransport` 接任意后端。
- **useChat**：与 UI 解耦的对话编排状态机（UAiChat 内部同款），用于无头对话或完全自定义 UI。
- **工具结果插槽**：`tool-<name>` 插槽自定义某个工具的结果渲染。
- **实例方法**：`send` / `abort` / `regenerate` / `clear`；消息支持 `v-model:messages` 受控。
