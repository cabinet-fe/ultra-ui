---
title: isTextNode
description: 判断 VNode 是否为 Vue 文本节点
---

`isTextNode(node)` 在 `node.type === Text` 时为 true，并把 `children` 收窄为 `string`。常用于只渲染文本的插槽过滤。

```ts
import { isTextNode } from '@veltra/utils'

const textNodes = (slots.default?.() ?? []).filter((node) => isTextNode(node))
```
