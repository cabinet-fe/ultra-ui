# @veltra/ai

AI 能力包：对话组件、编排状态机与可插拔传输层。以工具定义为核心：在不同场景传入不同 `tools`，即可赋予对话助手不同能力，组件自动编排工具调用循环（tool_calls → 执行 → 结果回灌 → 继续生成）。

前置依赖 `@veltra/desktop`（内部使用 UButton / UIcon / UScroll / UDropdown / UFilePicker）与 `markstream-vue`（流式 markdown 渲染）。

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
- 示例（基础对话 / 多 Provider / 模型与推理选择 / 工具定义 / needsConfirm 确认 / 自定义工具卡片 render / 终结工具 terminal / 待发送队列 / 自定义结果插槽 / 内置提问工具 / 自定义 transport / 受控消息）：`./ai/examples.md`
- 类型：`./ai/types.d.ts`

## 核心概念

- **ChatTool**：`{ name, description, parameters(JSON Schema), needsConfirm?, execute }`；`needsConfirm` 工具执行前在工具卡片内联「允许 / 拒绝」。UI 元信息 `icon` / `label` / `render` / `autoCollapse` 只影响展示；`terminal: true` 为终结工具——执行成功后对话即结束（工具 UI 即最终答复，不再回灌模型生成文字），`maxToolRounds`（默认 10）限制失控循环。
- **内置提问工具**：`askQuestion` 由 `useChat` 始终自动注入（`UAiChat` 同款，无需手动创建）；模型可发起分页提问，用户作答后回灌。
- **ChatProvider / ChatModel**：多服务商配置；`createOpenAITransport({ providers })` 按模型 id 路由请求；返回值含 `.models` / `.defaultModel`。
- **ChatTransport**：通信层适配器，组件不绑定具体 LLM 协议。内置 `createOpenAITransport()`（OpenAI 兼容 SSE，零额外依赖），也可自行实现 `ChatTransport` 接任意后端。请求可携带 `model` / `reasoningLevel`。
- **模型/推理选择**：传入 `models`（或 `transport.models`）后输入栏展示模型选择器（`description` 为选项副标题）；当前模型声明了 `reasoningLevels` 时，选择器面板底部出现「思考强度」区。支持 `v-model:model` / `v-model:reasoning-level`。
- **useChat**：与 UI 解耦的对话编排状态机（UAiChat 内部同款），用于无头对话或完全自定义 UI；内部始终合并内置工具。
- **工具结果插槽**：`tool-<name>` 插槽自定义某个工具的结果渲染。
- **待发送队列**：会话进行中提交的消息进入队列（内置 UI 在输入区上方），收尾后按 FIFO 自动接续；「立即开始」中断插队、「编辑」取回输入框后插回原位置；实例方法 `queue` / `startQueued` / `removeQueued` / `enqueue` 可编程控制。
- **实例方法**：`send` / `abort` / `regenerate` / `clear`；消息支持 `v-model:messages` 受控。
