---
'@veltra/sheet': minor
---

行列插入/删除（Phase 7）：

- `Sheet` / `SheetContext` 新增 `insertRows` / `insertCols` / `deleteRows` / `deleteCols`（可 undo/redo）
- 数据、合并区、行高、公式引用（含跨表、`$` 绝对引用、引用被删转 `#REF!`）按 Excel 语义平移/裁剪
- `Sheet.rows/cols` 表格尺寸随操作增长并随快照持久化；发 `structure-change` 事件
- 工具栏 `structure` 组 + 单元格右键菜单提供插入/删除行/列入口；Grid 渲染行列数随模型联动
- 插入行/插入列为弹层型工具：数量输入面板（默认 1、钳制 1-100、Enter 提交，一次插入 = 单 undo 单元）
- `Sheet.ensureTableSize(rows, cols)`（`@internal`）：视图声明尺寸写入模型（扩张语义），
  修复插入点小于渲染 props 时 `max(props, sheet.rows)` 恒取 props、行/列数不增长的缺陷
- 弹层修复（真实浏览器）：`openPopup` 改 `setTimeout` 宏任务打开（避免同次 click 冒泡
  `onWindowClick` 秒关面板）；popup 移入 `toolbar-wrap` 定位（避免被 `.u-sheet` overflow
  裁剪不可见）
