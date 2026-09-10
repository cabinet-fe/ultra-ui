---
title: UNodeRender 节点渲染
description: 把 VNode、VNode 数组或原始值渲染为真实 DOM 的透传组件：content 是 VNode 时渲染并合并 attrs，是数组时逐项渲染，为 undefined 时回退默认插槽，用于配置驱动的动态内容渲染。
aliases: [NodeRender, node-render, VNode 渲染, 动态渲染, 节点渲染器]
keywords: [content, VNode, VNodeArrayChildren, h, isVNode, mergeProps, 动态渲染, 渲染 VNode, 插槽回退, attrs 合并, 配置驱动渲染]
---

# UNodeRender 节点渲染

`@veltra/desktop` 导出的透传渲染组件 `UNodeRender`：接收一个 `content` 属性，值为 VNode 时直接渲染（并把组件上的 attrs 合并进该节点）、值为 VNode 数组时逐项渲染、值为 `undefined` 时渲染默认插槽，用于把数据里携带的 VNode（如配置化表格的单元格节点）落到页面上。

## 快速上手

```vue
<script setup lang="ts">
import { UNodeRender } from '@veltra/desktop'
import { h } from 'vue'

// 数据来源是后端配置或上层逻辑生成的 VNode
const vnode = h('span', { class: 'label' }, '保存')
</script>

<template>
  <UNodeRender :content="vnode" />
  <!-- => <span class="label">保存</span> -->
</template>
```

## API 签名

```ts
/** 虚拟dom渲染组件属性 */
export interface NodeRenderProps {
  /** 待渲染内容：单个 VNode、VNode 数组、原始值，或 undefined（回退默认插槽） */
  content: null | undefined | Array<VNode> | VNode
}

/** 无暴露方法；模板 ref 上没有可调用的成员 */
export interface NodeRenderExposed {}
```

组件运行时按如下优先级处理 `content`：

1. `content === undefined`：渲染默认插槽；插槽也没有时渲染空白
2. `Array.isArray(content)`：数组原样作为子节点渲染（空数组渲染空白）
3. `isVNode(content)`：渲染该节点，并把组件上的 attrs（`class`、`style`、`data-*`、事件等）`mergeProps` 进节点的 props
4. 其余值（`string` / `number` / `boolean` / `null`）：按 Vue 规则原样输出；`null` 渲染为空白

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `content` | `null \| undefined \| Array<VNode> \| VNode` | `—` | 是 | 运行时也接受 `string` / `number` / `boolean` 并按文本输出；数组不做扁平化处理，直接交给 Vue 渲染 |

## 方法与事件

无事件、无暴露方法。唯一插槽是默认插槽，仅在 `content === undefined` 时渲染；`content` 为 `null`、空数组时插槽不生效。

## 典型示例

### VNode 数组与 attrs 合并

```vue
<script setup lang="ts">
import { UNodeRender } from '@veltra/desktop'
import { h } from 'vue'

const tags = [
  h('span', { class: 'tag' }, 'Vue'),
  h('span', { class: 'tag', style: 'color: green' }, 'TypeScript'),
  h('span', { class: 'tag', style: 'color: orange' }, 'Bun')
]

// attrs 会合并到这个 a 节点上：target 与 data-track 同时生效
const link = h('a', { class: 'my-link', target: '_blank' }, () => '前往')
</script>

<template>
  <UNodeRender :content="tags" />
  <!-- => 三个 .tag 依次渲染 -->

  <UNodeRender :content="link" style="color: red" data-track="nav" />
  <!-- => <a class="my-link" target="_blank" style="color: red" data-track="nav">前往</a> -->
</template>
```

### 配置驱动的字段渲染（含插槽回退）

```vue
<script setup lang="ts">
import { UNodeRender } from '@veltra/desktop'
import { h, ref } from 'vue'

interface Column {
  key: string
  /** 单元格渲染节点；后端配置场景下由上层生成 */
  render?: () => ReturnType<typeof h>
}

const columns = ref<Column[]>([
  { key: 'name', render: () => h('strong', 'Ultra UI') },
  { key: 'remark' } // 未配置 render，回退默认插槽
])

function cellNode(col: Column) {
  return col.render?.()
}
</script>

<template>
  <template v-for="col in columns" :key="col.key">
    <!-- render 未配置时 content 为 undefined → 渲染插槽内容 -->
    <UNodeRender :content="cellNode(col)">
      <span>默认文本</span>
    </UNodeRender>
  </template>
</template>
```

## 注意事项

> [!WARNING]
> - `content` 为 `undefined` 才回退默认插槽；`null` 与空数组都渲染空白，插槽不生效。
> - attrs 合并仅对单个 VNode 生效；`content` 是数组时组件上的 `class` / `style` 等不会传播给数组内节点。
> - 文本内容请直接传 `string`，组件原样输出；不要为纯文本构造 VNode。
> - 组件 `inheritAttrs: false`，attrs 不会出现在根元素上，而是进入 `content` 的 VNode props。
> - 本库导出名为 `UNodeRender`，不是 Vue 官方的 `render` 函数，也不是 `<component :is>`；需要按字符串组件名动态渲染时用 `<component :is>`，需要渲染 VNode 数据时用本组件。
