# 服务端会话 transport 与事件折叠

## 术语

- **ChatSessionTransport**：对象形态的服务端会话 transport，`kind: 'session'`，与函数型 `ChatTransport` 互斥。
- **ChatSessionAdapter**：协议翻译层；订阅事件、把动作打到远端、拉历史。时序校验 / dispose / 断线补拉 / in-flight 去重由 `createServerTransport` 完成。
- **ChatSessionEvent**：归一化后的服务端会话事件（协议无关），带 `seq` 的事件参与乱序丢弃。
- **ChatFoldState**：历史回放与实时 `onEvent` 共用的折叠状态。
- **ChatToolMeta**：服务端驱动模式下 tools 的纯渲染元信息（无 `execute` / `description` / `parameters` / `needsConfirm` / `terminal`）。
- **ChatJob**：服务端下发的作业条项（`id` / `kind` / `label` / `status`）。

## 领域

`packages/ai/src/chat` 增加服务端会话路径，与既有函数型 `ChatTransport` 并存：

1. **判别与工厂**：`isServerTransport` 仅对带 `kind: 'session'` 的对象为 true（函数 / `null` / 无 `kind` 均为 false）。`createServerTransport(adapter)` 包出 `ChatSessionTransport`：`open` 订阅并返回 disposer；带 `seq` 的后到更小/重复事件 `console.warn` 后丢弃；断开时 `fetchHistory(lastSeq)` 补拉再投递；`send` / `cancel` / `respond` / `selectModel` 同一动作未完成时忽略重复调用。`fetchHistory` 不做 in-flight 去重。
2. **事件折叠**：`foldSessionEvent` 是纯函数，历史回放与实时 `onEvent` 走同一套。`user/message` 按服务端回显追加、不造本地占位；`assistant/chunk` 按 `messageId` 累积 content/reasoning；`assistant/message` 定稿；`tool/call` 与 `tool/result` 维护 `ChatToolCall`（可带服务端 `view`）；`queue/snapshot` 与 `jobs/snapshot` 整体替换；`projection` 把 `tokenUsage` 累加、`title` 取出，其余进 `projections`；`approval/*` / `question/*` 维护待确认与待提问；`running` / `finish` / `error` 更新运行态。后到的更小/重复 `seq` 不覆盖已应用事件。
3. **类型增量**：`ChatToolCall.view` 为 session 模式可选展示视图；新增 `ChatToolMeta` 与 `ChatJob`。符号经 `chat/index.ts` 导出；本阶段未接入 `useChat` / `UAiChat`。

## 影响文件

- 新增：`packages/ai/src/chat/session.ts`
- 新增：`packages/ai/src/chat/fold.ts`
- 新增：`packages/ai/src/chat/__test__/session.test.ts`
- 新增：`packages/ai/src/chat/__test__/fold.test.ts`
- 修改：`packages/ai/src/chat/types.ts`
- 修改：`packages/ai/src/chat/index.ts`

## 更新记录

- 2026-08-28：新增服务端会话 transport、协议无关事件与纯函数 fold；涉及：packages/ai/src/chat/session.ts、packages/ai/src/chat/fold.ts、packages/ai/src/chat/types.ts、packages/ai/src/chat/index.ts
