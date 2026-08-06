# AGENTS.md — @veltra/ai

AI 能力包。当前核心是对话域：工具定义 + 自动编排的 `UAiChat` 组件、与 UI 解耦的 `useChat()` 状态机、可插拔 transport。按域组织代码，便于后续扩展模型提供商配置（`providers/`）、工具定义辅助（`tools/`）等能力。

## 结构

```
src/
├── index.ts                    # export * from './chat' + './components' + './tools' + type * from './types'
├── style.ts                    # 全量样式入口
├── chat/                       # 对话核心域（UI 无关，不得 import 组件）
│   ├── types.ts                # ChatMessage / ChatTool（含 icon/label/render/autoCollapse）/ ChatTransport 等核心类型
│   ├── use-chat.ts             # useChat 状态机：消息管理 + 工具循环编排（runRound 递归）
│   ├── transports/
│   │   └── openai.ts           # createOpenAITransport（OpenAI 兼容 SSE，手写解析）
│   └── __test__/
├── tools/                      # 工具定义辅助域（可依赖 components/ 提供带 UI 的内置工具）
│   └── ask-question/           # createAskQuestionTool 内置提问工具（deferred 挂起等待用户作答）
├── types/ai-chat.ts            # 组件类型：AiChatProps / AiChatEmits / AiChatExposed
└── components/ai-chat/
    ├── ai-chat.vue             # UAiChat 主组件（provide DI + useChat + defineExpose）
    ├── message-list.vue        # UScroll 消息列表，流式吸底
    ├── message-item.vue        # 单条消息（reasoning 折叠块 + MarkdownRender + 工具卡片）
    ├── tool-call.vue           # Kimi 风格可折叠工具卡片（needsConfirm 确认；消费工具 icon/label/render/autoCollapse）
    ├── ask-question.vue        # 提问工具的内联分页表单（由 createAskQuestionTool 挂到 render）
    ├── chat-input.vue          # 输入区（多行自适应、图片附件、发送/停止）
    ├── di.ts                   # AiChatDIKey（cls + slots + tools 注入，支撑 tool-<name> 动态插槽与工具元信息）
    └── __test__/
```

## 约定

- **域划分**：`chat/` 是纯逻辑域（类型、编排、transport），禁止依赖 Vue 组件（`import type` 类型导入允许）；`components/` 只放 UI，通过 `chat/` 复用核心逻辑；`tools/` 是工具定义辅助域，可依赖 `components/` 提供带 UI 的内置工具（如 `createAskQuestionTool`）。新能力开新顶层域目录（如 `providers/`），不要塞进组件目录。
- 组件遵循 `packages/desktop/AGENTS.md` 的模式（BEM + token 样式、types 目录、style.ts 副作用入口）。
- **新增/删除 `components/<name>/`（含 `index.ts` + `style.ts`）后，在仓库根运行 `bun run resolver:gen`** 刷新 `@veltra/vite` 组件表，否则宿主无法按需解析 `<u-ai-chat>` 这类标签。
- 跨包导入 desktop 组件用包名：`import { UButton } from '@veltra/desktop'`；样式副作用用子路径 `'@veltra/desktop/components/<dir>/style'`。
- transport 不引入 ai-sdk 等第三方依赖，SSE 手写解析；新增协议在 `chat/transports/` 以独立 `createXxxTransport` 工厂导出。
- 工具串行执行（保持结果消息与调用顺序一致）；循环/泵取一律用递归或 Promise 链，禁止 await-in-loop（lint 硬性约束，不允许 disable 注释）。

## 依赖

- **dependencies**：`markstream-vue`（流式 markdown 渲染，可选 peer 如 mermaid/katex 不内置）
- **peer**：`@veltra/desktop`、`@veltra/icons`、`@veltra/styles`、`@veltra/utils`、`@veltra/compositions`、`vue`
- **被依赖**：`playground`

## 验证

```bash
bun run lint
vp test run chat            # useChat 状态机与 UAiChat 组件挂载测试
vp pack -F @veltra/ai
bun run build               # 依赖 desktop，需拓扑构建
```
