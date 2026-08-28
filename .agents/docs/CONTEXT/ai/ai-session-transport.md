# 服务端会话 transport 与事件折叠

## 术语

- **ChatSessionTransport**：对象形态的服务端会话 transport，`kind: 'session'`，与函数型 `ChatTransport` 互斥。
- **ChatSessionAdapter**：协议翻译层；订阅事件、把动作打到远端、拉历史。时序校验 / dispose / 断线补拉 / in-flight 去重由 `createServerTransport` 完成。
- **ChatSessionEvent**：归一化后的服务端会话事件（协议无关），带 `seq` 的事件参与乱序丢弃。
- **ChatFoldState**：历史回放与实时 `onEvent` 共用的折叠状态。
- **ChatToolMeta**：服务端驱动模式下 tools 的纯渲染元信息（无 `execute` / `description` / `parameters` / `needsConfirm` / `terminal`）。
- **ChatJob**：服务端下发的作业条项（`id` / `kind` / `label` / `status`）。
- **createSessionRuntime**：session 路径的 open / fetchHistory / fold 运行时，把 `ChatFoldState` 同步到 useChat 渲染面。
- **toolIcons**：`AiChatProps` 上宿主覆盖的 toolName → icon 映射；精确名优先于包内名称规则，未命中走兜底图标、不得 throw。
- **readonly**：`AiChatProps` 只读开关；为真时不展示输入区、欢迎语不可发送、队列无插队/编辑/移除。默认 false。

## 领域

`packages/ai/src/chat` 增加服务端会话路径，与既有函数型 `ChatTransport` 并存：

1. **判别与工厂**：`isServerTransport` 仅对带 `kind: 'session'` 的对象为 true（函数 / `null` / 无 `kind` 均为 false）。`createServerTransport(adapter)` 包出 `ChatSessionTransport`：`open` 订阅并返回 disposer；带 `seq` 的后到更小/重复事件 `console.warn` 后丢弃；断开时 `fetchHistory(lastSeq)` 补拉再投递；`send` / `cancel` / `respond` / `selectModel` 同一动作未完成时忽略重复调用。`fetchHistory` 不做 in-flight 去重。
2. **事件折叠**：`foldSessionEvent` 是纯函数，历史回放与实时 `onEvent` 走同一套。`user/message` 按服务端回显追加、不造本地占位；`assistant/chunk` 按 `messageId` 累积 content/reasoning；`assistant/message` 定稿；`tool/call` 与 `tool/result` 维护 `ChatToolCall`（可带服务端 `view`）；`queue/snapshot` 与 `jobs/snapshot` 整体替换；`projection` 把 `tokenUsage` 累加、`title` 取出，其余进 `projections`；`approval/*` / `question/*` 维护待确认与待提问；`running` / `finish` / `error` 更新运行态。后到的更小/重复 `seq` 不覆盖已应用事件。
3. **类型增量**：`ChatToolCall.view` 为 session 模式可选展示视图；新增 `ChatToolMeta` 与 `ChatJob`。符号经 `chat/index.ts` 导出。`AiChatProps.transport` 为 `ChatTransport | ChatSessionTransport`；`tools` 在 session 下可为 `ChatToolMeta[]`（`ChatTool[]` 仍可赋值）。`toolIcons` 覆盖包内 toolName → icon 映射。
4. **useChat 分流**：`isServerTransport` 为真时走 `createSessionRuntime`：watch transport 时 `open` + `fetchHistory` 播种，历史与实时事件同一套 fold 同步到 messages / queue / jobs / tokenUsage / projections / title / running / pendingApprovals / pendingQuestion；更换或卸载调 disposer。`send` / `abort` 只调 `session.send` / `cancel`，不造本地占位、不执行 `execute`、不注入内置工具。队列只认 `queue/snapshot`；`enqueue` / `startQueued` / `removeQueued` / `regenerate` 为 no-op。`clear` 只重置本地 fold，不调 `cancel`。审批与提问走 `respond(rpcId)`；已 open 后模型切换走 `selectModel`。`running` 由事件与 `onDisconnect` 驱动。函数型 transport 行为不变。工具解析与 usage 累加抽到 `use-chat-helpers.ts`。
5. **UAiChat 渲染**：session 下 `toolMap` 只收 `props.tools`，不注入 `createBuiltinTools`；未注册工具名走通用卡片（参数 / 结果 / `view`，无「未找到」），`meta.render` / `tool-<name>` 插槽仍优先。图标：`meta.icon` > `toolIcons` 精确名 > 内置名称规则 > 兜底。长 JSON 超过 480 字截断、可展开看全文。函数型 transport 仍注入内置工具。有 `jobs` 时输入区上方渲染 `JobBar`（`kind` 走 `resolveToolIcon`，`running` 扫光，默认可折叠）。无 `callId` 的 `pendingApprovals` 走 `ApprovalBanner`（允许/拒绝调 `respondSession`）；有 `callId` 仍走工具卡确认。`pendingQuestion` 用展示态 `AskQuestion`（只收 `questions` / `answers` / `error`，提交 emit）挂在输入区上方，session 提交走 `respondSession(rpcId, true, answers)`。客户端内置 askQuestion 由 `AskQuestionRender` 从 `toolCall` 解析后挂同一表单，提交走 `resolveAskQuestion`。`readonly` 为真时不渲染输入区、欢迎语不可发送、队列无操作；`handleSend` 直接 return。
6. **宿主接入**：`packages/ai/README.md` 按客户端驱动 / 服务端驱动两条路径写用法，并写明本包不实现、不导出 `createBedrockTransport`（DSH / bedrock HTTP/WS 由其它仓库提供 `ChatSessionAdapter`）。playground `src/ai-chat` 同一页用 `USegment` 切换：客户端仍走 `createOpenAITransport` + `/ai/chat/completions`（天气/面板等工具保留）；服务端走 `createServerTransport(createFakeSessionAdapter())`。`fake-session.ts` 是页内 adapter，按欢迎语关键词演示未知工具卡 / 提问 / 无 callId 审批横幅 / 作业条，不发真实 session HTTP/WS、不接 DSH。

## 影响文件

- 新增：`packages/ai/src/chat/session.ts`
- 新增：`packages/ai/src/chat/fold.ts`
- 新增：`packages/ai/src/chat/use-chat-session.ts`
- 新增：`packages/ai/src/chat/use-chat-helpers.ts`
- 新增：`packages/ai/src/chat/__test__/session.test.ts`
- 新增：`packages/ai/src/chat/__test__/fold.test.ts`
- 修改：`packages/ai/src/chat/types.ts`
- 修改：`packages/ai/src/chat/index.ts`
- 修改：`packages/ai/src/chat/use-chat.ts`
- 修改：`packages/ai/src/chat/__test__/use-chat.test.ts`
- 修改：`packages/ai/src/types/ai-chat.ts`
- 新增：`packages/ai/src/components/ai-chat/tool-icons.ts`
- 新增：`packages/ai/src/components/ai-chat/tool-json.vue`
- 新增：`packages/ai/src/components/ai-chat/__test__/tool-icons.test.ts`
- 修改：`packages/ai/src/components/ai-chat/di.ts`
- 修改：`packages/ai/src/components/ai-chat/ai-chat.vue`
- 修改：`packages/ai/src/components/ai-chat/tool-call.vue`
- 修改：`packages/ai/src/components/ai-chat/side-panel.vue`
- 新增：`packages/ai/src/components/ai-chat/job-bar.vue`
- 新增：`packages/ai/src/components/ai-chat/approval-banner.vue`
- 修改：`packages/ai/src/components/ai-chat/ask-question.vue`
- 修改：`packages/ai/src/components/ai-chat/queue-list.vue`
- 修改：`packages/ai/src/components/ai-chat/message-list.vue`
- 修改：`packages/ai/src/components/ai-chat/style.scss`
- 修改：`packages/ai/src/components/ai-chat/__test__/ai-chat.test.ts`
- 修改：`packages/ai/src/tools/ask-question/ask-question.ts`
- 新增：`packages/ai/README.md`
- 新增：`playground/src/ai-chat/fake-session.ts`
- 修改：`packages/ai/AGENTS.md`
- 修改：`playground/src/ai-chat/index.vue`
- 修改：`playground/AGENTS.md`

## 更新记录

- 2026-08-28：归档自 cooking/ai-session-transport
