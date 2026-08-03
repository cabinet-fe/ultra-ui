# @veltra/sheet

## 2.0.1

### Patch Changes

- cf7561e: 新增填充柄（公式 `$` 感知位移、数字/日期等差、其余 tile 复制）、行高拖拽调整与模型稀疏持久化（tab 切换重建还原，不进 undo）、默认 VTable 主题（白底 body、浅灰行号/列头、textOverflow clip）及单元格右键菜单（合并/取消合并，语义对齐内置工具）。

## 2.0.0

### Minor Changes

- 58f06c0: 新增自研公式引擎：tokenizer → Pratt parser → AST → evaluator，支持单元格/区域/跨表引用（含带引号表名）与可扩展函数注册表（内置 SUM / AVERAGE / MAX / MIN / COUNT / COUNTA / IF / AND / OR / NOT / ROUND / ABS / CONCATENATE）。工作簿级依赖图按拓扑序增量重算，循环引用检测为 `#CYCLE!` 且打破循环自动恢复；完整错误值体系（`#DIV/0!` / `#VALUE!` / `#NAME?` / `#REF!` / `#ERROR!` / `#CYCLE!`）。`=` 开头输入走 `SetCellFormulaCommand`，重算派生变更并入同一撤销单元；grid 层公式格显示计算值、编辑时显示公式原文。
- d28b0e7: 新增工具扩展机制与 `USheet` 组件。`registerTool()` 注册表支持分组、排序、`visible`/`disabled` 状态函数；第三方工具只能通过 `SheetContext` 门面操作（选区读写、命令执行、事件订阅），保证扩展不绕过命令系统、undo 全覆盖。内置 undo/redo（随历史状态置灰）与合并/取消合并工具。`USheet` 组件组合工具栏 + 表格 + 底部 sheet tabs，支持传入 `Workbook` 多表切换；`SheetGrid` 新增拖选区域同步（DRAG_SELECT_END → 模型选区）。
- 687f74d: 新增 Undo/Redo 命令系统：所有模型写操作（单元格读写、合并/取消合并）统一改造为命令执行，每个命令产出携带 before/after 差量补丁的 Mutation；`HistoryManager` 提供 undo/redo 栈、事务（一次批量变更 = 一个撤销单元）与 200 条容量上限。grid 层接入 `Cmd/Ctrl+Z`、`Cmd/Ctrl+Shift+Z`、`Ctrl+Y` 快捷键，新增 `history-change` 事件驱动按钮置灰。

### Patch Changes

- Updated dependencies [394ea96]
  - @veltra/styles@2.0.0
  - @veltra/utils@2.0.0
