---
title: applyWheelHorizontalScroll
description: 将鼠标纵向滚轮转为视口水平滚动，不拦截触控板横滑
---

`applyWheelHorizontalScroll(e, vp, navActive)` 在水平溢出导航激活时，把纵向 `wheel` 的 `deltaY` 加到 `vp.scrollLeft`。

- `navActive` 为 `false`（内容未溢出、导航按钮不可见）时直接返回，不消费事件
- `|deltaX| > |deltaY|` 视为触控板横滑，不拦截
- `deltaY === 0` 时返回
- 其余情况 `preventDefault()` 后 `vp.scrollLeft += e.deltaY`

```ts
import { applyWheelHorizontalScroll } from '@veltra/utils'

viewportEl.addEventListener(
  'wheel',
  (e) => {
    applyWheelHorizontalScroll(e, viewportEl, overflowing)
  },
  { passive: false }
)
```
