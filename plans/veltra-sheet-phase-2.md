# 阶段 2：Undo/Redo 命令系统

> 总览与设计决策见 [veltra-sheet-plan.md](./veltra-sheet-plan.md)（决策 5）。先于公式实施：后续所有模型变更（含公式重算）都走命令系统，天然获得撤销能力。

## 任务清单

### 2.1 命令基础设施

- [ ] `core/command/types.ts`：`Command { id, handler(ctx, params) }`、`Mutation { redo: Patch[], undo: Patch[] }`、`Patch = CellPatch | MergePatch`（before/after 差量，非全量快照）
- [ ] `core/command/registry.ts`：命令注册表（`register / execute`）
- [ ] `core/command/history.ts`：`HistoryManager`——undoStack / redoStack、事务（`beginTransaction / commit`，一次事务 = 一个 undo 单元）、容量上限（默认 200，淘汰最旧）、新命令清空 redo 栈

### 2.2 内置命令（阶段 1 全部操作改造）

- [ ] `SetCellValueCommand`：支持批量（供粘贴/填充复用），Patch 捕获每格 before/after
- [ ] `MergeCellsCommand`：undo 需恢复旧合并记录 + 被清空的各格原值（Patch 捕获完整 before 状态）
- [ ] `UnmergeCellsCommand`：undo 恢复合并记录
- [ ] grid 层与 Sheet API 的所有写操作切换为命令执行（不留绕过入口）

### 2.3 交互与事件

- [ ] 键盘绑定：`Cmd/Ctrl+Z` undo、`Cmd/Ctrl+Shift+Z` / `Ctrl+Y` redo，grid 层接入
- [ ] `history-change` 事件（canUndo / canRedo 状态，供阶段 4 工具栏按钮置灰）
- [ ] playground 演示页加 undo/redo 按钮与快捷键

## 验证清单

### 单测

- [ ] setValue → undo 恢复旧值（含"旧值为空"即删除）、redo 重放
- [ ] merge → undo 后：旧合并记录、被清除的各格原值**全部还原**；redo 再合并结果一致
- [ ] 批量 setValue（一次 100 格）= 一次 undo 全回滚（事务原子性）
- [ ] 交错序列：A 操作 → B 操作 → undo → 新 C 操作 → redo 栈已清空
- [ ] 容量上限：超过 200 条淘汰最旧，且不破坏栈一致性
- [ ] 快速连续 undo/redo 50 次无状态错乱（对照初始/终态 snapshot 相等性断言）

### 人工（playground）

- [ ] 编辑、合并、取消合并后快捷键与按钮 undo/redo 行为正确

### 通用门槛

- [ ] `bun run lint` / `bun run test` / `bun run build` 全绿
