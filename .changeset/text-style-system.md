---
'@veltra/sheet': minor
---

文本样式系统（字体颜色 / 加粗斜体下划线删除线 / 字号 / 对齐 / 换行）：

- `CellStyle` 扩展 `font` / `align`；样式池与 `mergeCellStyle` 支持逐字段合并（`{}` 清除该类）
- 导入 xlsx 还原字体颜色等文本样式；导出反向映射
- VTable 渲染映射 + wrap 行高按需估算（非全局 autoHeight）
- 工具栏 text 组：B/I/U/S、对齐×6、换行、字体颜色/字号弹层（本阶段文字按钮）
