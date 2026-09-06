---
title: "computeOverflowNavState - 容器内容水平溢出与导航箭头状态计算"
description: "视口几何计算工具函数，根据容器 scrollWidth、clientWidth 与 scrollLeft 几何属性推导水平内容溢出状态，用于标签页、导航栏左右翻页按钮的展示与禁用状态控制"
keywords: ["computeOverflowNavState", "@veltra/utils", "compute-overflow-nav-state", "容器内容水平溢出与导航箭头状态计算"]
aliases: ["compute-overflow-nav-state", "computeOverflowNavState"]
---
## 快速上手

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

