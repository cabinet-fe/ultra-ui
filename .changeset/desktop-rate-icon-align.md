---
'@veltra/desktop': patch
---

修复 `URate` 彩色层图标错位与半星裁剪变形。

- `.u-rate__overlay` 改为 flex 定位并与灰色底层同样居中：原来绝对定位容器里的图标按行内基线对齐，被 `line-height` 下移约 6px 后又被 `overflow: hidden` 裁掉，彩色星只剩上方针尖碎片。
- 半星裁剪时彩色层子元素 `flex: none`，避免 50% 宽度把图标压扁。
- `character` 字符包一层 `.u-rate__symbol`，与图标层盒模型一致，半星裁剪和字符基线与图标对齐。
- 根节点补 `vertical-align: middle`，与并排文本基线居中对齐。
