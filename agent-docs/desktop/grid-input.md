---
title: "UGridInput - 网格输入框"
description: "分格数字输入，可配置长度、分隔符与是否允许 0"
keywords:
  - UGridInput
  - @veltra/desktop
  - grid-input
  - GridInput
  - 网格输入框
aliases: ["grid-input", "UGridInput", "GridInput", "网格输入框"]
---
## 快速上手

```ts
import { UGridInput } from '@veltra/desktop'
```

## 典型示例

`UGridInput` 不是表单控件（没有 `field`），用 `v-model` 绑定字符串。默认 6 格、分隔符 `-`、不可输入 0。`zero` 为 `true` 时允许 0–9（验证码）；组织编码等场景保持默认，每位只能是 1–9。暴露 `clear()`。

```vue
<script setup lang="ts">
import type { GridInputExposed } from '@veltra/desktop'
import { shallowRef, useTemplateRef } from 'vue'

const code = shallowRef('')
const otp = shallowRef('')
const inputRef = useTemplateRef<GridInputExposed>('input')

function handleClear() {
  inputRef.value?.clear()
  otp.value = ''
}
</script>

<template>
  <u-grid-input v-model="code" />
  <u-grid-input ref="input" v-model="otp" :length="6" :zero="true" separator="" />
  <u-button @click="handleClear">清空验证码</u-button>
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 网格输入框组件属性 */
export interface GridInputProps {
  modelValue?: string
  /** 格子数量 */
  length?: number
  /**
   * 是否允许输入 0
   * @description 验证码场景通常开启；组织编码结构等场景关闭（如 3-3-2）
   * @default false
   */
  zero?: boolean
  /** 格子之间的分隔符 */
  separator?: string
}

/** 网格输入框组件定义的事件 */
export interface GridInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
}

/** 网格输入框组件暴露的属性和方法(组件内部使用) */
export interface _GridInputExposed {
  clear: () => void
}

/** 网格输入框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GridInputExposed = DeconstructValue<_GridInputExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
