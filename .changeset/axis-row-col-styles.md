---
'@veltra/sheet-core': minor
'@veltra/sheet': minor
---

新增行/列默认样式：`Sheet.setRowStyle`/`setColStyle`（部分合并语义，经命令进 undo），有效样式 = 列 → 行 → 格字段级叠加（`getEffectiveStyle` / `composeCellStyles`）；`SheetSnapshot` 与 `SnapshotPatch` 新增 `rowStyles`/`colStyles`/`colWidths`，随 `restoreContent` 还原；列宽随快照持久化（对称 `rowHeights`，不进 undo）；报表新增 `apply-style` 工具，设计器/查看器/导出适配行列样式。
