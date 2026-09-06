---
title: "UCalendar - 日历"
description: "用 UCalendar 按 v-model 日期字符串展示当月日历格"
keywords:
  - UCalendar
  - @veltra/desktop
  - calendar
  - Calendar
  - 日历
aliases: ["calendar", "UCalendar", "Calendar", "日历"]
---
## 快速上手

```ts
import { UCalendar } from '@veltra/desktop'
```

## 典型示例

`UCalendar` 根据 `v-model` 的日期字符串（或未绑定时的当天）画出该月日历。它只负责展示，没有选日回调；需要选择日期请用 `UDatePicker` 或 `UDatePanel`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const month = ref('2026-09-01')
</script>

<template>
  <u-calendar v-model="month" />
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export interface Dater {
  year: number
  month: number
  date: number
  [key: string]: any
}

/** day接口 */
export interface CalendarDay {
  date: Dater
  /** 是否今日 */
  isToday?: boolean
  /** 日期类型：上月， 本月， 下月 */
  type: 'pre' | 'current' | 'next'
  /** 是否禁止选择 */
  disabled?: boolean
}

export interface CalendarMonth {
  date: Dater
  /** 是否禁止选择 */
  disabled?: boolean
  /** 年月标识 */
  key: string
  /** 月份 */
  month: number
}

export interface CalendarYear {
  date: Dater
  /** 是否禁止选择 */
  disabled?: boolean
  /** 年份 */
  year: number
}

/** 日历组件属性 */
export interface CalendarProps {
  modelValue?: string
}

/** 日历组件定义的事件 */
export interface CalendarEmits {
  (e: 'update:modelValue', value: string): void
}

/** 日历组件暴露的属性和方法(组件内部使用) */
export interface _CalendarExposed {}

/** 日历组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CalendarExposed = DeconstructValue<_CalendarExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
