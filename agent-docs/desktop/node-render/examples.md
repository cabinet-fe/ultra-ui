---
title: UNodeRender 节点渲染示例
description: 把 VNode、VNode 数组或纯文本渲染出来；content 为 undefined 时回退默认插槽
---

`UNodeRender` 的 `content` 可以是单个 VNode、VNode 数组，或文本 / 数字 / 布尔。`content === undefined` 时渲染默认插槽。传入单个 VNode 时会把组件上的 attrs 合并进该节点。

```vue
<script setup lang="ts">
import { h, shallowRef } from 'vue'

const vnode = h('span', { class: 'label' }, '保存')
const tags = [h('span', 'Vue'), h('span', 'TypeScript')]
const fallback = shallowRef<undefined>(undefined)
</script>

<template>
  <u-node-render :content="vnode" />
  <u-node-render :content="tags" />
  <u-node-render :content="fallback">
    <span>暂无内容</span>
  </u-node-render>
</template>
```
