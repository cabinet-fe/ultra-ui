---
title: scrollViewportByStep 按视口比例步长平滑水平滚动容器
description: DOM 滚动控制工具函数，以视口宽度的 80% 作为步长平滑滚动容器，用于水平滚动条左右箭头翻页按钮点击平滑滚动场景
---

`scrollViewportByStep(vp, dir)` 以 `behavior: 'smooth'` 把视口 `scrollLeft` 移动 `dir * clientWidth * 0.8`。`dir` 只能是 `1`（向右）或 `-1`（向左）。`vp` 需同时具备滚动几何与 `scrollTo`。

按钮显隐用 `computeOverflowNavState`。

```ts
import { scrollViewportByStep } from '@veltra/utils'

scrollViewportByStep(viewportEl, -1) // 上一步 / 向左
scrollViewportByStep(viewportEl, 1) // 下一步 / 向右
```
