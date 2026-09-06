---
title: getScrollParents
description: 收集元素所有纵向或横向可滚动的祖先
---

`getScrollParents(el)` 从 `el.parentElement` 向上遍历，把 `scrollHeight > clientHeight` 或 `scrollWidth > clientWidth` 的祖先收进数组返回。横向滚动容器也计入，弹层需监听其 `scroll`。

```ts
import { getScrollParents } from '@veltra/utils'

const parents = getScrollParents(trigger)
parents.forEach((el) => el.addEventListener('scroll', onReposition))
```
