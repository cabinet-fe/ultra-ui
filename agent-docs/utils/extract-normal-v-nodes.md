---
title: "extractNormalVNodes - 拍平插槽并提取常规真实 VNode 节点"
description: "Vue 虚拟 DOM 处理工具函数，递归解包展开 Vue Fragment 与 template 包装节点，过滤注释并提取扁平的常规 VNode 数组，适用于插槽子组件遍历分析与组件属性透传"
keywords:
  - extractNormalVNodes
  - @veltra/utils
  - extract-normal-v-nodes
  - 拍平插槽并提取常规真实
  - 节点
aliases: ["extract-normal-v-nodes", "extractNormalVNodes"]
---

## 快速上手

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
