---
'@veltra/desktop': patch
---

`UTabs` 水平标签栏滑动指示器改为点击后直接就位，不再播放滑动过渡。

- 指示器原有的固定时长滑动过渡会与 hover 时关闭按钮的展开（width/margin 布局动画）互相打断，观感生硬、跳帧，直接就位后不再有冲突。
- 指示器测量改用 `offsetLeft` / `offsetWidth` 布局几何：`:active` 按压缩放（scale 0.97）不再混进测量值，落位尺寸与激活项精确一致。
