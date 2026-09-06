---
title: getHighlightChunks
description: 按关键字拆分字符串，标出需要高亮的片段
---

`getHighlightChunks(str, substrings)` 把 `str` 按 `substrings` 中的关键字（忽略大小写）切开，返回 `{ text: string; highlight: boolean }[]`。空串会被丢掉；关键字会 `trim` 并转义正则特殊字符。返回类型未单独导出。

```ts
import { getHighlightChunks } from '@veltra/utils'
import { createTextVNode, h } from 'vue'

const chunks = getHighlightChunks('Hello Vue', ['vue'])
// [{ text: 'Hello ', highlight: false }, { text: 'Vue', highlight: true }]

const nodes = chunks.map((chunk) =>
  chunk.highlight ? h('mark', chunk.text) : createTextVNode(chunk.text)
)
```
