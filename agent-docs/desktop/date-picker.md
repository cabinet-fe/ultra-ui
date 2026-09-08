---
title: "UDatePicker - 日期选择器"
description: "用 UDatePicker 选择日/月/年，独立场景用 v-model，表单内用 field"
keywords:
  - UDatePicker
  - @veltra/desktop
  - date-picker
  - DatePicker
  - 日期选择器
aliases: ["date-picker", "UDatePicker", "DatePicker", "日期选择器"]
---

## 快速上手

```ts
import { UDatePicker } from '@veltra/desktop'
```

## 典型示例

`UDatePicker` 默认 `type="date"`、`data-type="string"`。`data-type` 还可为 `date`（原生 `Date`）或 `timestamp`（数字）；只有字符串模式才看 `value-format`。`format` 控制输入框展示。`disabled-date` 收到 `Dater` 与原始 `Date`。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { ref } from 'vue'

const joinDate = ref('2026-09-01')

function disabledDate(d: Dater) {
  return d.timestamp > Date.now()
}
</script>

<template>
  <u-date-picker v-model="joinDate" clearable :disabled-date="disabledDate" />
  <u-date-picker v-model="joinDate" type="month" />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ birthday: '', hiredAt: undefined as number | undefined })
</script>

<template>
  <u-form :model="form">
    <u-date-picker label="生日" field="birthday" />
    <u-date-picker label="入职时间戳" field="hiredAt" data-type="timestamp" />
  </u-form>
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  /** 是否必填 */
  required?: boolean | string
  /** 长度单位 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string] | string
  /** 预设 */
  preset?: PresetRule
  /** 自定义校验 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段 */
  field?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export interface Dater {
  year: number
  month: number
  date: number
  [key: string]: any
}

/** 绑定值类型 */
export type DatePickerDataType = 'date' | 'timestamp' | 'string'

/** date-picker组件属性 */
export interface DatePickerProps extends FormComponentProps {
  modelValue?: string | number | Date
  /** 占位 */
  placeholder?: string
  /** 日期类型 */
  type?: 'date' | 'month' | 'year'
  /** 日期格式化 */
  format?: string
  /** 日期值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /**
   * 绑定值的类型，默认为字符串。
   * 当 dataType 没有指定为字符串时，valueFormat 属性不生效
   */
  dataType?: DatePickerDataType
  /** 最小可选日期 */
  disabledDate?: (date: Dater, raw: Date) => boolean
  /** 是否显示清除按钮 */
  clearable?: boolean
}

/** date-picker组件定义的事件 */
export interface DatePickerEmits {
  (e: 'update:modelValue', value?: string | number | Date): void
  (e: 'change', date?: Date): void
}

/** date-picker组件暴露的属性和方法(组件内部使用) */
export interface _DatePickerExposed {}

/** date-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DatePickerExposed = DeconstructValue<_DatePickerExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
