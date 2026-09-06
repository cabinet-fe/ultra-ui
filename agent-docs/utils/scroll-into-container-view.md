---
title: "scrollIntoContainerView - 在指定容器内将子元素滚入可视区域"
description: "DOM 滚动控制工具函数，在指定的父级滚动容器内将子元素滚动到完全可见区域，避免原生 scrollIntoView 导致最外层 window 页面联动滚动抖动，适用于下拉菜单高亮项与列表定位"
keywords: ["scrollIntoContainerView", "@veltra/utils", "scroll-into-container-view", "在指定容器内将子元素滚入可视区域"]
aliases: ["scroll-into-container-view", "scrollIntoContainerView", "在指定容器内将子元素滚入可视区域"]
---
## 快速上手

`scrollIntoContainerView(el, container, options?)` 只改 `container` 的 `scrollTop` / `scrollLeft`，用来替代 `el.scrollIntoView`（后者有时会带动外部页面滚动）。`container` 为 `null` 时用 `getNearestScrollParent(el)`；仍找不到则直接返回。元素在容器内已完全可见时不滚动。

`options.block` / `options.inline` 取值 `'center' | 'start' | 'end'`，默认都是 `'center'`。该联合类型未单独导出。

```ts
import { scrollIntoContainerView } from '@veltra/utils'

scrollIntoContainerView(selectedEl, scrollContainer, { block: 'center' })
scrollIntoContainerView(itemEl, null, { block: 'start', inline: 'center' })
```

