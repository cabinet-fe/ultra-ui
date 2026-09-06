---
title: computeOverflowNavState
description: 由视口滚动几何推导水平溢出导航按钮状态
---

`computeOverflowNavState(vp)` 根据视口的 `scrollLeft` / `scrollWidth` / `clientWidth` 计算导航按钮是否可用。内容宽度超出视口超过 `1px` 视为溢出。

相关类型：`OverflowNavViewport`（入参几何）、`OverflowNavState`（返回值）。

`OverflowNavState`：

| 字段          | 含义                               |
| ------------- | ---------------------------------- |
| `overflowing` | 内容是否溢出视口                   |
| `canPrev`     | 溢出且 `scrollLeft > 0`，可向左滚  |
| `canNext`     | 溢出且右侧仍有未露出内容，可向右滚 |

步进滚动见 `scrollViewportByStep`，元素滚入见 `scrollElementIntoView`，滚轮转横滚见 `applyWheelHorizontalScroll`。

```ts
import { computeOverflowNavState } from '@veltra/utils'

const { overflowing, canPrev, canNext } = computeOverflowNavState(viewportEl)
```
