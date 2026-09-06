---
title: "UCheckTag - 可选标签"
description: "可切换选中态的标签，用 v-model 或 checked 控制"
keywords:
  - UCheckTag
  - @veltra/desktop
  - check-tag
  - CheckTag
  - 可选标签
aliases: ["check-tag", "UCheckTag", "CheckTag", "可选标签"]
---
## 快速上手

```ts
import { UCheckTag } from '@veltra/desktop'
```

## 典型示例

`UCheckTag` 不是表单控件（没有 `field`）。选中态优先读 `modelValue`，否则读 `checked`。点击时 emit `update:modelValue`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const vue = ref(true)
const react = ref(false)
</script>

<template>
  <u-check-tag v-model="vue">Vue</u-check-tag>
  <u-check-tag v-model="react">React</u-check-tag>
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** check-tag组件属性 */
export interface CheckTagProps {
  modelValue?: boolean

  checked?: boolean
}

/** check-tag组件定义的事件 */
export interface CheckTagEmits {
  (e: 'update:modelValue', value: boolean): void
}

/** check-tag组件暴露的属性和方法(组件内部使用) */
export interface _CheckTagExposed {}

/** check-tag组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CheckTagExposed = DeconstructValue<_CheckTagExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
