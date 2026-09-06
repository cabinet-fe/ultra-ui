---
title: isTemplate
description: 判断节点是否为 type 为 template 的 VNode
---

`isTemplate(node)` 在 `isVNode(node) && node.type === 'template'` 时为 true。`extractNormalVNodes` 会展开这类节点的 `children`。

```ts
import { isTemplate } from '@veltra/utils'
import { h } from 'vue'

isTemplate(h('template', [h('span', 'a')])) // true
```
