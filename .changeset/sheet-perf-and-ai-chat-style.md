---
'@veltra/ai': patch
'@veltra/sheet': patch
'@veltra/sheet-core': patch
---

- `@veltra/sheet-core`：优化表格网格与浮动图性能。改用 `customComputeRowHeight` 按需获取行高并预置列宽，避免全量行高数组遍历与反复重绘；优化单元格遍历与图片图层 DOM / ObjectURL 管理。
- `@veltra/sheet`：优化 sheet 切换激活逻辑，避免切 tab 时全量重放列宽与重复同步模型。
- `@veltra/ai`：优化 AI 对话样式。加固 Markstream 变量作用域与小屏列表边距，调整折叠工具项与输入框层级阴影样式。
