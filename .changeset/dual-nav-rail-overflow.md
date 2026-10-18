---
"@veltra/desktop": patch
"@veltra/directives": patch
---

修复 `UDualNav` 左轨一级应用溢出时真实鼠标点击失效：应用按钮固定 `flex-shrink: 0`，波纹在 `mousedown` 时临时写入的 `overflow: hidden` 不再把按钮压缩到 0 高，图标不再消失、后续按钮不再位移，`click` 正确命中按钮并切换右栏。左轨一级应用过多时改为内部滚动并隐藏滚动条。

修复 `vRipple` 把布尔 `true` 当作类名写入 `data-ripple-class` 的问题：仅非空字符串绑定值写入波纹类名；波纹回收在等待 `transitionend` 之外增加兜底定时器，避免内联 `overflow` / `position` 长时间残留。
