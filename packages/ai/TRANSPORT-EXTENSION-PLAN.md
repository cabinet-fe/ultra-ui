# @veltra/ai Transport 扩展方案 v2（视图入口 + 服务端驱动会话）

> 状态：实现方案（待评审）
> 背景（v2 更新）：bedrock 智能体模块**整体绑定 DSH**，agent 运行详情页 = UAiChat 会话视图（一个 run ↔ 一个 DSH sessionId）。UAiChat 的定位是**视图入口**：前端项目通过「按名称注册工具渲染元信息」把会话能力封装成功能；对接 DSH 后，**工具几乎全部来自服务端**（DSH 预设挂载的工具面），前端不定义也不执行工具，只需保证**任何工具都能以通用视图展示**。
> 现有 OpenAI 模式（客户端驱动：前端定义 + 执行工具）**保留不动**，两模式并存。

---

## 1. 现状与差距

### 1.1 现有契约（`src/chat/types.ts`）

```ts
export type ChatTransport = (request, handlers) => Promise<void>   // 客户端驱动：全量历史换流式增量
```

`useChat`：客户端持有消息、每轮发全量历史、客户端执行工具（`tool.execute`）、本地队列、本地 `needsConfirm`。

### 1.2 服务端驱动会话的差距（DSH 经 bedrock 桥）

| 能力 | 客户端驱动（现状） | 服务端驱动（DSH 会话） |
| --- | --- | --- |
| 会话/历史所有权 | 客户端 | 服务端（`session.history` + 事件流） |
| 发送 | 带全量历史 | 只发本轮内容（`session.prompt`） |
| 工具 | 前端定义 + 执行 | **服务端执行，前端只展示**（tool/call、tool/result 事件） |
| 审批/提问 | 本地 needsConfirm / 内置 askQuestion | 服务端 requested → 前端应答 respond |
| 队列/作业/用量 | 本地队列 | 服务端全量快照（queue/jobs/projection） |

### 1.3 v2 新增的定位约束

1. **视图入口**：UAiChat 不持有业务逻辑，业务 = 前端按 name 注册的渲染元信息 + 服务端编排。
2. **工具来自服务端**：`tools` prop 在 session 模式下降级为**可选渲染元信息注册表**（icon/label/render…），缺失时走**通用工具视图**——这是默认路径，必须开箱即用、覆盖任意工具。
3. **run 详情页用法**：`UAiChat` 绑定一个既存 `sessionId`（bedrock run 详情）：打开即 `fetchHistory` 回放 + WS 实时流；终态 run 只读渲染（不显示输入区或禁用发送）；进行中 run 可继续交互。

---

## 2. 契约设计

### 2.1 服务端会话 transport（`src/chat/session.ts`，新增）

```ts
/** 归一化后的服务端会话事件（协议无关；bedrock 桥把 DSH 帧翻译成它） */
export type ChatSessionEvent =
  | { type: 'user/message';   messageId: string; seq: number; content: string; attachments?: ChatAttachment[] }
  | { type: 'assistant/chunk'; messageId: string; seq: number; delta: string; reasoningDelta?: string }
  | { type: 'assistant/message'; messageId: string; seq: number; content: string; reasoning?: string; toolCalls?: ChatToolCall[] }
  | { type: 'tool/call';      callId: string; name: string; arguments: string; seq: number; view?: unknown }
  | { type: 'tool/result';    callId: string; status: 'success' | 'error' | 'rejected'; result?: string; error?: string; seq: number; view?: unknown }
  | { type: 'approval/requested'; approvalId: string; toolName: string; callId?: string; reason?: string; rpcId: string }
  | { type: 'approval/resolved';  approvalId: string; outcome: string }
  | { type: 'question/requested'; questions: AskQuestionItem[]; rpcId: string }
  | { type: 'question/resolved';  questionRpcId: string; outcome: 'answered' | 'cancelled' }
  | { type: 'queue/snapshot'; items: ChatQueuedMessage[] }
  | { type: 'jobs/snapshot';  jobs: ChatJob[] }
  | { type: 'projection'; key: string; value: unknown; seq: number }
  | { type: 'running'; running: boolean }
  | { type: 'finish' }
  | { type: 'error'; code: string; message: string }

export interface ChatSessionTransport {
  readonly kind: 'session'
  open(handlers: { onEvent(e: ChatSessionEvent): void; onDisconnect?(): void }): () => void
  send(content: string, attachments?: ChatAttachment[]): Promise<void>
  cancel(): Promise<void>
  respond(rpcId: string, ok: boolean, value?: unknown): Promise<void>   // 审批/提问共用
  fetchHistory(beforeSeq?: number): Promise<{ events: ChatSessionEvent[]; hasMore: boolean }>
  selectModel(provider: string, model: string): Promise<void>
}
export function isServerTransport(t: unknown): t is ChatSessionTransport
```

### 2.2 通用工厂（「任意 Transport」核心交付）

```ts
export function createServerTransport(adapter: ChatSessionAdapter): ChatSessionTransport
//  包内完成：seq 时序校验（乱序丢弃+告警）、重连后 fetchHistory 补拉对齐、
//  动作 in-flight 去重、dispose 清理。adapter 只做协议翻译。

// bedrock 桥（放 bedrock web 仓库，消费 bedrock §6 契约；类型由本包导出）
export function createBedrockTransport(options: {
  baseURL: string; token: string; sessionId: number
}): ChatSessionTransport
```

### 2.3 工具渲染元信息（v2 新增，`src/chat/types.ts`）

```ts
/** 服务端驱动模式下 tools 的合法形态：纯渲染元信息（执行在服务端） */
export interface ChatToolMeta {
  name: string                       // 与服务端 tool/call.name 匹配
  icon?: Component                   // 覆盖通用图标
  label?: string
  render?: Component                 // 自定义卡片/面板渲染（ChatToolRenderProps 不变）
  renderTo?: 'inline' | 'panel'
  panelWidth?: number
  panelTitle?: string | ((toolCall: ChatToolCall) => string)
  autoCollapse?: boolean
}
// session 模式下 props.tools 类型放宽为 ChatTool[] | ChatToolMeta[]（运行时按 name 查表；
// 客户端驱动模式下保持 ChatTool[] 语义不变——见 §3.3 判别）
```

---

## 3. useChat 服务端模式（`src/chat/use-chat.ts` 改造）

### 3.1 结构

- `session = isServerTransport(props.transport) ? props.transport : null`；`sessionMode = session !== null`。
- 生命周期：`watch(transport)` 中 `open()` + `fetchHistory()` 播种 `messages`；transport 变化/卸载时关闭（open 返回 disposer）。
- `send()`：session 模式 → `session.send(content, attachments)`；**不发全量历史、不跑客户端工具循环、maxToolRounds 不生效、不注入内置工具**。
- `abort()` → `session.cancel()`；`running` 由事件驱动。
- 队列：只由 `queue/snapshot` 整体替换；本地 `enqueue/startQueued/removeQueued` 在 session 模式禁用（v2 由适配层映射服务端入队 API）。
- `regenerate()`：session 模式 v1 禁用；`clear()` 仅清本地渲染面。

### 3.2 事件 → 状态机映射（与 v1 相同，摘要）

| 事件 | 动作 |
| --- | --- |
| user/message | push 用户消息（服务端回显为准，不做本地乐观占位） |
| assistant/chunk | 按 messageId 累积 content/reasoning |
| assistant/message | 定稿；轮末无 toolCalls → finish emit |
| tool/call | 追加 `ChatToolCall{status:'pending'}`（含 `view` 原文备查）；emit tool-call |
| tool/result | 按 callId 更新 status/result/error |
| approval/requested | 命中 callId → 该 toolCall `awaiting-confirm`；未命中 → 独立审批横幅；登记 rpcId |
| approval/resolved | 落定（allowed-once 后续由 tool/result 接管；rejected → rejected） |
| question/requested | 通用提问组件（§4） |
| queue/snapshot | 整体替换 queue |
| jobs/snapshot | 整体替换 jobs（新 ref） |
| projection | key='tokenUsage' → 合并 tokenUsage；'title' → emit；其余进 projections ref |
| running / finish / error / onDisconnect | running ref / finish emit / error emit / 重连补拉（fetchHistory(lastSeq)） |

### 3.3 工具元信息解析（v2 核心）

- session 模式下 `props.tools` 只作**按 name 的元信息查表**：`metaOf(name) → ChatToolMeta | undefined`。
- 渲染优先级：`meta.render`（前端打包的功能，如天气卡/面板）> 通用工具视图（§4）。
- `execute`/`needsConfirm`/`terminal` 字段在 session 模式**忽略**（执行在服务端；needsConfirm 的视觉态由 approval 事件驱动）。
- 客户端驱动模式（现有）完全不受影响：`resolveTools` 按 transport 形态分流，session 模式不注入内置工具。

---

## 4. UI 表面（`src/components/ai-chat/`）

### 4.1 通用工具视图（v2 新增，默认路径）

`tool-call.vue` 增加**通用渲染分支**（无 meta 时启用）：

- **图标**：内置 `toolName → icon` 映射表（bash/terminal、fs/file、web/globe、edit/pencil、ask/question、其余/工具兜底图标；映射表为包内常量，v2 开放 props 覆盖）。
- **名称**：`meta.label ?? toolName`；审批/运行状态沿用现有状态点与扫光。
- **参数/结果**：现有 JSON 折叠展示保留（arguments/result/error），长文本截断 + 展开；`view` 字段（DSH 工具展示视图原文）v2 渲染，v1 折叠展示 JSON。
- 确认态：`awaiting-confirm` 已有样式，会话模式点击走 `respond`。

**验收**：任意未知工具名不出现空白卡/报错，均能完整展示状态流转。

### 4.2 其余表面（沿用 v1 方案）

| 表面 | 改动 |
| --- | --- |
| 消息列表 | 复用；流式由 chunk 驱动；终态只读模式（run 详情）：隐藏/禁用输入区与队列操作 |
| 提问面板 | **解耦**：ask-question.vue 从「askQuestion 工具 render」泛化为「服务端提问渲染器」（props: questions + onSubmit），两路径共用 |
| 队列/模型选择 | 复用渲染；数据源换快照/会话目录 |
| 作业条（新） | 输入区上方细条：ChatJob[]（kind 图标 + label + 状态点 + 扫光），可折叠 |
| 审批横幅（新） | 无 callId 的 approval/requested 兜底：浮动确认卡 |
| 会话状态（可选） | 离线/标题小标记（v2：projection title 联动） |

> 新增组件目录后运行 `bun run resolver:gen` 刷新 `@veltra/vite` 组件表。

---

## 5. bedrock 桥：帧翻译表（契约附录）

`createBedrockTransport` 实现于 bedrock web（契约归 bedrock，本包只导出类型）；翻译表与 v1 相同，补充：`session/event` 的 `tool/call|result` 携带的 `view` 字段原样放入事件 `view`（供 §4.1 展示）；`host/session-status` 由 bedrock 流桥归一为 `running` 事件（不进会话历史）。

动作面：`send` → `POST /api/v1/dsh/sessions/{id}/prompt`；`cancel` → `.../cancel`；`respond` → `.../respond {rpc_id, ok, value}`；`selectModel` → `.../select-model`；`fetchHistory` → `GET .../history?before_seq=`；WS → `/ws/dsh/sessions/{id}/events?token=`（重连 + 补拉）。

---

## 6. 里程碑

| 里程碑 | 内容 | 验收 |
| --- | --- | --- |
| A1 | 类型层：`ChatSessionEvent` / `ChatSessionTransport` / `isServerTransport` / `createServerTransport` + 事件折叠函数（`chat/fold.ts`，历史回放与实时事件共用）+ 单测 | 契约定型；纯逻辑可测 |
| A2 | `useChat` session 模式分支（生命周期/send/abort/事件映射/队列快照/工具元信息查表）+ 单测（fake adapter） | 状态机双模式可测 |
| A3 | UI：通用工具视图 + ask-question 解耦 + 作业条 + 审批横幅 + 只读模式 + resolver:gen | 未知工具可展示；两模式共存 |
| A4 | bedrock web：`createBedrockTransport` + run 详情页接入 UAiChat（回放 + 实时 + 只读态） | 端到端可用 |
| A5 | playground 演示页（双 transport 切换）+ AGENTS.md/README 文档更新 | 验收 |

## 7. 兼容与风险

- OpenAI 模式零破坏（全部增量；`ChatTool` 类型不变，新增 `ChatToolMeta`）。
- `tools` 双形态（ChatTool[] | ChatToolMeta[]）：运行时按 transport 形态判别，类型上以联合 + 文档约束，避免破坏既有用户代码。
- 通用工具视图是兜底，不允许出现未渲染工具；工具图标映射表缺失时用兜底图标而非报错。
- 服务端事件时序（审批与工具卡交错）：A2 fake adapter 测试矩阵覆盖；`seq` 字段预留乱序/补拉。
- 版本：随 `@veltra/ai` 3.0（新增导出 + 组件解耦，无既有 API 删除）。
