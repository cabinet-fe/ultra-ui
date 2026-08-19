---
'@veltra/desktop': patch
'@veltra/sheet': patch
'@veltra/sheet-core': patch
---

- 修复 UPalette 对非 `#RRGGBB` 颜色（xlsx 8 位 ARGB、`rgb()` 等）解析错误导致圆形指示器不显示绑定颜色的问题；sheet-core 导入时将 8 位 ARGB 归一为 `#RRGGBB`
- UNumberInput：步进值为 1 时不再播放数字滚动动画
- 修复报表数据预览使用未提交的旧 SQL 导致取数为空的问题（预览前自动落草稿）
