---
title: "UNodeRender - 节点渲染"
description: "把 VNode、VNode 数组或纯文本渲染出来；content 为 undefined 时回退默认插槽"
keywords:
  - UNodeRender
  - @veltra/desktop
  - node-render
  - NodeRender
  - 节点渲染
aliases: ["node-render", "UNodeRender", "NodeRender", "节点渲染"]
---
## 快速上手

```ts
import { UNodeRender } from '@veltra/desktop'
```

## 典型示例

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

## API 签名 / 类型定义

```ts
import type { VNode } from 'vue'

/** 虚拟dom渲染组件属性 */
export interface NodeRenderProps {
  content: null | undefined | Array<VNode> | VNode
}

/** 虚拟dom渲染暴露的属性和方法 */
export interface NodeRenderExposed {}
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
