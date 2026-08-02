---
'@veltra/sheet': minor
---

新增 Undo/Redo 命令系统：所有模型写操作（单元格读写、合并/取消合并）统一改造为命令执行，每个命令产出携带 before/after 差量补丁的 Mutation；`HistoryManager` 提供 undo/redo 栈、事务（一次批量变更 = 一个撤销单元）与 200 条容量上限。grid 层接入 `Cmd/Ctrl+Z`、`Cmd/Ctrl+Shift+Z`、`Ctrl+Y` 快捷键，新增 `history-change` 事件驱动按钮置灰。
