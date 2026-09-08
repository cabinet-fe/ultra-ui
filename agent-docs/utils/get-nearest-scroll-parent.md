---
title: 'getNearestScrollParent - 查找最近的可滚动祖先容器节点'
description: 'DOM 查找工具函数，从指定元素沿 DOM 树向上查找最近的 overflow 为 scroll 或 auto 的垂直或水平可滚动父级容器，不存在时返回 null，常用于浮层弹出定位与边界碰撞检测'
keywords:
  [
    'getNearestScrollParent',
    '@veltra/utils',
    'get-nearest-scroll-parent',
    '查找最近的可滚动祖先容器节点'
  ]
aliases: ['get-nearest-scroll-parent', 'getNearestScrollParent', '查找最近的可滚动祖先容器节点']
---

## 快速上手

`getNearestScrollParent(el)` 从 `el.parentElement` 向上找第一个 `scrollHeight > clientHeight` 或 `scrollWidth > clientWidth` 的祖先。没有则返回 `null`。判定规则与 `getScrollParents` 相同。

```ts
import { getNearestScrollParent } from '@veltra/utils'

const container = getNearestScrollParent(item)
if (container) container.scrollTop = item.offsetTop
```
