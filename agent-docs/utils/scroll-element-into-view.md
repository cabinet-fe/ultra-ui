---
title: scrollElementIntoView
description: 将子元素平滑滚入水平溢出视口，越界时对齐边缘
---

`scrollElementIntoView(vp, el, offset?)` 比较视口与目标的 `getBoundingClientRect`：左侧越界则向左滚到露出并留 `offset`；右侧越界则向右滚。默认 `offset` 为 `8`。已完全可见时不滚动。只处理水平方向。

这与 `scrollIntoContainerView`（任意滚动容器、可指定块对齐）不是同一个 API。

```ts
import { scrollElementIntoView } from '@veltra/utils'

scrollElementIntoView(viewportEl, activeTabEl)
scrollElementIntoView(viewportEl, activeTabEl, 12)
```
