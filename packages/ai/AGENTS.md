# AGENTS.md — @veltra/ai

AI 能力包。核心是对话域：开箱即用的 `UAiChat` 组合壳层、17 个可脱离 `UAiChat` 独立使用的 L1/L2 原子与组合组件、与 UI 解耦的 `useChat()` 状态机、可插拔 transport。按域组织代码，便于扩展模型提供商配置（`providers/`）、内置工具注册（`tools/`）等能力。

## 结构

```text
src/
├── index.ts                    # export * from './chat' + './components'；额外导出 readFileAsAttachment；type * from './providers'；显式 AskQuestion* 类型（含 AskQuestionOption）；type * from './types'
├── style.ts                    # 全量样式入口（聚合导入 18 个导出组件样式）
├── providers/                  # 模型提供商域（ChatProvider / ChatModel / ChatModelOption / ChatReasoningLevel）
├── chat/                       # 对话核心域（UI 无关，不得 import 组件）
│   ├── types.ts                # ChatMessage / ChatQueuedMessage / ChatTokenUsage / ChatTool / ChatToolMeta / ChatJob / ChatTransport 等核心类型
│   ├── session.ts              # ChatSessionEvent / ChatSessionTransport / ChatSessionAdapter；isServerTransport；createServerTransport（包内 seq 校验 / 断线补拉 / in-flight 去重）
│   ├── fold.ts                 # 历史回放与实时 onEvent 共用的纯函数 fold
│   ├── use-chat.ts             # useChat 状态机：按 isServerTransport 分流；函数 transport 走工具循环，session 走 fold + session API
│   ├── transports/
│   │   └── openai.ts           # createOpenAITransport（多 Provider，按 model 路由；Responses API 优先、chat/completions 回退，请求体构造 / SSE 解析 / 错误处理复用 @veltra/utils 通用层）
│   └── __test__/
├── tools/                      # 内置工具注册域（UAiChat 与 useChat 自动注入；工厂不对外导出；可依赖 components/）
│   ├── index.ts                # createBuiltinTools 注册表（新增内置工具在此注册）
│   └── ask-question/           # 提问工具实现（deferred 挂起等待用户作答；renderTo: 'reply' + hideInSteps: true 仅在回复流渲染——contentOffset 为 0 时卡片在后补正文前，缺省或正文写完后到达时卡片在正文后，落在中间时同一气泡切开为前文、卡片、后文，不进步骤行列表；内部渲染 UAiQuestionCard）
├── types/
│   ├── index.ts                # 汇总导出 18 个公开组件的 ai-*.ts 类型
│   ├── ai-*.ts                 # 17 个独立组件 + ai-chat 的 Props / Emits / Exposed 与条目类型（ai-approval-banner / ai-attachments / ai-bubble / ai-chat / ai-composer / ai-context-picker / ai-context-usage / ai-job-bar / ai-message-list / ai-message-queue / ai-model-picker / ai-question-card / ai-reasoning / ai-reasoning-picker / ai-session-nav / ai-side-panel / ai-step-group / ai-tool-call）
│   └── ai-orb.ts               # 活体球内部类型（不从 types/index.ts 导出）：AiOrbProps / AiOrbEmits / AiOrbStatus / AiOrbReaction / AiOrbExposed
└── components/
    ├── index.ts                # 导出 17 个独立组件 + UAiChat（不导出 ai-orb / reply-tool / _shared）
    ├── _shared/                # 组件间共享基础模块（仅 readFileAsAttachment 经 src/index.ts 导出，其余均为包内私有）
    │   ├── _mixins.scss        # 工具栏触发器 / 状态色 / 面板头部按钮 / 等宽数据块样式混入
    │   ├── attachment.ts       # 附件分类、扩展名徽标文案、大小格式化与本地读取（readFileAsAttachment / readFilesAsAttachments）
    │   ├── di.ts               # AiChatDIKey（slots / tools / toolIcons / openPanel / previewImage 注入）
    │   ├── format-duration.ts  # 时长格式化（<60s Xs、≥60s Xm Ys）
    │   ├── thinking-icon.vue/.scss # 四角星思考动画图标
    │   ├── tool-call-brief.ts  # 工具头部摘要共用 composable（normalizeToolsMap / toolNeedsInteraction / useToolCallBrief）
    │   ├── tool-format.ts      # summarizeArguments / isSummarizedInHeader / clipText / lastNonEmptyLine
    │   ├── tool-icons.ts       # 内置 toolName → icon 规则表与 resolveToolIcon
    │   ├── use-stick-scroll.ts # 流式吸底滚动控制（方向感知上翻取消吸底）
    │   └── use-stream-throttle.ts # 流式输出节流（基于 @cat-kit/core throttle）
    ├── ai-attachments/         # L1 附件展示列表（UAiAttachments：图片缩略图点击预览 + 非图片扩展名/大小卡片 + 可选移除）
    ├── ai-context-picker/      # L1 上下文拾取器（UAiContextPicker：UDropdown 面板含本地文件上传与自定义 items）
    ├── ai-context-usage/       # L1 Token 用量环（UAiContextUsage：进度环触发器 + UDropdown 悬停明细面板）
    ├── ai-model-picker/        # L1 模型选择器（UAiModelPicker：UDropdown 扁平模型列表，面板支持副标题与向上弹出）
    ├── ai-reasoning-picker/    # L1 推理等级选择器（UAiReasoningPicker：>1 档推理等级时渲染的 UDropdown）
    ├── ai-question-card/       # L1 提问卡片（UAiQuestionCard：单选序号/多选 UCheckbox/推荐徽标/自定义输入/跳过/快捷键与已答摘要）
    ├── ai-reasoning/           # L1 思考折叠块（UAiReasoning：默认折叠并卸载内容 DOM，WeakMap/Map 按 cacheKey 跨卸载记忆耗时，展开限高 220px 吸底）
    ├── ai-approval-banner/     # L1 审批横幅（UAiApprovalBanner：默认过滤无 callId 审批项，允许/拒绝触发 respond）
    ├── ai-message-queue/       # L1 待发送队列条（UAiMessageQueue：立即开始插队 / 取回编辑 / 移除）
    ├── ai-job-bar/             # L1 作业条（UAiJobBar：jobs/snapshot 展示、kind 图标、进行中 u-shine 扫光、可折叠）
    ├── ai-session-nav/         # L1 会话圆点导航（UAiSessionNav：≥minItems 且 scrollable 渲染，hover 问答预览，click jump）
    ├── ai-composer/            # L2 输入组合区（UAiComposer：自适应 textarea、粘贴图片、附件列表、全插槽化 toolbar，默认不含清除/上下文/模型/用量控件）
    ├── ai-bubble/              # L2 消息气泡（UAiBubble：user 气泡含 UAiAttachments；assistant 经 MarkdownRender 渲染正文与复制/重新生成/耗时）
    ├── ai-tool-call/           # L2 工具调用卡片（UAiToolCall：UCollapseItem 复用、awaiting-confirm 内联确认、panel「查看面板」、terminal 自动展开与通用 pre 视图）
    ├── ai-step-group/          # L2 过程步骤行（UAiStepGroup：30px 走马灯步骤摘要行，展开渲染 UAiReasoning + UAiToolCall）
    ├── ai-side-panel/          # L2 右侧侧边面板（UAiSidePanel：悬浮卡片、refresh 重建实例、fullscreen 全屏切换、close 事件与兜底数据展示）
    ├── ai-message-list/        # L2 消息列表（UAiMessageList：按轮次分段、reply-tool.vue 回复流工具、流式吸底与回底按钮、吉祥物工作栏、UAiSessionNav；含内部 reply-tool.vue）
    ├── ai-chat/                # L3 对话组合壳层（UAiChat：useChat + provide AiChatDIKey + ULayout 分列 + 800px 限宽居中 + 清除会话确认 + UImagePreviewer + UAiSidePanel）
    └── ai-orb/                 # 活体球头像（内部组件，不对外导出；样式经 ai-message-list/style.ts 一并加载）
        ├── orb-renderer.ts     # 纯 canvas 2D 渲染器（扁椭圆 + 猫耳 + 眨眼/游移/thinking + react 表情 + 指针跟随/poke）
        ├── ai-orb.vue          # Vue 封装（size/status props + click emit + expose react）
        └── __test__/
```

## 约定

- **域划分**：`chat/` 负责类型、编排、transport；函数型 transport 下 `useChat` 注入内置工具（同名内置优先覆盖 `props.tools`），因此可依赖 `tools/`。session 下不注入内置工具、不执行 `execute`。`components/` 只放 UI，通过 `chat/` 复用核心逻辑；`tools/` 是内置工具注册域；`providers/` 放模型/服务商配置类型（与 UI/编排解耦）。工厂函数不对外导出，包入口对 tools 用显式 `export type { AskQuestionOption, AskQuestionItem, AskQuestionAnswer, AskQuestionArgs, AskQuestionResult }`（勿用 `export type *`，否则会泄漏 `createBuiltinTools` 的类型）。新能力开新顶层域目录，不要塞进组件目录。
- **导出边界**：主入口 `src/index.ts` 与 `src/components/index.ts` 仅导出 17 个独立组件、`UAiChat`、`readFileAsAttachment`、`chat/` 模块与相关公开类型；**不导出** `createBuiltinTools`、`ai-orb`（`UAiOrb`）、`ai-message-list/reply-tool.vue`、`_shared` 其余内部符号与 `types/ai-orb.ts`。
- **独立组件 DI 回退约定**：17 个独立组件必须在无 `AiChatDIKey` 注入时完整独立可用；组件内统一使用 `inject(AiChatDIKey, undefined)`（带默认值防止 Vue 警告）。显式 `props` / `emits` / `slots` 优先级高于 DI 回落；对于有父级回落动作的事件（如 `open-panel`、`preview-image`、`preview`），先 `emit` 事件，仅在 `instance?.vnode.props` 未显式绑定监听器时再回落调用 `di?.xxx`，避免事件与 DI 回调重复触发。`UAiMessageList` 自身向下 `provide(AiChatDIKey, ...)` 合并后的插槽与工具配置，使其独立挂载时也能支撑内部 `UAiStepGroup` / `UAiToolCall` / `ReplyToolCard` / `UAiBubble`。
- **Teleport 面板样式顶层定义**：凡使用 `UDropdown` 并将面板挂载至 popper Teleport 容器的组件（`ai-context-picker`、`ai-context-usage`、`ai-model-picker`、`ai-reasoning-picker`），其面板样式选择器 `#{fn.bem($root-name, panel)}` 必须定义在 `@include m.b(...)` 之外的样式文件顶层，否则无法命中 Teleport 后的 DOM。
- **布局宽度与滚动条边界**：`800px` 居中限宽（`@mixin bounded-column`）与吃掉主列横向 padding 的负边距滚动条定位仅属 `ai-chat` 组合壳层；所有独立 L1/L2 组件默认 `width: 100%; box-sizing: border-box;`（行内触发器或浮动导航指示器除外），禁止在独立组件内写死 `max-width: 800px` 或负边距。
- **`UAiComposer` 插槽化约定**：`UAiComposer` 工具栏通过 `#toolbar`、`#toolbar-left`、`#toolbar-right`、`#action`、`#header`、`#attachments` 全插槽化，默认形态只提供文本域、附件预览、发送/停止按钮；**默认不包含清除会话确认按钮与上下文拾取器 / 用量环 / 模型选择器 / 推理选择器**，上述控件由 `UAiChat` 或外部宿主按需装配进插槽。
- **双 transport**：`useChat` 用 `isServerTransport(transport)` 运行时分流。函数型 `ChatTransport`（`createOpenAITransport`）仍发全量历史、执行 `tool.execute`、本地队列与 `needsConfirm`。`ChatSessionTransport`（`kind: 'session'`，由 `createServerTransport(adapter)` 得到）只把动作打到远端：不发全量历史、不跑客户端工具循环、不把 `maxToolRounds` 当停止条件。`ChatSessionAdapter` 只做协议翻译（订阅事件、发动作、拉历史）；seq 乱序丢弃 + `console.warn`、`open` disposer、断开后 `fetchHistory` 补拉再 fold、动作 in-flight 去重均在 `createServerTransport` 包内完成。本包**不实现、不导出** `createBedrockTransport`；DSH / bedrock HTTP/WS 由其它仓库写 adapter。
- **session 下 tools**：`AiChatProps.tools` 为 `(ChatTool | ChatToolMeta)[]`。session 路径只按 `name` 查 icon/label/render 等元信息，忽略 `execute` / `needsConfirm` / `terminal`。无 meta 或无 `render` 时走**通用工具视图**（默认路径）：任意未知工具名都渲染卡片（名称、状态点、进行中扫光、参数/结果/错误/`view` 的等宽文本块），不得空白、不得 throw、不得出现「未找到工具」类文案。
- **工具数据展示**：通用视图直接以浅底圆角等宽 `<pre>` 展示参数 / 结果 / 错误 / `view` 原始文本，不渲染「参数 / 结果 / 错误 / 视图」标题栏、不做结构化拆分与「原始 / 整理」切换；折叠头右侧给一句话摘要（优先 command/path/query 等键），单标量参数或空参数已被头部覆盖时省去参数块；工具名未知时标题仍用原名（便于对日志），不做二次改写。
- **多 Provider transport**：`createOpenAITransport({ providers })` 按 `request.model` 查找 Provider 并 `fetch(endpoint)`；`endpoint` 可为完整 URL 或相对路径；模型 id 须跨 Provider 全局唯一；返回值挂载只读 `.models` / `.defaultModel` 供 UI 使用。旧的单字段 `{ endpoint, apiKey, model }` 已移除。
- **协议模式（responses 优先）**：`ChatProvider.mode` 显式指定 `'responses'`（OpenAI Responses API，endpoint 原样使用）或 `'chat'`（chat/completions）；缺省 auto——endpoint 以 `/responses` / `/chat/completions` 结尾按后缀识别，裸 base URL（如 `https://api.openai.com/v1`）**优先**请求 `<base>/responses`，返回 404 / 405 时依次回退 `<base>/chat/completions` 与 endpoint 原地址（chat 格式；探测链命中 2xx 后按 Provider 记忆直连，用 WeakMap 存于 transport 闭包）。responses 模式：systemPrompt 写 `instructions`、消息转 `input` 项（附件 `input_text`/`input_image`、工具调用 `function_call`/`function_call_output`）、工具为扁平结构、缺省推理等级写 `body.reasoning.effort`；`response.failed` / `error` 事件与流异常统一经 `onError` 上报。
- **模型/推理选择**：输入栏通过 `UAiModelPicker` 与 `UAiReasoningPicker`（基于 `UDropdown`，默认向上弹出）承接选择；`UAiReasoningPicker` 在 `levels.length > 1` 时渲染。`ChatModel.description` 为面板副标题。选中值经 `ChatTransportRequest.model` / `reasoningLevel` 逐轮下发；切换模型时 `useChat` 自动校正推理等级。
- 组件遵循 `packages/desktop/AGENTS.md` 的模式（BEM + token 样式、types 目录、style.ts 副作用入口）。
- 组件目录一级 `*.vue` 的 script 首部写 `import './style'`，`style.ts` 仅导入本组件真实用到的桌面组件样式、动画样式、直接子组件样式与 `./style.scss`（样式经 sideEffects 随显式导入的组件按需加载；`@veltra/vite` resolver 已废弃，仓库根 `bun run style:check` 校验约定）。
- 跨包导入 desktop 组件用包名：`import { UButton } from '@veltra/desktop'`；样式副作用用子路径 `'@veltra/desktop/components/<dir>/style'`。
- transport 不引入 ai-sdk 等第三方依赖；OpenAI 兼容协议实现（请求体构造 + SSE 解析 + 错误处理）复用 `@veltra/utils` 的通用模块，工厂放 `chat/transports/`。服务端会话走 `chat/session.ts` 的 `createServerTransport`，不要在本包加 `createBedrockTransport`。
- 工具串行执行（保持结果消息与调用顺序一致）；循环/泵取一律用递归或 Promise 链，禁止 await-in-loop（lint 硬性约束，不允许 disable 注释）。
- **工具循环收敛**：`maxToolRounds`（props，默认 10）限制单次发送的最大生成轮次，超限即 finish 停止；`ChatTool.terminal` 工具执行成功后对话终结（结果仍入消息历史，失败/拒绝照常回灌），配合 `render` 实现"工具 UI 即答复"。两类结束都会发出 `finish`。
- **侧边面板工具**：`ChatTool.renderTo: 'panel'` 把 render 组件渲染到对话区右侧的 `UAiSidePanel`，契约同卡片 render（`ChatToolRenderProps`，随 toolCall 状态实时更新）；在 `UAiChat` 中新的面板调用自动打开并聚焦，工具卡片 body 仅留「查看面板」入口（经 `open-panel` 事件或 DI `openPanel` 切换聚焦）；布局基于 `ULayout`（`cols = 1fr + 面板宽度`，`colMinSizes` 约束会话区 ≥360px、面板 ≥320px，`useResizeObserver` 跟踪拖拽后的实际宽度）；`ChatTool.panelWidth` 可指定该工具面板的默认宽度（聚焦其调用时应用；缺省平分容器宽度，各占一半）；`ChatTool.panelTitle`（字符串或按 toolCall 动态生成的函数）给出业务化面板标题（「业务对象 + 动作」），缺省取 label ?? name。`UAiSidePanel` 全屏态通过 `is-fullscreen` 绝对定位铺满带 `position: relative` 的父容器，切换 `toolCall.id` 时自动退出全屏。
- **待发送队列**：会话进行中 `send` 的消息进入 `queue`（不再丢弃），自然完成（finish）后按 FIFO 自动接续；`startQueued(id)` 中断当前会话并插队执行（其余保持顺序）；`enqueue(content, attachments?, beforeId?)` 支持锚点插入（编辑回插保持前后项顺序）；手动 `abort()` / 出错时队列保留不自动接续；`clear()` 一并清空队列、中止进行中的请求，并重置 token 统计。编辑流由宿主或 `ai-chat.vue` 以后继 id 锚点配合 `UAiComposer.setContent` 实现。
- **Token 用量**：chat 模式请求 `stream_options.include_usage` 从 SSE 末包 `usage` 解析；responses 模式从 `response.completed` / `response.incomplete` 事件的 `usage` 解析（`input_tokens` / `output_tokens` 风格与缓存字段同构）。两者都解析 `prompt/completion/total` 以及缓存命中/未命中（`prompt_tokens_details.cached_tokens`、`prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`、`cache_read_input_tokens` 等）；未返回 usage 时不展示、不补 0。`useChat` 累计到 `tokenUsage`（会话）与 `lastTurnUsage`（当前用户轮，含工具多轮；供编程读取），并另存 `lastRequestUsage`（最近一次单次请求、未跨轮累计）。`UAiContextUsage` 以用量环承载展示：模型声明 `contextWindow` 时按 `lastRequestUsage.totalTokens / contextWindow` 填充占比（未声明则空环），悬停经 UDropdown 弹出明细面板——总 / 输入 / 输出，`detail`（默认 false）为 true 时再列有数据的「缓存命中」「缓存未命中」。数字 ≥1000 用 K、≥100 万用 M（最多 1 位小数，整数不写 `.0`）。
- **扫光**：文字扫光使用 `@veltra/styles/animations` 提供的全局可复用类 `u-shine`（纯 CSS，background-clip: text，含 prefers-reduced-motion 降级），由 `ai-job-bar`、`ai-message-list`、`ai-reasoning`、`ai-step-group`、`ai-tool-call` 的 `style.ts` 按需加载。

## 依赖

- **dependencies**：`markstream-vue`（流式 markdown 渲染，可选 peer 如 mermaid/katex 不内置）
- **peer**：`@cat-kit/core`（流式节流 `throttle`）、`@veltra/desktop`、`@veltra/icons`、`@veltra/styles`、`@veltra/utils`、`@veltra/compositions`、`vue`
- **被依赖**：`playground`

## 验证

```bash
bun run lint
bun run style:check
vp test run chat            # useChat 状态机与 UAiChat 组件挂载测试
vp pack -F @veltra/ai
bun run build               # 依赖 desktop，需拓扑构建
```
