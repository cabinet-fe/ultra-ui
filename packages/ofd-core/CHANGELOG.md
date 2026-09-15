# @veltra/ofd-core

## 1.0.1

### Patch Changes

- 9dcf9af: 修复新版数电发票（2026 版式）渲染：值文字缺失、线条全黑、二维码撑满整页。
  
  - Body 图层 `PageBlock` 分组容器内对象此前被静默丢弃，导致发票号码、金额等值文本整组不渲染，现递归扁平化收集
  - PathObject / TextObject 的子元素颜色声明（`<FillColor Value="…"/>` / `<StrokeColor Value="…"/>`）此前未解析，`Fill="true"` 框线回落默认黑，现属性与子元素两种形式都支持
  - Font@FontFile 兼容子元素声明并按资源根 BaseLoc 解析；内嵌字体 cmap 表改为可省（子集字体无 cmap）
  - TextObject 的 CGTransform 字形替换：按 Glyphs 字形序号从内嵌子集字体取轮廓（防篡改乱序字形此前无法渲染）
  - 带平移缩放 CTM 的图片按单位盒渲染，整页 Boundary 声明不再把二维码放大到全页
