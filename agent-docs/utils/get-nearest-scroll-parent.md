---
title: getNearestScrollParent
description: 取元素最近的纵向或横向可滚动祖先，没有则返回 null
---

`getNearestScrollParent(el)` 从 `el.parentElement` 向上找第一个 `scrollHeight > clientHeight` 或 `scrollWidth > clientWidth` 的祖先。没有则返回 `null`。判定规则与 `getScrollParents` 相同。

```ts
import { getNearestScrollParent } from '@veltra/utils'

const container = getNearestScrollParent(item)
if (container) container.scrollTop = item.offsetTop
```
