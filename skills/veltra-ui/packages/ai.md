# @veltra/ai

AI 能力包：对话组件、编排状态机与可插拔传输层。以工具定义为核心：在不同场景传入不同 `tools`，即可赋予对话助手不同能力，组件自动编排工具调用循环（tool_calls → 执行 → 结果回灌 → 继续生成）。

前置依赖 `@veltra/desktop`（内部使用 UButton / UIcon / UScroll / USelect / UFilePicker）与 `markstream-vue`（流式 markdown 渲染）。

```ts
import { UAiChat, useChat, createOpenAITransport } from '@veltra/ai'
import type {
  ChatTool,
  ChatTransport,
  ChatMessage,
  ChatProvider,
  ChatModelOption,
  AiChatExposed
} from '@veltra/ai'
import '@veltra/ai/style'
```

## 详细文档

- API 与辅助工具（createOpenAITransport / useChat）：`./ai/api.md`
- 示例（基础对话 / 多 Provider / 模型与推理选择 / 工具定义 / needsConfirm 确认 / 自定义结果插槽 / 内置提问工具 / 自定义 transport / 受控消息）：`./ai/examples.md`
- 类型：`./ai/types.d.ts`

## 核心概念

- **ChatTool**：`{ name, description, parameters(JSON Schema), needsConfirm?, execute }`；`needsConfirm` 工具执行前在工具卡片内联「允许 / 拒绝」。
- **内置提问工具**：`askQuestion` 由 `useChat` 始终自动注入（`UAiChat` 同款，无需手动创建）；模型可发起分页提问，用户作答后回灌。
- **ChatProvider / ChatModel**：多服务商配置；`createOpenAITransport({ providers })` 按模型 id 路由请求；返回值含 `.models` / `.defaultModel`。
- **ChatTransport**：通信层适配器，组件不绑定具体 LLM 协议。内置 `createOpenAITransport()`（OpenAI 兼容 SSE，零额外依赖），也可自行实现 `ChatTransport` 接任意后端。请求可携带 `model` / `reasoningLevel`。
- **模型/推理选择**：传入 `models`（或 `transport.models`）后输入栏展示选择器；推理选择器仅在当前模型声明了 `reasoningLevels` 时显示。支持 `v-model:model` / `v-model:reasoning-level`。
- **useChat**：与 UI 解耦的对话编排状态机（UAiChat 内部同款），用于无头对话或完全自定义 UI；内部始终合并内置工具。
- **工具结果插槽**：`tool-<name>` 插槽自定义某个工具的结果渲染。
- **实例方法**：`send` / `abort` / `regenerate` / `clear`；消息支持 `v-model:messages` 受控。
