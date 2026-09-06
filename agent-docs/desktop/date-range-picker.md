---
title: "UDateRangePicker - 日期范围选择器"
description: "用 UDateRangePicker 选择起止日期，绑定值为二元组"
keywords:
  - UDateRangePicker
  - @veltra/desktop
  - date-range-picker
  - DateRangePicker
  - 日期范围选择器
aliases: ["date-range-picker", "UDateRangePicker", "DateRangePicker", "日期范围选择器"]
---
## 快速上手

```ts
import { UDateRangePicker } from '@veltra/desktop'
```

## 典型示例

`UDateRangePicker` 的 `modelValue` 是 `[start, end]`，元素类型随 `data-type`：默认字符串，也可为 `Date` 或时间戳。占位默认为 `['起始日期', '结束日期']`。`type` 同样支持 `date` / `month` / `year`。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const range = ref<[string, string]>(['2026-03-01', '2026-03-15'])
</script>

<template>
  <u-date-range-picker v-model="range" clearable />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ period: undefined as [string, string] | undefined })
</script>

<template>
  <u-form :model="form">
    <u-date-range-picker label="统计区间" field="period" />
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
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
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
export type DateRangePickerDataType = 'date' | 'timestamp' | 'string'

/** 日期范围绑定值 */
export type DateRangeValue = [string, string] | [number, number] | [Date, Date]

/** date-range-picker组件属性 */
export interface DateRangePickerProps extends FormComponentProps {
  modelValue?: DateRangeValue
  /** 占位 */
  placeholder?: [string, string]
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
  dataType?: DateRangePickerDataType
  /** 最小可选日期 */
  disabledDate?: (date: Dater, raw: Date) => boolean
  /** 是否显示清除按钮 */
  clearable?: boolean
}

/** date-range-picker组件定义的事件 */
export interface DateRangePickerEmits {
  (e: 'update:modelValue', value?: DateRangeValue): void
  (e: 'change', dates?: [Date, Date]): void
}

/** date-range-picker组件暴露的属性和方法(组件内部使用) */
export interface _DateRangePickerExposed {}

/** date-range-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DateRangePickerExposed = DeconstructValue<_DateRangePickerExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
