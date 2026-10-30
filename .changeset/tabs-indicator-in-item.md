---
'@veltra/desktop': patch
---

perf(desktop): tabs 水平指示器移入 tab-item 内部，宽度随布局逐帧跟随

- 指示器不再作为独立元素由 JS 测量（offsetLeft/offsetWidth + transform）摆放，改为内嵌在每个 tab-item 中的绝对定位填充层，宽度与 item 布局天然同步
- hover 关闭图标展开/收起（width/margin 过渡）期间，指示器不再滞后或跳变，全程零 JS 测量、零 style 写入，消除逐帧 ResizeObserver 重测带来的丢帧风险
- 激活切换改为 opacity 交叉淡入淡出，节奏与 item 色彩过渡一致；useTabsBar 移除全部指示器测量链路
