---
title: "UProgressNodes - 进度节点"
description: "用 UProgressNodes 展示可点击的水平进度节点"
---

# UProgressNodes - 进度节点

## 引入

```ts
import { UProgressNodes } from '@veltra/desktop'
```

## 示例

`UProgressNodes` 的 `nodes` 必填。默认用 `label` / `value`。`check` 决定节点是否标记为已完成；不传则只靠 `v-model` 高亮当前项。`color-type` 默认 `primary`。节点过多时用 `max-width` 出现横向滚动。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref('review')
const nodes = [
  { value: 'draft', label: '起草' },
  { value: 'review', label: '审核' },
  { value: 'done', label: '完成' }
]
const done = new Set(['draft', 'review'])

function isChecked(node: Record<string, any>) {
  return done.has(node.value)
}
</script>

<template>
  <u-progress-nodes
    v-model="current"
    :nodes="nodes"
    :check="isChecked"
    color-type="primary"
    max-width="520px"
  />
</template>
```

## API / 类型

```ts
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 进度节点组件属性 */
export interface ProgressNodesProps {
  /** 当前选中节点的值 */
  modelValue?: string | number
  /** 节点列表 */
  nodes: Record<string, any>[]
  /** 检查节点是否选中的函数 */
  check?: (node: Record<string, any>, index: number) => boolean
  /** 高亮颜色类型 */
  colorType?: ColorType
  /** 最大宽度（用于水平方向滚动） */
  maxWidth?: number | string
  /** 标签键名 */
  labelKey?: string
  /** 值键名 */
  valueKey?: string
}

/** 进度节点组件定义的事件 */
export interface ProgressNodesEmits {
  /** 点击节点时触发 */
  (e: 'click', node: Record<string, any>, index: number): void
  /** 更新选中值时触发 */
  (e: 'update:modelValue', value: string | number): void
}

/** 进度节点组件暴露的属性和方法(组件内部使用) */
export interface _ProgressNodesExposed {}

/** 进度节点组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressNodesExposed = DeconstructValue<_ProgressNodesExposed>
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
