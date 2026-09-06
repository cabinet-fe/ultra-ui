---
title: "UNumberInput - 数字输入框"
description: "数字输入、货币与步进，以及在 UForm 内用 field 绑定"
---

# UNumberInput - 数字输入框

## 引入

```ts
import { UNumberInput } from '@veltra/desktop'
```

## 示例

独立使用走 `v-model`（值为 `number`）；放进 `UForm` 时用 `field`，不要再写 `v-model`。`currency` 按 CNY 展示；`step` 为 `true` 或数字时显示累加按钮；`multiple` 把内部存储按倍数换算后展示。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const count = shallowRef(2.999)
const cents = shallowRef(12345)
</script>

<template>
  <u-number-input v-model="count" :min="0" :max="1000" :step="1" clearable />
  <u-number-input v-model="count" currency :precision="2" />
  <u-number-input v-model="cents" currency :multiple="100" suffix="元" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ age: 18, price: 0 })
</script>

<template>
  <u-form :model="form">
    <u-number-input label="年龄" field="age" :min="0" :max="150" :step="1" :rules="{ min: 0, max: 150 }" />
    <u-number-input label="单价" field="price" currency :precision="2" />
  </u-form>
</template>
```

## API / 类型

```ts
export interface InputProps extends FormComponentProps {
  /** modelValue */
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 前缀 */
  prefix?: string
  /** 后缀 */
  suffix?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 原生只读 */
  nativeReadonly?: boolean
  /**
   * 模式
   * @description 如果指定请保证有一个符合模式的默认值
   */
  pattern?: RegExp
}

/** 数字输入组件属性 */
export interface NumberInputProps extends Omit<InputProps, 'modelValue'> {
  modelValue?: number
  /** 是否为货币模式 */
  currency?: boolean
  /** 精度 */
  precision?: number
  /** 最小精度 */
  minPrecision?: number
  /** 最大精度 */
  maxPrecision?: number
  /** 步进, 指定为数字时开启累加按钮并将该值作为累加的步长, 为true则步长默认为1 */
  step?: boolean | number
  /** 最大值 */
  max?: number
  /** 最小值 */
  min?: number
  /** 倍数 */
  multiple?: number
}

/** 数字输入组件定义的事件 */
export interface NumberInputEmits {
  (event: 'update:modelValue', value?: number): void
  (event: 'change', value?: number): void
  (event: 'clear'): void
}

/** 数字输入组件暴露的属性和方法 */
export interface NumberInputExposed {}
```

## 避坑与使用要点

- 在 UForm 中必须使用 field，禁止 v-model。
