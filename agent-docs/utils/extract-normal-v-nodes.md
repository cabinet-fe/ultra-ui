---
title: extractNormalVNodes
description: 展开 Fragment 与 template，抽出常规 VNode 列表
---

`extractNormalVNodes(nodes, results?)` 遍历 `VNodeArrayChildren`：

- `Fragment` 或 `template` 且 `children` 为数组时递归展开
- 字符串 / 数字会转成文本 VNode
- 其余合法 VNode（含注释、文本节点）原样收集
- 其它非 VNode 忽略

第二个参数可传入累加数组；默认新建空数组。返回收集结果。

```ts
import { extractNormalVNodes } from '@veltra/utils'
import { Fragment, h } from 'vue'

const nodes = extractNormalVNodes([h(Fragment, [h('span', 'a'), h('span', 'b')]), 'plain', 1])
```
