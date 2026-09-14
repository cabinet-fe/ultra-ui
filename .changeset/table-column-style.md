---
"@veltra/desktop": patch
---

- 表格（Table）：列配置新增 `style` / `headerStyle`，支持设置表体/表头/表尾单元格 `color`、`fontSize` inline 样式；`headerStyle` 未指定时回退到 `style`（规则同 `headerAlign`）
