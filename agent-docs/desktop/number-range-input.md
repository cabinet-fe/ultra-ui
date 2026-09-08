---
title: "UNumberRangeInput - 数字范围输入框"
description: "数字区间输入，可用元组或 start/end，以及在 UForm 内用 field 绑定"
keywords:
  - UNumberRangeInput
  - @veltra/desktop
  - number-range-input
  - NumberRangeInput
  - 数字范围输入框
aliases: ["number-range-input", "UNumberRangeInput", "NumberRangeInput", "数字范围输入框"]
---

## 快速上手

```ts
import { UNumberRangeInput } from '@veltra/desktop'
```

## 典型示例

`modelValue` 类型是 `[number | undefined, number | undefined]`，也可用 `v-model:start` / `v-model:end`。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import type { NumberRangeTuple } from '@veltra/desktop'
import { ref } from 'vue'

const range = ref<NumberRangeTuple>([10, 80])
const start = ref<number | undefined>(5)
const end = ref<number | undefined>(20)
</script>

<template>
  <u-number-range-input
    v-model="range"
    :min="0"
    :max="100"
    :step="5"
    start-placeholder="最小"
    end-placeholder="最大"
    separator="至"
  />
  <u-number-range-input v-model:start="start" v-model:end="end" separator="至" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ scoreRange: [0, 100] as [number, number] })

function validateScoreRange(val: [number, number] | undefined) {
  if (!val?.length) return ''
  const [min, max] = val
  if (min != null && max != null && min > max) return '最低分不能高于最高分'
  return ''
}
</script>

<template>
  <u-form :model="form">
    <u-number-range-input
      label="分数区间"
      field="scoreRange"
      :min="0"
      :max="100"
      :rules="{ validator: validateScoreRange }"
      start-placeholder="最低分"
      end-placeholder="最高分"
    />
  </u-form>
</template>
```

## API 签名 / 类型定义

```ts
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

/** 数字范围 [起始, 结束] */
export type NumberRangeTuple = [number | undefined, number | undefined]

/** 数字范围输入组件属性 */
export interface NumberRangeInputProps extends Omit<
  NumberInputProps,
  'modelValue' | 'placeholder'
> {
  modelValue?: NumberRangeTuple
  /** 与 `modelValue[0]` 同步，可用 `v-model:start` */
  start?: number
  /** 与 `modelValue[1]` 同步，可用 `v-model:end` */
  end?: number
  /** 左侧占位 */
  startPlaceholder?: string
  /** 右侧占位 */
  endPlaceholder?: string
  /** 中间分隔文案 */
  separator?: string
}

/** 数字范围输入组件事件 */
export interface NumberRangeInputEmits {
  (event: 'update:modelValue', value: NumberRangeTuple): void
  (event: 'update:start', value: number | undefined): void
  (event: 'update:end', value: number | undefined): void
  (event: 'change', value: NumberRangeTuple): void
}

/** 数字范围输入组件暴露 */
export interface NumberRangeInputExposed {}
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
