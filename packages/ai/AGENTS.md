# AGENTS.md — @veltra/ai

AI 能力包。当前核心是对话域：工具定义 + 自动编排的 `UAiChat` 组件、与 UI 解耦的 `useChat()` 状态机、可插拔 transport。按域组织代码，便于后续扩展模型提供商配置（`providers/`）、内置工具注册（`tools/`）等能力。

## 结构

```
src/
├── index.ts                    # export * from './chat' + './components'；type * from './providers'；AskQuestion* 类型显式导出（含 AskQuestionOption）；type * from './types'
├── style.ts                    # 全量样式入口
├── providers/                  # 模型提供商域（ChatProvider / ChatModel / ChatModelOption）
├── chat/                       # 对话核心域（UI 无关，不得 import 组件）
│   ├── types.ts                # ChatMessage / ChatQueuedMessage / ChatTokenUsage / ChatTool / ChatToolMeta / ChatJob / ChatTransport 等核心类型
│   ├── session.ts              # ChatSessionEvent / ChatSessionTransport / ChatSessionAdapter；isServerTransport；createServerTransport（包内 seq 校验 / 断线补拉 / in-flight 去重）
│   ├── fold.ts                 # 历史回放与实时 onEvent 共用的纯函数 fold
│   ├── use-chat.ts             # useChat 状态机：按 isServerTransport 分流；函数 transport 走工具循环，session 走 fold + session API
│   ├── transports/
│   │   └── openai.ts           # createOpenAITransport（多 Provider，按 model 路由；Responses API 优先、chat/completions 回退，请求体构造 / SSE 解析 / 错误处理复用 @veltra/utils 通用层）
│   └── __test__/
├── tools/                      # 内置工具注册域（UAiChat 自动注入；工厂不对外导出；可依赖 components/）
│   ├── index.ts                # createBuiltinTools 注册表（新增内置工具在此注册）
│   ├── ask-question/           # 提问工具实现（deferred 挂起等待用户作答；renderTo: 'reply' + hideInSteps: true 仅在回复流外层渲染——当前思考段内、段末正文之前，不进步骤行列表，支持单选序号/多选/推荐徽标/分类标签/跳过/Enter 确认）
├── types/ai-chat.ts            # 组件类型：AiChatProps / AiChatEmits / AiChatExposed
├── types/ai-orb.ts             # 活体球内部类型（不对外导出）：AiOrbProps / AiOrbEmits / AiOrbStatus / AiOrbReaction / AiOrbExposed
└── components/
    ├── ai-chat/
    │   ├── ai-chat.vue         # UAiChat 主组件（useChat + provide DI；toolMap 含内置工具元信息；renderTo: 'panel' 调用的面板状态；ULayout 分列与面板宽度；UImagePreviewer 图片全屏预览）
    │   ├── attachment.ts       # 附件分类、扩展名徽标文案（大写规范化，无扩展名兜底 FILE）、大小格式化与本地读取（图片转 dataUrl，非图片本地提取 UTF-8 文本，dataUrl 置空）
    │   ├── message-list.vue    # UScroll 消息列表（滚动条不常驻、贴主列右缘：list-wrap 负边距吃掉主列横向 padding 顶到容器边缘，800px 限宽下沉到 UScroll 内容层 __list-content）：按轮次分组渲染（user 消息为界，每轮包一层 data-turn 容器供导航定位；assistant 过程按文字回答切段——renderTo: 'reply' 的工具面板挂入正文闭段前的当前段（同消息 content + 提问工具不拆段，渲染顺序「步骤行 → 提问面板 → 段末正文」，多轮追问待答面板紧跟本轮思考），出现 content 即闭合该段、其后的普通工具步骤落进新段，每段一个 step-line 步骤行 + 段末回答 MessageItem，末段 live = isLast &&（running || 末消息未终态）防断连翻转；hideInSteps 工具（含 askQuestion）不进步骤行，仅当 renderTo: 'reply' 时渲染在回复流；末条消息无正文且 error/aborted 时以 tailStatusMsg 渲染状态行，duration 与 is-last 传给最后一条 answerMsg 或 tailStatusMsg）；会话导航（≥3 轮且列表溢出可滚时出现，通过 UScroll resize 与滚动同步可滚状态；贴内容列左缘的圆点指示器，当前视口轮次高亮、已读项变淡，hover 单点展示该轮提问与回答前缀、点击滚到该轮并取消吸底）；流式吸底（滚轮上翻立即取消吸附 + 方向感知兜底 + 列表下方纯箭头回底悬浮按钮一键回底；吸底滚动前二次确认吸附状态，避免流式期间把上翻用户拉回底部）；吉祥物栏（48px 活体球）常驻在 UScroll 外、输入框上方待在原位不进消息列表：空闲展示逐条轮换的快捷提问（点文案发送，点球立即换一条并重置计时；球位置钉死，气泡向右延展）；生成中原位切换工作态（thinking / speaking 动画 + 「工作中…」与逐秒跳动计时），结束 / 失败原位停留约 2.5s（成功播 happy、出错播 frustrated；工具调用失败亦播 frustrated，显示末轮总用时）后切回欢迎语；turnDurations 按轮次 key 记录并透传给承载消息的 MessageItem（仅 live 轮次，历史回放无计时数据）
    │   ├── session-navigator.vue # 会话导航指示器（≥3 轮且 scrollable 才渲染；纯圆点指示器，无宽度过渡；当前轮次高亮、已读变淡；hover 单点浮现该轮「问 / 答」前缀卡片，点击 emit jump；项数据由 message-list 从 turns 计算）
    │   ├── navigator-item.ts   # 导航项类型（key / index / question / answer）
    │   ├── message-item.vue    # 单条消息（user 右对齐气泡：图片缩略图支持点击预览 + 非图片文件卡片展示；assistant 只渲染 MarkdownRender 正文 + error/aborted 状态行 + 末条操作区「用时 Xs / 复制 / 重新生成」——思考块与工具卡片由步骤行承载）
    │   ├── thinking-icon.vue   # 思考图标（内联 SVG 四角星 + 副星；active 时 CSS 动画，prefers-reduced-motion 关闭）
    │   ├── format-duration.ts  # 工作时长格式化（整秒：<60s Xs、≥60s Xm Ys；message-list 计时、message-item 总用时与 reasoning-block 思考耗时共用）
    │   ├── step-line.vue       # 步骤行（一段的思考/工具过程压缩为固定高度行：live 行内实时展示当前步骤——「思考中…」+ 最新一行思考 / 工具名 + 参数摘要，步骤切换走马灯从下往上换步、prefers-reduced-motion 退化为淡入；落定定格「执行了 N 个步骤」（落定态无 hover 高亮、展开箭头紧跟文案），段末 error/aborted 显「出错了 / 已停止」；点击行展开全部步骤（ReasoningBlock + 工具卡片），默认收起；awaiting-confirm 与内联 render 进行中自动展开列表，用户手动切换过后不再自动）
    │   ├── reasoning-block.vue # 思考折叠块（默认折叠含流式进行中，折叠时 v-if 卸载内容 DOM；标题「思考中… / 思考了 Ns / 思考过程」亚秒不报耗时，计时经 WeakMap 按消息记忆以跨折叠重挂载还原；思考中头部右侧滚动展示最新一行思考；展开态 UScroll 限高 220px + 区内上翻取消内部吸底 + ArrowRight 折叠箭头）
    │   ├── turn-step.ts        # TurnStep 类型（key/kind/message/toolCall：一次思考或一次工具调用，message-list 切段产出、step-line 消费）
    │   ├── tool-call-brief.ts  # 工具头部摘要共用 composable（icon / label / summarizeArguments 摘要 / 状态色；toolNeedsInteraction 判定待确认 / 内联 render 的自动展开条件；tool-call 卡片头部与 step-line 行内视图共用）
    │   ├── tool-call.vue       # 工具卡片（复用 UCollapseItem，#header 只自定义标题区，展开图标走组件内置旋转；头部摘要视图模型取自 tool-call-brief 与步骤行共用；默认折叠含进行中，仅 awaiting-confirm 待确认且 body 有内容 / 有内联 render·插槽的进行中调用（提问表单等）/ terminal「UI 即答复」工具自动展开；autoCollapse 缺省 true、终结工具缺省 false；needsConfirm 确认按钮在头部；消费工具 icon/label/render/renderTo/autoCollapse/terminal；终态折叠后 destroyOnCollapse 卸载内容 DOM——进行中/待确认保留内容状态、面板工具保留「查看面板」入口；通用视图以 `<pre class="u-ai-chat__tool-data">` 直接展示原始参数/结果/错误/视图文本（无「参数/结果/错误/视图」标题栏，isSummarizedInHeader 判定参数区是否已被头部摘要覆盖而省去））
    │   ├── tool-format.ts      # 工具参数摘要与文本裁剪工具（纯函数，不得 throw）：summarizeArguments 按 command/path/query 等优先键取折叠头摘要（SUMMARY_LIMIT 截断）；isSummarizedInHeader 判定参数是否已被头部摘要逐字覆盖（单标量/未截断短文本/空参数）；clipText 单行化截断与 lastNonEmptyLine 尾部非空行扫描
    │   ├── side-panel.vue      # 右侧侧边面板（renderTo: 'panel' 工具的渲染区：悬浮卡片——面板本体透明留白、内层圆角卡片仅靠背景对比+阴影区分，无分割线；头部 icon 底托/标题/刷新、全屏与关闭同款图标按钮，点击刷新通过 key 递增重建面板内 render 组件实例，标题取 panelTitle ?? label ?? name + UScroll 渲染体；全屏态挂 is-fullscreen 绝对定位铺满整个组件区域（含输入区、盖住拖拽手柄），进出带缩放淡入过渡，切换聚焦的调用时自动退出全屏且列宽观测跳过全屏态；无 render 时兜底以 `<pre class="u-ai-chat__tool-data">` 展示原始结果/错误）
    │   ├── queue-list.vue      # 待发送队列（生成中提交的消息排队；立即开始插队 / 取回编辑 / 移除）
    │   ├── job-bar.vue         # 作业条（jobs/snapshot；kind 图标 + label + 状态点，进行中扫光，可折叠）
    │   ├── approval-banner.vue # 无 callId 的审批横幅（允许/拒绝 → session.respond）
    │   ├── ask-question.vue    # 提问表单（主契约 questions + onSubmit；单选 1/2/3/4 序号徽标且选中预设项自动跳下一题、多选复用 UCheckbox、无边框浅底选项、结构化选项与推荐徽标、内联自定义输入支持 Enter 确认与 IME 保护、跳过与 1-9/Enter/方向键快捷键；提交后常驻展示问答摘要；客户端经薄包装走 resolveAskQuestion 并设 renderTo: 'reply'，session 挂 question/requested）
    │   ├── chat-input.vue      # 输入区（多行自适应、剪贴板粘贴图片、工具栏左侧 + 号选项面板含上传任意附件、图片点击预览与文件卡片展示、清除会话确认、token 用量环 + 明细面板、模型/推理选择、生成中空输入显示停止 / 有内容则发送入队；暴露 setContent/getContent）
    │   ├── model-picker.vue    # 模型选择器（UDropdown 面板：模型列表，面板向上弹出）
    │   ├── reasoning-picker.vue # 推理等级选择器（模型有 ≥2 档推理等级时出现的独立 UDropdown，向上弹出）
    │   ├── use-stream-throttle.ts # 流式输出节流（基于 @cat-kit/core throttle：首块立即透出 + 窗口合并 + 结束立即同步）
    │   ├── di.ts               # AiChatDIKey（cls + slots + tools + openPanel + previewImage 注入，支撑 tool-<name> 动态插槽、工具元信息与图片全屏预览）
    │   └── __test__/
    └── ai-orb/                 # 活体球头像（ai-chat 内部组件，不对外导出；无 index.ts/style.ts，样式经 ai-chat/style.ts 一并加载）
        ├── orb-renderer.ts     # 纯 canvas 2D 渲染器：扁平纯色扁椭圆（蔚蓝 + 白色大眼睛，闭眼为白色线条）+ 头顶猫耳（圆角尖三角，身体色 + 白色内耳，先于球体绘制使根部被遮住，随球体形变；平时错相轻摆，表情时竖起 happy/shock 或耷拉 frustrated）、原地呼吸无弹跳无打光；眼部状态机（眨眼 / 双眨、视线游移转头、thinking 眯眼扫视 + 右上角同色「?」轻晃）+ 瞬时表情 react（happy 弯眼点头 / shock 睁大眼 / frustrated 闭眼摇头）+ 指针交互（setPointer 视线跟随、poke Q 弹回弹）；单位球空间绘制、可见性启停 rAF、reduced-motion 静态帧
        ├── ai-orb.vue          # Vue 封装（size/status props + click emit；expose react(reaction) 播放瞬时表情；指针事件桥接渲染器）
        └── __test__/
```

## 约定

- **域划分**：`chat/` 负责类型、编排、transport；函数型 transport 下 `useChat` 注入内置工具（同名内置优先覆盖 `props.tools`），因此可依赖 `tools/`。session 下不注入内置工具、不执行 `execute`。`components/` 只放 UI，通过 `chat/` 复用核心逻辑；`tools/` 是内置工具注册域；`providers/` 放模型/服务商配置类型（与 UI/编排解耦）。工厂函数不对外导出，包入口对 tools 用显式 `export type { AskQuestionOption, AskQuestionItem, AskQuestionAnswer, AskQuestionArgs, AskQuestionResult }`（勿用 `export type *`，否则会泄漏 `createBuiltinTools` 的类型）。新能力开新顶层域目录，不要塞进组件目录。
- **双 transport**：`useChat` 用 `isServerTransport(transport)` 运行时分流。函数型 `ChatTransport`（`createOpenAITransport`）仍发全量历史、执行 `tool.execute`、本地队列与 `needsConfirm`。`ChatSessionTransport`（`kind: 'session'`，由 `createServerTransport(adapter)` 得到）只把动作打到远端：不发全量历史、不跑客户端工具循环、不把 `maxToolRounds` 当停止条件。`ChatSessionAdapter` 只做协议翻译（订阅事件、发动作、拉历史）；seq 乱序丢弃 + `console.warn`、`open` disposer、断开后 `fetchHistory` 补拉再 fold、动作 in-flight 去重均在 `createServerTransport` 包内完成。本包**不实现、不导出** `createBedrockTransport`；DSH / bedrock HTTP/WS 由其它仓库写 adapter。
- **session 下 tools**：`AiChatProps.tools` 为 `(ChatTool | ChatToolMeta)[]`。session 路径只按 `name` 查 icon/label/render 等元信息，忽略 `execute` / `needsConfirm` / `terminal`。无 meta 或无 `render` 时走**通用工具视图**（默认路径）：任意未知工具名都渲染卡片（名称、状态点、进行中扫光、参数/结果/错误/`view` 的等宽文本块），不得空白、不得 throw、不得出现「未找到工具」类文案。
- **工具数据展示**：通用视图直接以浅底圆角等宽 `<pre>` 展示参数 / 结果 / 错误 / `view` 原始文本，不渲染「参数 / 结果 / 错误 / 视图」标题栏、不做结构化拆分与「原始 / 整理」切换；折叠头右侧给一句话摘要（优先 command/path/query 等键），单标量参数或空参数已被头部覆盖时省去参数块；工具名未知时标题仍用原名（便于对日志），不做二次改写。
- **多 Provider transport**：`createOpenAITransport({ providers })` 按 `request.model` 查找 Provider 并 `fetch(endpoint)`；`endpoint` 可为完整 URL 或相对路径；模型 id 须跨 Provider 全局唯一；返回值挂载只读 `.models` / `.defaultModel` 供 UI 使用。旧的单字段 `{ endpoint, apiKey, model }` 已移除。
- **协议模式（responses 优先）**：`ChatProvider.mode` 显式指定 `'responses'`（OpenAI Responses API，endpoint 原样使用）或 `'chat'`（chat/completions）；缺省 auto——endpoint 以 `/responses` / `/chat/completions` 结尾按后缀识别，裸 base URL（如 `https://api.openai.com/v1`）**优先**请求 `<base>/responses`，返回 404 / 405 时依次回退 `<base>/chat/completions` 与 endpoint 原地址（chat 格式；探测链命中 2xx 后按 Provider 记忆直连，用 WeakMap 存于 transport 闭包）。responses 模式：systemPrompt 写 `instructions`、消息转 `input` 项（附件 `input_text`/`input_image`、工具调用 `function_call`/`function_call_output`）、工具为扁平结构、缺省推理等级写 `body.reasoning.effort`；`response.failed` / `error` 事件与流异常统一经 `onError` 上报。
- **模型/推理选择**：`AiChatProps.models` 有值时输入栏展示自定义模型选择器（`model-picker.vue`，基于 `UDropdown`，面板向上弹出）；当前模型有 ≥2 档推理等级时，模型选择器旁另出现独立的推理等级选择器（`reasoning-picker.vue`，同为向上弹出的 `UDropdown`）。`ChatModel.description` 为面板副标题。选中值经 `ChatTransportRequest.model` / `reasoningLevel` 逐轮下发；切换模型时自动校正推理等级。
- 组件遵循 `packages/desktop/AGENTS.md` 的模式（BEM + token 样式、types 目录、style.ts 副作用入口）。
- **新增/删除 `components/<name>/`（含 `index.ts` + `style.ts`）后，在仓库根运行 `bun run resolver:gen`** 刷新 `@veltra/vite` 组件表，否则宿主无法按需解析 `<u-ai-chat>` 这类标签。
- 跨包导入 desktop 组件用包名：`import { UButton } from '@veltra/desktop'`；样式副作用用子路径 `'@veltra/desktop/components/<dir>/style'`。
- transport 不引入 ai-sdk 等第三方依赖；OpenAI 兼容协议实现（请求体构造 + SSE 解析 + 错误处理）复用 `@veltra/utils` 的通用模块，工厂放 `chat/transports/`。服务端会话走 `chat/session.ts` 的 `createServerTransport`，不要在本包加 `createBedrockTransport`。
- 工具串行执行（保持结果消息与调用顺序一致）；循环/泵取一律用递归或 Promise 链，禁止 await-in-loop（lint 硬性约束，不允许 disable 注释）。
- **工具循环收敛**：`maxToolRounds`（props，默认 10）限制单次发送的最大生成轮次，超限即 finish 停止；`ChatTool.terminal` 工具执行成功后对话终结（结果仍入消息历史，失败/拒绝照常回灌），配合 `render` 实现"工具 UI 即答复"。两类结束都会发出 `finish`。
- **侧边面板工具**：`ChatTool.renderTo: 'panel'` 把 render 组件渲染到对话区右侧的侧边面板（side-panel.vue），契约同卡片 render（`ChatToolRenderProps`，随 toolCall 状态实时更新）；新的面板调用自动打开并聚焦，工具卡片 body 仅留「查看面板」入口（经 DI `openPanel` 切换聚焦，可切回历史调用）；布局基于 `ULayout`（`cols = 1fr + 面板宽度`，`colMinSizes` 约束会话区 ≥360px、面板 ≥320px，`useResizeObserver` 跟踪拖拽后的实际宽度）；`ChatTool.panelWidth` 可指定该工具面板的默认宽度（聚焦其调用时应用；缺省平分容器宽度，各占一半）；`ChatTool.panelTitle`（字符串或按 toolCall 动态生成的函数）给出业务化面板标题（「业务对象 + 动作」），缺省取 label ?? name。组件根背景为 bg-color-bottom，消息/队列/输入区限宽 800px 居中（面板开合时排版不形变），卡片类元素（输入区、面板卡、欢迎气泡）用 bg-color-top + 阴影而非边框区分层级。空会话（无可见消息）时主列挂 `is-empty`：列表区与末尾弹性占位均分剩余空间使输入区垂直居中；空闲欢迎区钉在 UScroll 外、贴于输入框上方（有消息后布局回落到底部，欢迎区仍在输入框上方）；工作开始时活体球立即跳到列表末尾，结束后跳回。
- **待发送队列**：会话进行中 `send` 的消息进入 `queue`（不再丢弃），自然完成（finish）后按 FIFO 自动接续；`startQueued(id)` 中断当前会话并插队执行（其余保持顺序）；`enqueue(content, attachments?, beforeId?)` 支持锚点插入（编辑回插保持前后项顺序）；手动 `abort()` / 出错时队列保留不自动接续；`clear()` 一并清空队列、中止进行中的请求，并重置 token 统计。编辑流由 ai-chat.vue 以后继 id 锚点实现（取回输入框 → 重新提交插回原位置）。输入区清除按钮走 `UPopConfirm` 二次确认；生成中清除会跳过工作球停留、立刻回到欢迎区。
- **Token 用量**：chat 模式请求 `stream_options.include_usage` 从 SSE 末包 `usage` 解析；responses 模式从 `response.completed` / `response.incomplete` 事件的 `usage` 解析（`input_tokens` / `output_tokens` 风格与缓存字段同构）。两者都解析 `prompt/completion/total` 以及缓存命中/未命中（`prompt_tokens_details.cached_tokens`、`prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`、`cache_read_input_tokens` 等）；未返回 usage 时不展示、不补 0。`useChat` 累计到 `tokenUsage`（会话）与 `lastTurnUsage`（当前用户轮，含工具多轮；供编程读取），并另存 `lastRequestUsage`（最近一次单次请求、未跨轮累计）。输入栏以用量环承载展示：模型声明 `ChatModel.contextWindow` 时按 `lastRequestUsage.totalTokens / 窗口上限` 填充占比（未声明则空环），悬停经 UDropdown 弹出明细面板——总 / 输入 / 输出，`tokenUsageDetail`（默认 false）为 true 时再列有数据的「缓存命中」「缓存未命中」。数字 ≥1000 用 K、≥100 万用 M（最多 1 位小数，整数不写 `.0`）。
- **扫光**：文字扫光使用 `@veltra/styles/animations` 提供的全局可复用类 `u-shine`（纯 CSS，background-clip: text，含 prefers-reduced-motion 降级），随 ai-chat 的 `style.ts` 按需加载；思考中与进行中的工具名自动应用。

## 依赖

- **dependencies**：`markstream-vue`（流式 markdown 渲染，可选 peer 如 mermaid/katex 不内置）
- **peer**：`@cat-kit/core`（流式节流 `throttle`）、`@veltra/desktop`、`@veltra/icons`、`@veltra/styles`、`@veltra/utils`、`@veltra/compositions`、`vue`
- **被依赖**：`playground`

## 验证

```bash
bun run lint
vp test run chat            # useChat 状态机与 UAiChat 组件挂载测试
vp pack -F @veltra/ai
bun run build               # 依赖 desktop，需拓扑构建
```
