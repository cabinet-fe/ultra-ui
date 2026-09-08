---
title: "USteps - 步骤条"
description: "步骤条用 items 与 current，默认按索引，也可用 current-key 对字段"
keywords:
  - USteps
  - @veltra/desktop
  - steps
  - Steps
  - 步骤条
aliases: ["steps", "USteps", "Steps", "步骤条"]
---

## 快速上手

```ts
import { USteps } from '@veltra/desktop'
```

## 典型示例

`items` 必填。默认用数组下标当步骤值，`label` 为展示文案（可用 `label-key` 改字段名）。`v-model:current` 控制当前步；指定 `current-key` 后，`current` 去匹配该项上的该字段，而不是下标。`direction` 为 `horizontal`（默认）或 `vertical`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref(1)

const items = [{ label: '填写资料' }, { label: '上传附件' }, { label: '提交审核' }]
</script>

<template>
  <u-steps v-model:current="current" :items="items" />
</template>
```

`item-click` 的参数是 `(item, index)`。若步骤用业务 id 而不是下标：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref('upload')

const items = [
  { id: 'form', label: '填写资料' },
  { id: 'upload', label: '上传附件' },
  { id: 'review', label: '提交审核' }
]
</script>

<template>
  <u-steps v-model:current="current" current-key="id" :items="items" />
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 步骤组件组件属性 */
export interface StepsProps {
  /**
   * 当前步骤项，默认为步骤的索引
   */
  current?: string | number
  /**
   * 尺寸
   */
  size?: ComponentSize
  /**
   * 步骤项
   */
  items: Record<string, any>[]
  /** 步骤项标签键 */
  labelKey?: string
  /**
   * 当前步骤项键
   * @description
   * 如果指定，则current的值会作为items中的键值来获取当前步骤项
   */
  currentKey?: string
  /**
   * 方向
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical'

  /** 居中对齐 */
  alignCenter?: boolean

  /**
   * 当前步骤项颜色类型
   */
  currentStepType?: ColorType
  /**
   * 已完成项步骤颜色类型
   * @default 'success'
   */
  finishedStepType?: ColorType
}

/** 步骤项插槽作用域 */
export interface StepsSlotScope {
  item: Record<string, any>
  index: number
}

/** 步骤组件组件定义的事件 */
export interface StepsEmits {
  /**
   * 当前步骤项变更
   */
  (e: 'update:current', value?: string | number): void
  /**
   * 步骤项点击事件
   */
  (e: 'item-click', item: Record<string, any>, index: number): void
}

/** 步骤组件组件暴露的属性和方法(组件内部使用) */
export interface _StepsExposed {}

/** 步骤组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type StepsExposed = DeconstructValue<_StepsExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
