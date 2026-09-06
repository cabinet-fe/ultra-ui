---
title: scrollViewportByStep
description: 按视口宽度 80% 的步长平滑水平滚动
---

`scrollViewportByStep(vp, dir)` 以 `behavior: 'smooth'` 把视口 `scrollLeft` 移动 `dir * clientWidth * 0.8`。`dir` 只能是 `1`（向右）或 `-1`（向左）。`vp` 需同时具备滚动几何与 `scrollTo`。

按钮显隐用 `computeOverflowNavState`。

```ts
import { scrollViewportByStep } from '@veltra/utils'

scrollViewportByStep(viewportEl, -1) // 上一步 / 向左
scrollViewportByStep(viewportEl, 1) // 下一步 / 向右
```
