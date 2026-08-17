# AGENTS.md — @veltra/ai

AI 能力包。当前核心是对话域：工具定义 + 自动编排的 `UAiChat` 组件、与 UI 解耦的 `useChat()` 状态机、可插拔 transport。按域组织代码，便于后续扩展模型提供商配置（`providers/`）、内置工具注册（`tools/`）等能力。

## 结构

```
src/
├── index.ts                    # export * from './chat' + './components'；type * from './providers'；AskQuestion* 类型显式导出；type * from './types'
├── style.ts                    # 全量样式入口
├── providers/                  # 模型提供商域（ChatProvider / ChatModel / ChatModelOption）
├── chat/                       # 对话核心域（UI 无关，不得 import 组件）
│   ├── types.ts                # ChatMessage / ChatQueuedMessage / ChatTool（含 icon/label/render/autoCollapse/terminal）/ ChatTransport 等核心类型
│   ├── use-chat.ts             # useChat 状态机：消息管理 + 工具循环编排（runRound 递归，受 maxToolRounds 限制，terminal 工具成功即终结）+ 待发送队列（FIFO 自动接续）；透传 model / reasoningLevel
│   ├── transports/
│   │   └── openai.ts           # createOpenAITransport（多 Provider，按 model 路由；OpenAI 兼容 SSE）
│   └── __test__/
├── tools/                      # 内置工具注册域（UAiChat 自动注入；工厂不对外导出；可依赖 components/）
│   ├── index.ts                # createBuiltinTools 注册表（新增内置工具在此注册）
│   └── ask-question/           # 提问工具实现（deferred 挂起等待用户作答）
├── types/ai-chat.ts            # 组件类型：AiChatProps / AiChatEmits / AiChatExposed
├── types/ai-orb.ts             # AiOrbProps / AiOrbStatus
└── components/
    ├── ai-chat/
    │   ├── ai-chat.vue         # UAiChat 主组件（useChat + provide DI；toolMap 含内置工具元信息）
    │   ├── message-list.vue    # UScroll 消息列表：方向感知的流式吸底（上翻取消吸附 +「最新消息」悬浮按钮一键回底）；生成中列表末尾展示 UAiOrb +「工作中…」；默认欢迎区为 UAiOrb + welcome 快捷提问卡片（点击即发送）
    │   ├── message-item.vue    # 单条消息（reasoning 折叠块：UScroll 限高 220px + 思考中扫光 + ArrowRight 折叠箭头；MarkdownRender + 工具卡片）
    │   ├── tool-call.vue       # 自绘紧凑可折叠工具卡片（ExpandTransition；needsConfirm 确认；消费工具 icon/label/render/autoCollapse/terminal）
    │   ├── queue-list.vue      # 待发送队列（生成中提交的消息排队；立即开始插队 / 取回编辑 / 移除）
    │   ├── ask-question.vue    # 提问工具的内联分页表单（由内置 askQuestion 工具挂到 render）
    │   ├── chat-input.vue      # 输入区（多行自适应、图片附件、模型/推理选择、生成中发送即入队 + 停止；暴露 setContent/getContent）
    │   ├── model-picker.vue    # 模型/推理选择器（UDropdown 面板：模型列表 + 思考强度内联展开）
    │   ├── di.ts               # AiChatDIKey（cls + slots + tools 注入，支撑 tool-<name> 动态插槽与工具元信息）
    │   └── __test__/
    └── ai-orb/                 # UAiOrb 活体球头像（独立于 ai-chat 可复用）
        ├── orb-renderer.ts     # 纯 canvas 2D 渲染器：渐变缓存于单位球空间、可见性启停 rAF、reduced-motion 静态帧
        ├── ai-orb.vue          # Vue 封装（size/status props，主题色 --u-color-primary 解析）
        └── __test__/
```

## 约定

- **域划分**：`chat/` 负责类型、编排、transport；`useChat` 内部导入 `createBuiltinTools` 并始终注入内置工具（同名内置优先覆盖 `props.tools`），因此可依赖 `tools/`（进而依赖带 UI 的内置工具组件）。`components/` 只放 UI，通过 `chat/` 复用核心逻辑；`tools/` 是内置工具注册域；`providers/` 放模型/服务商配置类型（与 UI/编排解耦）。工厂函数不对外导出，包入口对 tools 用显式 `export type { AskQuestionItem, AskQuestionAnswer, AskQuestionArgs, AskQuestionResult }`（勿用 `export type *`，否则会泄漏 `createBuiltinTools` 的类型）。新能力开新顶层域目录，不要塞进组件目录。
- **多 Provider transport**：`createOpenAITransport({ providers })` 按 `request.model` 查找 Provider 并 `fetch(endpoint)`；`endpoint` 可为完整 URL 或相对路径；模型 id 须跨 Provider 全局唯一；返回值挂载只读 `.models` / `.defaultModel` 供 UI 使用。旧的单字段 `{ endpoint, apiKey, model }` 已移除。
- **模型/推理选择**：`AiChatProps.models` 有值时输入栏展示自定义模型选择器（`model-picker.vue`，基于 `UDropdown`）；模型行右侧的思考强度胶囊点击后在行内手风琴展开等级列表（grid 0fr→1fr 过渡，同时只展开一个），选中等级即同时切到该模型并关闭面板。`ChatModel.description` 为面板副标题。选中值经 `ChatTransportRequest.model` / `reasoningLevel` 逐轮下发；切换模型时自动校正推理等级。
- 组件遵循 `packages/desktop/AGENTS.md` 的模式（BEM + token 样式、types 目录、style.ts 副作用入口）。
- **新增/删除 `components/<name>/`（含 `index.ts` + `style.ts`）后，在仓库根运行 `bun run resolver:gen`** 刷新 `@veltra/vite` 组件表，否则宿主无法按需解析 `<u-ai-chat>` 这类标签。
- 跨包导入 desktop 组件用包名：`import { UButton } from '@veltra/desktop'`；样式副作用用子路径 `'@veltra/desktop/components/<dir>/style'`。
- transport 不引入 ai-sdk 等第三方依赖，SSE 手写解析；新增协议在 `chat/transports/` 以独立 `createXxxTransport` 工厂导出。
- 工具串行执行（保持结果消息与调用顺序一致）；循环/泵取一律用递归或 Promise 链，禁止 await-in-loop（lint 硬性约束，不允许 disable 注释）。
- **工具循环收敛**：`maxToolRounds`（props，默认 10）限制单次发送的最大生成轮次，超限即 finish 停止；`ChatTool.terminal` 工具执行成功后对话终结（结果仍入消息历史，失败/拒绝照常回灌），配合 `render` 实现"工具 UI 即答复"。两类结束都会发出 `finish`。
- **待发送队列**：会话进行中 `send` 的消息进入 `queue`（不再丢弃），自然完成（finish）后按 FIFO 自动接续；`startQueued(id)` 中断当前会话并插队执行（其余保持顺序）；`enqueue(content, attachments?, beforeId?)` 支持锚点插入（编辑回插保持前后项顺序）；手动 `abort()` / 出错时队列保留不自动接续；`clear()` 一并清空队列。编辑流由 ai-chat.vue 以后继 id 锚点实现（取回输入框 → 重新提交插回原位置）。
- **扫光**：`u-ai-chat__shine`（纯 CSS，background-clip: text 扫光，含 prefers-reduced-motion 降级）为全局可复用类，随 `@veltra/ai/style` 加载；思考中与进行中的工具名自动应用。

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
