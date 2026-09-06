---
title: isFragment 判断节点是否为 Vue Fragment 容器片段
description: Vue 虚拟 DOM 判断工具函数，检测传入节点是否为 Vue 3 内置 Fragment 虚拟容器节点，用于递归拍平多节点插槽与子节点结构解析
---

`isFragment(node)` 在节点存在且 `node.type === Fragment` 时为 true。`extractNormalVNodes` 会展开这类节点的 `children`。

```ts
import { isFragment } from '@veltra/utils'
import { Fragment, h } from 'vue'

isFragment(h(Fragment, [h('span', 'a')])) // true
```
