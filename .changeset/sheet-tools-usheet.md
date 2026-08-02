---
'@veltra/sheet': minor
---

新增工具扩展机制与 `USheet` 组件。`registerTool()` 注册表支持分组、排序、`visible`/`disabled` 状态函数；第三方工具只能通过 `SheetContext` 门面操作（选区读写、命令执行、事件订阅），保证扩展不绕过命令系统、undo 全覆盖。内置 undo/redo（随历史状态置灰）与合并/取消合并工具。`USheet` 组件组合工具栏 + 表格 + 底部 sheet tabs，支持传入 `Workbook` 多表切换；`SheetGrid` 新增拖选区域同步（DRAG_SELECT_END → 模型选区）。
