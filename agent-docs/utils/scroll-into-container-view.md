---
title: scrollIntoContainerView
description: 在指定容器内滚动元素进视图，避免带动外层页面
---

`scrollIntoContainerView(el, container, options?)` 只改 `container` 的 `scrollTop` / `scrollLeft`，用来替代 `el.scrollIntoView`（后者有时会带动外部页面滚动）。`container` 为 `null` 时用 `getNearestScrollParent(el)`；仍找不到则直接返回。元素在容器内已完全可见时不滚动。

`options.block` / `options.inline` 取值 `'center' | 'start' | 'end'`，默认都是 `'center'`。该联合类型未单独导出。

```ts
import { scrollIntoContainerView } from '@veltra/utils'

scrollIntoContainerView(selectedEl, scrollContainer, { block: 'center' })
scrollIntoContainerView(itemEl, null, { block: 'start', inline: 'center' })
```
