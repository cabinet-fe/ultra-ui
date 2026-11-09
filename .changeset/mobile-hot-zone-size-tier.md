---
"@veltra/mobile": patch
---

修复各组件尺寸档视觉尺寸被触控热区或下限抹平的问题。此前 15 个组件用 `min-height: max(高度档, 44px)` 兜底热区，small / default 两档高度都被抬到 44px；现改为视觉尺寸按档生效，不足 44px 的点击命中区域由伪元素上下外扩补足（触发器类用 `::before`，不拦截清除 / 箭头等内部按钮）。受影响组件：select、multi-select、cascade、date-picker、time-picker、input、textarea、checkbox、checkbox-group、radio、switch、tabs、segment、list。连带修正：input / textarea 移除根元素 `overflow: hidden` 并补根元素点击聚焦；行内清除与前后缀按钮改用垂直居中的 44px 命中层；radio / checkbox 指示器与 steps 圆圈去掉 20px / 40px 下限，small 与 default 不再等大。
