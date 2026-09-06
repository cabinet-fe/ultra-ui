---
title: isComment
description: 判断 VNode 是否为 Vue 注释节点
---

`isComment(node)` 在 `node.type === Comment` 时为 true，并把 `children` 收窄为 `string`。

```ts
import { isComment } from '@veltra/utils'
import { Comment, h } from 'vue'

isComment(h(Comment, 'note')) // true
```
