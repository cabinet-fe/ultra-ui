---
title: "UNumber - 数字展示"
description: "展示数字，支持货币 / 百分比 / 十进制格式与补间动画"
---

# UNumber - 数字展示

## 引入

```ts
import { UNumber } from '@veltra/desktop'
```

## 示例

`UNumber` 是展示组件，用 `value` 传入数字，不是表单控件。`format` 为 `currency`（CNY）、`percent` 或 `decimal`（默认）。`tween` 开启补间，`duration` 默认 800。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const amount = ref(1000)
</script>

<template>
  <u-number :value="amount" format="currency" :min-precision="1" />
  <u-number :value="0.856" format="percent" />
  <u-number :value="amount" tween format="currency" />
  <u-button type="primary" @click="amount += 1000">+1000</u-button>
</template>
```

## API / 类型

```ts
/** 数字组件属性 */
export interface NumberProps {
  /** 数字数值 */
  value: number
  /**
   * 格式化。
   * currency: 货币； percent：百分比; decimal 默认十进制
   */
  format?: 'currency' | 'percent' | 'decimal'
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /**
   * 开启补间动画
   * @default false
   */
  tween?: boolean
  /** 动画持续时间 */
  duration?: number
  /** 精度 */
  precision?: number
  /** 最大精度 */
  maxPrecision?: number
  /** 最小精度 */
  minPrecision?: number
}

/** 数字组件定义的事件 */
export interface NumberEmits {}

/** 数字组件暴露的属性和方法 */
export interface NumberExposed {}
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
