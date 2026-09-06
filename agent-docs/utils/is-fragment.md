---
title: isFragment
description: 判断节点是否为 Vue Fragment
---

`isFragment(node)` 在节点存在且 `node.type === Fragment` 时为 true。`extractNormalVNodes` 会展开这类节点的 `children`。

```ts
import { isFragment } from '@veltra/utils'
import { Fragment, h } from 'vue'

isFragment(h(Fragment, [h('span', 'a')])) // true
```
