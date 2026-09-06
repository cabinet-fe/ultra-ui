---
title: "isTemplate - 判断节点是否为 template 标签 VNode"
description: "Vue 虚拟 DOM 判断工具函数，检测传入节点是否为 template 类型的虚拟节点包装器，用于插槽子节点遍历与指令解构"
keywords:
  - isTemplate
  - @veltra/utils
  - is-template
  - 判断节点是否为
  - 标签
aliases: ["is-template", "isTemplate"]
---
## 快速上手

`isTemplate(node)` 在 `isVNode(node) && node.type === 'template'` 时为 true。`extractNormalVNodes` 会展开这类节点的 `children`。

```ts
import { isTemplate } from '@veltra/utils'
import { h } from 'vue'

isTemplate(h('template', [h('span', 'a')])) // true
```

