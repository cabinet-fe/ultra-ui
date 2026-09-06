---
title: "getHighlightChunks - 搜索关键词文本分词与高亮片段提取"
description: "文本处理工具函数，根据搜索关键字将长字符串分割为普通文本与高亮文本片段数组，保留原文本大小写，用于下拉选择器、搜索框、自动补全与表格中匹配关键字的高亮渲染"
keywords: ["getHighlightChunks", "@veltra/utils", "get-highlight-chunks", "搜索关键词文本分词与高亮片段提取"]
aliases: ["get-highlight-chunks", "getHighlightChunks", "搜索关键词文本分词与高亮片段提取"]
---
## 快速上手

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

