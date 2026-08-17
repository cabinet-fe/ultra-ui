# AGENTS.md — @veltra/ai

AI 能力包。当前核心是对话域：工具定义 + 自动编排的 `UAiChat` 组件、与 UI 解耦的 `useChat()` 状态机、可插拔 transport。按域组织代码，便于后续扩展模型提供商配置（`providers/`）、内置工具注册（`tools/`）等能力。

## 结构

```
src/
├── index.ts                    # export * from './chat' + './components'；type * from './providers'；AskQuestion* 类型显式导出；type * from './types'
├── style.ts                    # 全量样式入口
├── providers/                  # 模型提供商域（ChatProvider / ChatModel / ChatModelOption）
├── chat/                       # 对话核心域（UI 无关，不得 import 组件）
│   ├── types.ts                # ChatMessage / ChatQueuedMessage / ChatTool（含 icon/label/render/renderTo/panelWidth/panelTitle/autoCollapse/terminal）/ ChatTransport 等核心类型
│   ├── use-chat.ts             # useChat 状态机：消息管理 + 工具循环编排（runRound 递归，受 maxToolRounds 限制，terminal 工具成功即终结）+ 待发送队列（FIFO 自动接续）；透传 model / reasoningLevel
│   ├── transports/
│   │   └── openai.ts           # createOpenAITransport（多 Provider，按 model 路由；OpenAI 兼容 SSE）
│   └── __test__/
├── tools/                      # 内置工具注册域（UAiChat 自动注入；工厂不对外导出；可依赖 components/）
│   ├── index.ts                # createBuiltinTools 注册表（新增内置工具在此注册）
│   └── ask-question/           # 提问工具实现（deferred 挂起等待用户作答）
├── types/ai-chat.ts            # 组件类型：AiChatProps / AiChatEmits / AiChatExposed
├── types/ai-orb.ts             # AiOrbProps / AiOrbEmits / AiOrbStatus / AiOrbReaction / AiOrbExposed
└── components/
    ├── ai-chat/
    │   ├── ai-chat.vue         # UAiChat 主组件（useChat + provide DI；toolMap 含内置工具元信息；renderTo: 'panel' 调用的面板状态；ULayout 分列与面板宽度）
    │   ├── message-list.vue    # UScroll 消息列表：流式吸底（滚轮上翻立即取消吸附 + 方向感知兜底 +「最新消息」悬浮按钮一键回底；吸底滚动前二次确认吸附状态，避免流式期间把上翻用户拉回底部）；生成中列表末尾展示较大 UAiOrb +「工作中…」（工具调用失败播 frustrated；结束 / 失败停留约 2.5s，成功播 happy、出错播 frustrated 再隐藏）；默认欢迎区为较小 UAiOrb + 逐条轮换的 welcome 快捷提问（点文案发送，点球立即换一条并重置轮换计时；固定锚点布局——球钉死不动，气泡只向右延展，文案长度变化不会瞬移）
    │   ├── message-item.vue    # 单条消息（reasoning 折叠块：折叠时 v-if 卸载内容 DOM；展开态 UScroll 限高 220px + 区内上翻取消内部吸底 + 思考中扫光 + ArrowRight 折叠箭头；MarkdownRender + 工具卡片）
    │   ├── tool-call.vue       # 工具卡片（复用 UCollapseItem，#header 自定义紧凑单行头；needsConfirm 确认；消费工具 icon/label/render/renderTo/autoCollapse/terminal；终态折叠后 destroyOnCollapse 卸载内容 DOM——进行中/待确认保留内容状态、面板工具保留「查看面板」入口；面板工具 body 仅留「查看面板」入口）
    │   ├── side-panel.vue      # 右侧侧边面板（renderTo: 'panel' 工具的渲染区：悬浮卡片——面板本体透明留白、内层圆角卡片仅靠背景对比+阴影区分，无分割线；头部 icon 底托/标题/关闭，标题取 panelTitle ?? label ?? name + UScroll 渲染体）
    │   ├── queue-list.vue      # 待发送队列（生成中提交的消息排队；立即开始插队 / 取回编辑 / 移除）
    │   ├── ask-question.vue    # 提问工具的内联分页表单（由内置 askQuestion 工具挂到 render）
    │   ├── chat-input.vue      # 输入区（多行自适应、图片附件、模型/推理选择、生成中空输入显示停止 / 有内容则发送入队；暴露 setContent/getContent）
    │   ├── model-picker.vue    # 模型/推理选择器（UDropdown 面板：模型列表 + 思考强度内联展开）
    │   ├── di.ts               # AiChatDIKey（cls + slots + tools 注入，支撑 tool-<name> 动态插槽与工具元信息）
    │   └── __test__/
    └── ai-orb/                 # UAiOrb 活体球头像（独立于 ai-chat 可复用）
        ├── orb-renderer.ts     # 纯 canvas 2D 渲染器：扁平纯色扁椭圆（蔚蓝 + 白色大眼睛，闭眼为白色线条）、原地呼吸无弹跳无打光；眼部状态机（眨眼 / 双眨、视线游移转头、thinking 眯眼扫视）+ 瞬时表情 react（happy 弯眼点头 / shock 睁大眼 / frustrated 闭眼摇头）+ 指针交互（setPointer 视线跟随、poke Q 弹回弹）；单位球空间绘制、可见性启停 rAF、reduced-motion 静态帧
        ├── ai-orb.vue          # Vue 封装（size/status props + click emit；expose react(reaction) 播放瞬时表情；指针事件桥接渲染器）
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
- **侧边面板工具**：`ChatTool.renderTo: 'panel'` 把 render 组件渲染到对话区右侧的侧边面板（side-panel.vue），契约同卡片 render（`ChatToolRenderProps`，随 toolCall 状态实时更新）；新的面板调用自动打开并聚焦，工具卡片 body 仅留「查看面板」入口（经 DI `openPanel` 切换聚焦，可切回历史调用）；布局基于 `ULayout`（`cols = 1fr + 面板宽度`，`colMinSizes` 约束会话区 ≥360px、面板 ≥320px，`useResizeObserver` 跟踪拖拽后的实际宽度）；`ChatTool.panelWidth` 可指定该工具面板的默认宽度（聚焦其调用时应用；缺省取「容器宽 - 860」，即面板默认尽可能大、会话区保留 860px）；`ChatTool.panelTitle`（字符串或按 toolCall 动态生成的函数）给出业务化面板标题（「业务对象 + 动作」），缺省取 label ?? name。组件根背景为 bg-color-bottom，消息/队列/输入区限宽 800px 居中（面板开合时排版不形变），卡片类元素（输入区、面板卡、欢迎气泡）用 bg-color-top + 阴影而非边框区分层级。空会话（无可见消息）时主列挂 `is-empty`：列表区与末尾弹性占位均分剩余空间使输入区垂直居中，欢迎区（orb + 快捷提问）在滚动内容列中 `flex: 1` 底部对齐、贴于输入区上方且 orb 与输入框左对齐；出现消息（会话开始 / 载入非空会话）后自动回落到底部布局，工作状态 orb 逻辑不变。
- **待发送队列**：会话进行中 `send` 的消息进入 `queue`（不再丢弃），自然完成（finish）后按 FIFO 自动接续；`startQueued(id)` 中断当前会话并插队执行（其余保持顺序）；`enqueue(content, attachments?, beforeId?)` 支持锚点插入（编辑回插保持前后项顺序）；手动 `abort()` / 出错时队列保留不自动接续；`clear()` 一并清空队列。编辑流由 ai-chat.vue 以后继 id 锚点实现（取回输入框 → 重新提交插回原位置）。
- **扫光**：文字扫光使用 `@veltra/styles/animations` 提供的全局可复用类 `u-shine`（纯 CSS，background-clip: text，含 prefers-reduced-motion 降级），随 ai-chat 的 `style.ts` 按需加载；思考中与进行中的工具名自动应用。

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
