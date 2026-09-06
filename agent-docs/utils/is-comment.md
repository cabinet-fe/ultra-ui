---
title: isComment 判断 VNode 是否为 Vue 注释节点
description: Vue VNode 类型判断工具函数，检测传入节点是否为 Vue Comment 注释节点，用于插槽子元素清洗过滤与纯净节点提取
---

`isComment(node)` 在 `node.type === Comment` 时为 true，并把 `children` 收窄为 `string`。

```ts
import { isComment } from '@veltra/utils'
import { Comment, h } from 'vue'

isComment(h(Comment, 'note')) // true
```
