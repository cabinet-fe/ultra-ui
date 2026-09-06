---
title: "scrollElementIntoView - 将子元素平滑滚入水平溢出视口"
description: "DOM 滚动控制工具函数，计算元素在水平滚动容器中的相对偏移，平滑滚动至容器可见区域并在越界时精准对齐左右边缘，常用于水平标签页与步骤条选中项自动居中显现"
keywords: ["scrollElementIntoView", "@veltra/utils", "scroll-element-into-view", "将子元素平滑滚入水平溢出视口"]
aliases: ["scroll-element-into-view", "scrollElementIntoView", "将子元素平滑滚入水平溢出视口"]
---
## 快速上手

`scrollElementIntoView(vp, el, offset?)` 比较视口与目标的 `getBoundingClientRect`：左侧越界则向左滚到露出并留 `offset`；右侧越界则向右滚。默认 `offset` 为 `8`。已完全可见时不滚动。只处理水平方向。

这与 `scrollIntoContainerView`（任意滚动容器、可指定块对齐）不是同一个 API。

```ts
import { scrollElementIntoView } from '@veltra/utils'

scrollElementIntoView(viewportEl, activeTabEl)
scrollElementIntoView(viewportEl, activeTabEl, 12)
```

