# AGENTS.md — @veltra/ai

AI 能力包。当前核心是对话域：工具定义 + 自动编排的 `UAiChat` 组件、与 UI 解耦的 `useChat()` 状态机、可插拔 transport。按域组织代码，便于后续扩展模型提供商配置（`providers/`）、内置工具注册（`tools/`）等能力。

## 结构

```
src/
├── index.ts                    # export * from './chat' + './components'；type * from './providers'；AskQuestion* 类型显式导出；type * from './types'
├── style.ts                    # 全量样式入口
├── providers/                  # 模型提供商域（ChatProvider / ChatModel / ChatModelOption）
├── chat/                       # 对话核心域（UI 无关，不得 import 组件）
│   ├── types.ts                # ChatMessage / ChatQueuedMessage / ChatTokenUsage / ChatTool / ChatToolMeta / ChatJob / ChatTransport 等核心类型
│   ├── session.ts              # ChatSessionEvent / ChatSessionTransport / ChatSessionAdapter；isServerTransport；createServerTransport（包内 seq 校验 / 断线补拉 / in-flight 去重）
│   ├── fold.ts                 # 历史回放与实时 onEvent 共用的纯函数 fold
│   ├── use-chat.ts             # useChat 状态机：按 isServerTransport 分流；函数 transport 走工具循环，session 走 fold + session API
│   ├── transports/
│   │   └── openai.ts           # createOpenAITransport（多 Provider，按 model 路由；请求体构造 / SSE 解析 / 错误处理复用 @veltra/utils 通用层）
│   └── __test__/
├── tools/                      # 内置工具注册域（UAiChat 自动注入；工厂不对外导出；可依赖 components/）
│   ├── index.ts                # createBuiltinTools 注册表（新增内置工具在此注册）
│   └── ask-question/           # 提问工具实现（deferred 挂起等待用户作答）
├── types/ai-chat.ts            # 组件类型：AiChatProps / AiChatEmits / AiChatExposed
├── types/ai-orb.ts             # 活体球内部类型（不对外导出）：AiOrbProps / AiOrbEmits / AiOrbStatus / AiOrbReaction / AiOrbExposed
└── components/
    ├── ai-chat/
    │   ├── ai-chat.vue         # UAiChat 主组件（useChat + provide DI；toolMap 含内置工具元信息；renderTo: 'panel' 调用的面板状态；ULayout 分列与面板宽度）
    │   ├── message-list.vue    # UScroll 消息列表（滚动条不常驻、贴主列右缘：list-wrap 负边距吃掉主列横向 padding 顶到容器边缘，800px 限宽下沉到 UScroll 内容层 __list-content）：按轮次分组渲染（user 消息为界，每轮包一层 data-turn 容器供导航定位；assistant 过程按文字回答切段——出现 content 即闭合该段、其后步骤落进新段，每段一个 step-line 步骤行 + 段末回答 MessageItem，末段 live = isLast &&（running || 末消息未终态）防断连翻转；末条消息无正文且 error/aborted 时以 tailStatusMsg 渲染状态行，duration 与 is-last 传给最后一条 answerMsg 或 tailStatusMsg）；会话导航（≥3 轮且列表真的溢出可滚才出现，贴内容列左缘的横线刻度，激活轮次刻度变长、hover 刻度变长（带宽度过渡动画），当前视口轮次高亮、已读项变淡，hover 展开目录卡片、点击滚到该轮并取消吸底）；流式吸底（滚轮上翻立即取消吸附 + 方向感知兜底 + 列表下方纯箭头回底悬浮按钮一键回底；吸底滚动前二次确认吸附状态，避免流式期间把上翻用户拉回底部）；空闲欢迎区（较小活体球 + 逐条轮换的快捷提问）钉在 UScroll 外、输入框上方，高度 48px；工作中活体球立即缩小离开输入框并在列表末尾放大出现（无延时），结束 / 失败停留约 2.5s（成功播 happy、出错播 frustrated；工具调用失败亦播 frustrated）后再对向跳回输入框上方；点文案发送，点球立即换一条并重置轮换计时；固定锚点布局——球钉死不动，气泡只向右延展；工作计时——生成中「工作中…」旁逐秒跳动计时，收尾停留显示末轮总用时，turnDurations 按轮次 key 记录并透传给承载消息的 MessageItem（仅 live 轮次，历史回放无计时数据）
    │   ├── session-navigator.vue # 会话导航指示器（≥3 轮且 scrollable 才渲染；横线刻度默认短、激活与 hover 项变长（宽度过渡，reduced-motion 退化），当前轮次高亮、已读变淡；hover 展开「会话导航 · N 轮」目录卡片，点击 emit jump；项数据由 message-list 从 turns 计算）
    │   ├── navigator-item.ts   # 导航项类型（key / index / title）
    │   ├── message-item.vue    # 单条消息（user 右对齐气泡；assistant 只渲染 MarkdownRender 正文 + error/aborted 状态行 + 末条操作区「用时 Xs / 复制 / 重新生成」——思考块与工具卡片由步骤行承载）
    │   ├── thinking-icon.vue   # 思考图标（内联 SVG 四角星 + 副星；active 时 CSS 动画，prefers-reduced-motion 关闭）
    │   ├── format-duration.ts  # 工作时长格式化（整秒：<60s Xs、≥60s Xm Ys；message-list 计时、message-item 总用时与 reasoning-block 思考耗时共用）
    │   ├── step-line.vue       # 步骤行（一段的思考/工具过程压缩为固定高度行：live 行内实时展示当前步骤——「思考中…」+ 最新一行思考 / 工具名 + 参数摘要，步骤切换走马灯从下往上换步、prefers-reduced-motion 退化为淡入；落定定格「已完成 N 个步骤」，段末 error/aborted 显「出错了 / 已停止」；点击行展开全部步骤（ReasoningBlock + 工具卡片），默认收起；awaiting-confirm 与内联 render 进行中自动展开列表，用户手动切换过后不再自动）
    │   ├── reasoning-block.vue # 思考折叠块（默认折叠含流式进行中，折叠时 v-if 卸载内容 DOM；标题「思考中… / 思考了 Ns / 思考过程」亚秒不报耗时，计时经 WeakMap 按消息记忆以跨折叠重挂载还原；思考中头部右侧滚动展示最新一行思考；展开态 UScroll 限高 220px + 区内上翻取消内部吸底 + ArrowRight 折叠箭头）
    │   ├── turn-step.ts        # TurnStep 类型（key/kind/message/toolCall：一次思考或一次工具调用，message-list 切段产出、step-line 消费）
    │   ├── tool-call-brief.ts  # 工具头部摘要共用 composable（icon / label / summarizeArguments 摘要 / 状态色；toolNeedsInteraction 判定待确认 / 内联 render 的自动展开条件；tool-call 卡片头部与 step-line 行内视图共用）
    │   ├── tool-call.vue       # 工具卡片（复用 UCollapseItem，#header 只自定义标题区，展开图标走组件内置旋转；头部摘要视图模型取自 tool-call-brief 与步骤行共用；默认折叠含进行中，仅 awaiting-confirm 待确认且 body 有内容 / 有内联 render·插槽的进行中调用（提问表单等）/ terminal「UI 即答复」工具自动展开；autoCollapse 缺省 true、终结工具缺省 false；needsConfirm 确认按钮在头部；消费工具 icon/label/render/renderTo/autoCollapse/terminal；终态折叠后 destroyOnCollapse 卸载内容 DOM——进行中/待确认保留内容状态、面板工具保留「查看面板」入口；通用视图走 tool-data 渲染参数/结果/视图，结果先 dropEchoedFields 去回显、unwrapSingleValue 直出单值，isSummarizedInHeader 判定参数区是否已被头部摘要覆盖而省去）
    │   ├── tool-format.ts      # 工具数据人读化（纯函数，不得 throw）：toToolNode 把任意值转成 empty/scalar/text/chips/fields/list 结构——对象拆字段行（humanizeKey 拆词）、纯标量数组压 chips、对象数组带序号、内嵌 JSON 串自动展开、路径/命令/多行文本走等宽；summarizeArguments 按 command/path/query 等优先键取折叠头摘要（SUMMARY_LIMIT 截断）；isSummarizedInHeader 判定参数节点是否被头部摘要逐字覆盖（单标量/未截断短文本）；dropEchoedFields 剔除结果里同键同值回显入参的字段；unwrapSingleValue 把通用值键（result/output 等）的单标量结果直出值本身；describeShape 给列表/多行文本「N 项 / N 行」量级提示（字段行不报数）；深度护栏防循环引用爆栈
    │   ├── tool-data.vue       # 工具数据区（标题 + 量级 + 「原始」降级入口 + 结构化视图；error 转危险色；纯文本超长先截断、点「展开」看全文）
    │   ├── tool-node.vue       # 结构化节点递归渲染（fields 嵌套加引导线、chips、有序列表；文本节点按 240 字截断）
    │   ├── side-panel.vue      # 右侧侧边面板（renderTo: 'panel' 工具的渲染区：悬浮卡片——面板本体透明留白、内层圆角卡片仅靠背景对比+阴影区分，无分割线；头部 icon 底托/标题/全屏与关闭同款图标按钮，标题取 panelTitle ?? label ?? name + UScroll 渲染体；全屏态挂 is-fullscreen 绝对定位铺满整个组件区域（含输入区、盖住拖拽手柄），进出带缩放淡入过渡，切换聚焦的调用时自动退出全屏且列宽观测跳过全屏态；无 render 时兜底同样走 tool-data 人读视图）
    │   ├── queue-list.vue      # 待发送队列（生成中提交的消息排队；立即开始插队 / 取回编辑 / 移除）
    │   ├── job-bar.vue         # 作业条（jobs/snapshot；kind 图标 + label + 状态点，进行中扫光，可折叠）
    │   ├── approval-banner.vue # 无 callId 的审批横幅（允许/拒绝 → session.respond）
    │   ├── ask-question.vue    # 提问表单（主契约 questions + onSubmit；客户端经薄包装走 resolveAskQuestion，session 挂 question/requested）
    │   ├── chat-input.vue      # 输入区（多行自适应、图片附件、清除会话确认、token 用量环 + 明细面板、模型/推理选择、生成中空输入显示停止 / 有内容则发送入队；暴露 setContent/getContent）
    │   ├── model-picker.vue    # 模型选择器（UDropdown 面板：模型列表，面板向上弹出）
    │   ├── reasoning-picker.vue # 推理等级选择器（模型有 ≥2 档推理等级时出现的独立 UDropdown，向上弹出）
    │   ├── di.ts               # AiChatDIKey（cls + slots + tools 注入，支撑 tool-<name> 动态插槽与工具元信息）
    │   └── __test__/
    └── ai-orb/                 # 活体球头像（ai-chat 内部组件，不对外导出；无 index.ts/style.ts，样式经 ai-chat/style.ts 一并加载）
        ├── orb-renderer.ts     # 纯 canvas 2D 渲染器：扁平纯色扁椭圆（蔚蓝 + 白色大眼睛，闭眼为白色线条）+ 头顶猫耳（圆角尖三角，身体色 + 白色内耳，先于球体绘制使根部被遮住，随球体形变；平时错相轻摆，表情时竖起 happy/shock 或耷拉 frustrated）、原地呼吸无弹跳无打光；眼部状态机（眨眼 / 双眨、视线游移转头、thinking 眯眼扫视 + 右上角同色「?」轻晃）+ 瞬时表情 react（happy 弯眼点头 / shock 睁大眼 / frustrated 闭眼摇头）+ 指针交互（setPointer 视线跟随、poke Q 弹回弹）；单位球空间绘制、可见性启停 rAF、reduced-motion 静态帧
        ├── ai-orb.vue          # Vue 封装（size/status props + click emit；expose react(reaction) 播放瞬时表情；指针事件桥接渲染器）
        └── __test__/
```

## 约定

- **域划分**：`chat/` 负责类型、编排、transport；函数型 transport 下 `useChat` 注入内置工具（同名内置优先覆盖 `props.tools`），因此可依赖 `tools/`。session 下不注入内置工具、不执行 `execute`。`components/` 只放 UI，通过 `chat/` 复用核心逻辑；`tools/` 是内置工具注册域；`providers/` 放模型/服务商配置类型（与 UI/编排解耦）。工厂函数不对外导出，包入口对 tools 用显式 `export type { AskQuestionItem, AskQuestionAnswer, AskQuestionArgs, AskQuestionResult }`（勿用 `export type *`，否则会泄漏 `createBuiltinTools` 的类型）。新能力开新顶层域目录，不要塞进组件目录。
- **双 transport**：`useChat` 用 `isServerTransport(transport)` 运行时分流。函数型 `ChatTransport`（`createOpenAITransport`）仍发全量历史、执行 `tool.execute`、本地队列与 `needsConfirm`。`ChatSessionTransport`（`kind: 'session'`，由 `createServerTransport(adapter)` 得到）只把动作打到远端：不发全量历史、不跑客户端工具循环、不把 `maxToolRounds` 当停止条件。`ChatSessionAdapter` 只做协议翻译（订阅事件、发动作、拉历史）；seq 乱序丢弃 + `console.warn`、`open` disposer、断开后 `fetchHistory` 补拉再 fold、动作 in-flight 去重均在 `createServerTransport` 包内完成。本包**不实现、不导出** `createBedrockTransport`；DSH / bedrock HTTP/WS 由其它仓库写 adapter。
- **session 下 tools**：`AiChatProps.tools` 为 `(ChatTool | ChatToolMeta)[]`。session 路径只按 `name` 查 icon/label/render 等元信息，忽略 `execute` / `needsConfirm` / `terminal`。无 meta 或无 `render` 时走**通用工具视图**（默认路径）：任意未知工具名都渲染卡片（名称、状态点、进行中扫光、参数/结果/错误/`view` 的人读视图），不得空白、不得 throw、不得出现「未找到工具」类文案。
- **工具数据人读化**：通用视图不用整块 JSON。参数/结果/视图统一经 `tool-format.ts` 转结构节点后由 `tool-data.vue` + `tool-node.vue` 渲染——对象按「人读键名 + 值」逐行、标量数组压 chips、对象数组带序号、字符串里的 JSON 自动展开、路径/命令/多行文本走等宽；折叠头右侧给一句话摘要（优先 command/path/query 等键）。去噪：单标量参数已被头部摘要覆盖时省去参数区、结果剔除回显入参的字段、通用值键的单值结果直出（不重复罗列同一信息）。非文本结构化视图保留「原始」切换，纯文本超长走「展开」全文，排查时仍能看到模型原始输出；工具名未知时标题仍用原名（便于对日志），不做二次改写。
- **多 Provider transport**：`createOpenAITransport({ providers })` 按 `request.model` 查找 Provider 并 `fetch(endpoint)`；`endpoint` 可为完整 URL 或相对路径；模型 id 须跨 Provider 全局唯一；返回值挂载只读 `.models` / `.defaultModel` 供 UI 使用。旧的单字段 `{ endpoint, apiKey, model }` 已移除。
- **模型/推理选择**：`AiChatProps.models` 有值时输入栏展示自定义模型选择器（`model-picker.vue`，基于 `UDropdown`，面板向上弹出）；当前模型有 ≥2 档推理等级时，模型选择器旁另出现独立的推理等级选择器（`reasoning-picker.vue`，同为向上弹出的 `UDropdown`）。`ChatModel.description` 为面板副标题。选中值经 `ChatTransportRequest.model` / `reasoningLevel` 逐轮下发；切换模型时自动校正推理等级。
- 组件遵循 `packages/desktop/AGENTS.md` 的模式（BEM + token 样式、types 目录、style.ts 副作用入口）。
- **新增/删除 `components/<name>/`（含 `index.ts` + `style.ts`）后，在仓库根运行 `bun run resolver:gen`** 刷新 `@veltra/vite` 组件表，否则宿主无法按需解析 `<u-ai-chat>` 这类标签。
- 跨包导入 desktop 组件用包名：`import { UButton } from '@veltra/desktop'`；样式副作用用子路径 `'@veltra/desktop/components/<dir>/style'`。
- transport 不引入 ai-sdk 等第三方依赖；OpenAI 兼容协议实现（请求体构造 + SSE 解析 + 错误处理）复用 `@veltra/utils` 的通用模块，工厂放 `chat/transports/`。服务端会话走 `chat/session.ts` 的 `createServerTransport`，不要在本包加 `createBedrockTransport`。
- 工具串行执行（保持结果消息与调用顺序一致）；循环/泵取一律用递归或 Promise 链，禁止 await-in-loop（lint 硬性约束，不允许 disable 注释）。
- **工具循环收敛**：`maxToolRounds`（props，默认 10）限制单次发送的最大生成轮次，超限即 finish 停止；`ChatTool.terminal` 工具执行成功后对话终结（结果仍入消息历史，失败/拒绝照常回灌），配合 `render` 实现"工具 UI 即答复"。两类结束都会发出 `finish`。
- **侧边面板工具**：`ChatTool.renderTo: 'panel'` 把 render 组件渲染到对话区右侧的侧边面板（side-panel.vue），契约同卡片 render（`ChatToolRenderProps`，随 toolCall 状态实时更新）；新的面板调用自动打开并聚焦，工具卡片 body 仅留「查看面板」入口（经 DI `openPanel` 切换聚焦，可切回历史调用）；布局基于 `ULayout`（`cols = 1fr + 面板宽度`，`colMinSizes` 约束会话区 ≥360px、面板 ≥320px，`useResizeObserver` 跟踪拖拽后的实际宽度）；`ChatTool.panelWidth` 可指定该工具面板的默认宽度（聚焦其调用时应用；缺省取「容器宽 - 860」，即面板默认尽可能大、会话区保留 860px）；`ChatTool.panelTitle`（字符串或按 toolCall 动态生成的函数）给出业务化面板标题（「业务对象 + 动作」），缺省取 label ?? name。组件根背景为 bg-color-bottom，消息/队列/输入区限宽 800px 居中（面板开合时排版不形变），卡片类元素（输入区、面板卡、欢迎气泡）用 bg-color-top + 阴影而非边框区分层级。空会话（无可见消息）时主列挂 `is-empty`：列表区与末尾弹性占位均分剩余空间使输入区垂直居中；空闲欢迎区钉在 UScroll 外、贴于输入框上方（有消息后布局回落到底部，欢迎区仍在输入框上方）；工作开始时活体球立即跳到列表末尾，结束后跳回。
- **待发送队列**：会话进行中 `send` 的消息进入 `queue`（不再丢弃），自然完成（finish）后按 FIFO 自动接续；`startQueued(id)` 中断当前会话并插队执行（其余保持顺序）；`enqueue(content, attachments?, beforeId?)` 支持锚点插入（编辑回插保持前后项顺序）；手动 `abort()` / 出错时队列保留不自动接续；`clear()` 一并清空队列、中止进行中的请求，并重置 token 统计。编辑流由 ai-chat.vue 以后继 id 锚点实现（取回输入框 → 重新提交插回原位置）。输入区清除按钮走 `UPopConfirm` 二次确认；生成中清除会跳过工作球停留、立刻回到欢迎区。
- **Token 用量**：OpenAI 兼容 transport 请求 `stream_options.include_usage`，从 SSE 末包 `usage` 解析 `prompt/completion/total` 以及缓存命中/未命中（`prompt_tokens_details.cached_tokens`、`prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`、`cache_read_input_tokens` 等）；未返回 usage 时不展示、不补 0。`useChat` 累计到 `tokenUsage`（会话）与 `lastTurnUsage`（当前用户轮，含工具多轮；供编程读取），并另存 `lastRequestUsage`（最近一次单次请求、未跨轮累计）。输入栏以用量环承载展示：模型声明 `ChatModel.contextWindow` 时按 `lastRequestUsage.totalTokens / 窗口上限` 填充占比（未声明则空环），悬停经 UDropdown 弹出明细面板——总 / 输入 / 输出，`tokenUsageDetail`（默认 false）为 true 时再列有数据的「缓存命中」「缓存未命中」。数字 ≥1000 用 K、≥100 万用 M（最多 1 位小数，整数不写 `.0`）。
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
