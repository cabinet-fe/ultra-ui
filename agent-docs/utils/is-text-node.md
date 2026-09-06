---
title: isTextNode 判断 VNode 是否为 Vue 文本节点
description: Vue 虚拟 DOM 判断工具函数，检测传入节点是否为 Vue Text 文本节点，用于判断插槽内容是否为纯文本或混合字符串渲染
---

`isTextNode(node)` 在 `node.type === Text` 时为 true，并把 `children` 收窄为 `string`。常用于只渲染文本的插槽过滤。

```ts
import { isTextNode } from '@veltra/utils'

const textNodes = (slots.default?.() ?? []).filter((node) => isTextNode(node))
```
