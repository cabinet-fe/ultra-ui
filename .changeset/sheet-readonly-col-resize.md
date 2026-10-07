---
'@veltra/sheet': minor
'@veltra/sheet-core': minor
---

- sheet/sheet-core: 新增列宽拖拽开关 `SheetGridOptions.colResize`（u-sheet prop `colResize`，缺省 false 行为不变）——`readonly` 下置 `true` 仅放开列头列宽拖拽手柄，行高拖拽与单元格编辑入口仍关闭，供只读预览宿主微调列宽；非 readonly 本就允许拖拽，置 `true` 无额外作用
- 列宽拖拽落定新增宿主通知：`SheetGridOptions.onColResizeEnd` 回调 / u-sheet `col-resize-end` 事件，载荷 `{ col, width }`（列索引与夹取后最终宽度），在拖拽写模型（`sheet.setColWidth`，不进 undo）之后触发
