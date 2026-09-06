---
title: "getScrollParents - 收集元素所有可滚动祖先容器列表"
description: "DOM 查找工具函数，自底向上遍历并收集指定元素的所有可滚动祖先 DOM 节点数组，常用于多层嵌套滚动容器的滚动事件监听绑定与弹层位置联动刷新"
keywords: ["getScrollParents", "@veltra/utils", "get-scroll-parents", "收集元素所有可滚动祖先容器列表"]
aliases: ["get-scroll-parents", "getScrollParents", "收集元素所有可滚动祖先容器列表"]
---
## 快速上手

`getScrollParents(el)` 从 `el.parentElement` 向上遍历，把 `scrollHeight > clientHeight` 或 `scrollWidth > clientWidth` 的祖先收进数组返回。横向滚动容器也计入，弹层需监听其 `scroll`。

```ts
import { getScrollParents } from '@veltra/utils'

const parents = getScrollParents(trigger)
parents.forEach((el) => el.addEventListener('scroll', onReposition))
```

