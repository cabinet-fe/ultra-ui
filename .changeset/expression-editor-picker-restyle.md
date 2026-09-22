---
'@veltra/desktop': minor
---

变量面板与下拉浮层改进：

- `UDropdown` 新增 `direction` / `alignment` props（默认 `bottom` / `start`，行为不变），底部停靠的输入场景可要求面板向上弹出
- `UExpressionEditor` 变量选择面板按库内标准下拉形态重绘：边框 + 毛玻璃卡片、列表项对齐 select 尺寸范式、hover/键盘高亮改为浅色底（不再是主色底白字）、去除固定 `min-height`（短列表不再撑出大空面板）、面包屑改为面板头部、路径预览层级缩进改 CSS 驱动（移除 `└` 字符与内联样式）；同一页多个编辑器时键盘导航不再滚错列表（滚动定位改为面板内查找）。`UConditionEditor` 复用同一面板，同步受益
