---
title: UDateRangePicker 日期范围选择器
description: "从 `@veltra/desktop` 导出的日期范围选择器：两个只读输入框以「至」相连，面板内两次点击选出起止日期（自动按先后排序），绑定值为 [start, end] 二元组，支持字符串、毫秒时间戳与 Date；放进 UForm 时用 `field` 绑定 model。"
aliases: [date-range-picker, u-date-range-picker, DateRangePicker, 日期范围选择器, 区间选择器]
keywords: [modelValue, DateRangeValue, "update:modelValue", change, type, format, valueFormat, dataType, disabledDate, clearable, placeholder, "select:range-date", 日期范围, 范围选择, 起止日期, 禁用日期, 时间戳, 清除]
---

# UDateRangePicker 日期范围选择器

`@veltra/desktop` 导出日期范围选择器 `UDateRangePicker`：两个只读输入框以「至」相连，点击后弹出范围选择面板（内嵌 `range` 模式的 `UDatePanel`），第一次点击选起点、第二次点击选终点并自动关闭；绑定值是 `[start, end]` 二元组，支持字符串 / 毫秒时间戳 / `Date` 三种元素类型，支持禁用日期与悬停清除。放进 `UForm` 时用 `field` 绑定。

四个日期组件的分工：一次选一段起止区间用 `UDateRangePicker`；只选一个日期 / 月份 / 年份用 `UDatePicker`；把范围面板直接铺在页面或自定义触发器用 `UDatePanel` 的 `range` 模式；仅按月展示日期网格用 `UCalendar`。

## 快速上手

```vue
<script setup lang="ts">
import { UDateRangePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const range = shallowRef<[string, string]>(['2026-03-01', '2026-03-15'])
</script>

<template>
  <u-date-range-picker v-model="range" />
</template>
```

独立使用走 `v-model`；放进 `<u-form>` 时必须改用 `field` 绑定，禁止再写 `v-model`。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 预设校验规则 */
export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

/** 字段校验规则（rules 属性的类型） */
export interface ValidateRule {
  /** 是否必填；传字符串时作为校验失败提示 */
  required?: boolean | string
  /** 长度；元组第二项为失败提示 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 正则匹配；string 为正则源，元组第二项为失败提示 */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则，取值见 PresetRule */
  preset?: PresetRule
  /** 自定义校验；返回非空字符串表示失败且该字符串为提示 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 组件通用属性 */
export interface ComponentProps {
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
}

/** 表单组件通用属性：label / field / rules / tips / span 仅在 UForm（或 UFormItem）内生效 */
export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    | number
    | 'full'
    | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段；有 field 时禁止再写 v-model */
  field?: string
  /** 是否禁用。组件 props > 表单 > 全局配置 > 默认 false */
  disabled?: boolean
  /** 是否只读。组件 props > 表单 > 全局配置 > 默认 false */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

/** @cat-kit/core 的日期对象；disabledDate 回调第一参，常用其 timestamp（毫秒数）与 raw（原生 Date）成员 */
export interface Dater {
  year: number
  month: number
  date: number
  [key: string]: any
}

/** 绑定值类型 */
export type DateRangePickerDataType = 'date' | 'timestamp' | 'string'

/** 日期范围绑定值：两端元素类型一致，随 dataType 决定 */
export type DateRangeValue = [string, string] | [number, number] | [Date, Date]

/** 日期范围选择器属性 */
export interface DateRangePickerProps extends FormComponentProps {
  /** 选中范围；元素类型随 dataType：'string' 为格式化字符串、'timestamp' 为毫秒数、'date' 为原生 Date */
  modelValue?: DateRangeValue
  /** 两个输入框的占位符。默认 ['起始日期', '结束日期'] */
  placeholder?: [string, string]
  /** 选择粒度：日 / 月 / 年。默认 'date' */
  type?: 'date' | 'month' | 'year'
  /** 输入框显示格式；默认随 type：'yyyy-MM-dd' | 'yyyy-MM' | 'yyyy' */
  format?: string
  /** 值格式：仅 dataType 为 'string'（默认）时生效；未指定时复用 format */
  valueFormat?: string
  /** 绑定值类型。默认 'string' */
  dataType?: DateRangePickerDataType
  /** 禁用日期：返回 true 的日期在面板中不可选；date 为 Dater，raw 为原生 Date */
  disabledDate?: (date: Dater, raw: Date) => boolean
  /** 是否显示清除按钮。默认 true */
  clearable?: boolean
}

export interface DateRangePickerEmits {
  /** 第二次点击完成选择或清除时触发；清除时 value 为 undefined */
  (e: 'update:modelValue', value?: DateRangeValue): void
  /** 与 update:modelValue 同步触发；payload 为两端的原生 Date 元组，清除时为 undefined */
  (e: 'change', dates?: [Date, Date]): void
}

/** 组件 ref 暴露成员：无（DateRangePickerExposed 为空对象，ref 上无可调用的方法或属性） */
export interface DateRangePickerExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model` / `modelValue` | `DateRangeValue` | `undefined` | 否 | 必须是长度为 2 的数组且两端都能解析；任一端解析失败或长度不为 2 时整体按未选择处理 |
| `type` | `'date' \| 'month' \| 'year'` | `'date'` | 否 | 选择粒度：日 / 月 / 年；本库无周（week）粒度 |
| `format` | `string` | 随 `type`：`'yyyy-MM-dd'` / `'yyyy-MM'` / `'yyyy'` | 否 | 两个输入框的显示格式 |
| `valueFormat` | `string` | 复用 `format` | 否 | 仅 `dataType="string"` 时生效：决定提交的字符串格式，并用于解析传入字符串 |
| `dataType` | `'string' \| 'date' \| 'timestamp'` | `'string'` | 否 | 绑定值元素类型；非 `'string'` 时 `valueFormat` 不生效 |
| `disabledDate` | `(date: Dater, raw: Date) => boolean` | — | 否 | 返回 `true` 的日期不可选 |
| `clearable` | `boolean` | `true` | 否 | 悬停 + 已有值 + 非禁用时显示清除图标 |
| `placeholder` | `[string, string]` | `['起始日期', '结束日期']` | 否 | 二元组，依次对应起点、终点输入框 |
| `field` | `string` | — | 否 | 表单内生效。绑定 `<u-form :model>` 的字段；有 `field` 禁止再写 `v-model` |
| `label` | `string` | — | 否 | 表单内生效。表单标签文字 |
| `rules` | `ValidateRule` | — | 否 | 表单内生效。结构见 `## API 签名` 的 `ValidateRule` |
| `tips` | `string` | — | 否 | 表单内生效。表单项提示文案 |
| `span` | `number \| 'full' \| 按 BreakpointName 的对象` | — | 否 | 表单内生效。`'full'` 占满一行；对象形态必须含 `default` 键 |
| `size` | `ComponentSize` | `'default'` | 否 | `'small' \| 'default' \| 'large'`；优先级：组件 props > 表单 > 全局配置 > 默认 |
| `disabled` | `boolean` | `false` | 否 | 禁用后不可弹出面板、不可清除；优先级同 `size` |
| `readonly` | `boolean` | `false` | 否 | `true` 时渲染为纯文本「起 至 止」（空端显示 `-`），不渲染下拉 |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `DateRangeValue \| undefined` | 第二次点击完成选择时按 `dataType` 提交 `[start, end]`：`'string'` → 按 `valueFormat ?? format` 格式化的字符串；`'timestamp'` → 毫秒数；`'date'` → 原生 `Date`；点击清除时为 `undefined` |
| `change` | `[Date, Date] \| undefined` | 与 `update:modelValue` 同步触发；payload 始终是两端的原生 `Date` 元组，清除时为 `undefined` |

组件 `ref` 无暴露成员。两个输入框均原生只读，禁止键入；第一次点击记起点（悬停实时预览区间），第二次点击提交并关闭下拉，先后顺序由面板自动排序（先点结束日期也会得到 `[start, end]`）。

## 典型示例

### 基础范围选择与 change

```vue
<script setup lang="ts">
import { UDateRangePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const range = shallowRef<[string, string]>()

function handleChange(dates?: [Date, Date]) {
  // payload 是两端的原生 Date
  console.log(dates?.length === 2) // => true
}
</script>

<template>
  <!-- 两个输入框的占位符可用 placeholder 二元组自定义 -->
  <u-date-range-picker
    v-model="range"
    :placeholder="['入住日期', '离店日期']"
    @change="handleChange"
  />
</template>
```

### 时间戳绑定并禁用过去日期

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { UDateRangePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const range = shallowRef<[number, number]>()

// 返回 true 的日期不可选；Dater 用 timestamp 取毫秒数
function disabledDate(d: Dater) {
  return d.timestamp <= Date.now()
}
</script>

<template>
  <u-date-range-picker
    v-model="range"
    data-type="timestamp"
    :disabled-date="disabledDate"
  />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { UDateRangePicker, UForm } from '@veltra/desktop'
import { reactive } from 'vue'

const form = reactive({
  period: undefined as [string, string] | undefined
})
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model；label/rules/tips/span 此处才生效 -->
  <u-form :model="form">
    <u-date-range-picker
      label="统计区间"
      field="period"
      tips="选择起止日期"
      :rules="{ required: '请选择统计区间' }"
    />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；独立使用时才用 `v-model`。
> - `label` / `field` / `rules` / `tips` / `span` 仅在 `UForm`（或 `UFormItem` 包裹）内生效，独立使用时传入无效。
> - `modelValue` 必须是长度为 2 的数组且两端都能解析，否则整体按未选择处理（面板不回显、显示占位符），不抛错。
> - `change` 的 payload 是两端原生 `Date` 的元组 `[Date, Date]`，与 `dataType` 无关；清除时 `update:modelValue` 与 `change` 都收到 `undefined`。
> - `placeholder` 是二元组 `[起点占位, 终点占位]`，不是单个字符串。
> - `valueFormat` 仅在 `dataType="string"`（默认）时生效；`dataType` 为 `'date'` / `'timestamp'` 时该属性被忽略。
> - `disabledDate` 的第一个参数是 `@cat-kit/core` 的 `Dater`（用 `d.timestamp` 取毫秒数），第二个参数才是原生 `Date`。
> - 选择粒度是 `type: 'date' | 'month' | 'year'`，本库没有周（week）粒度；先点结束日期时面板自动交换顺序，提交值始终 `[start, end]`。
> - `readonly` 是把整个组件渲染为纯文本「起 至 止」（空端显示 `-`），不渲染下拉。
> - 独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 传入了数组但面板不回显

`modelValue` 解析要求：长度为 2，且两端都能按 `valueFormat`（`dataType="string"` 时）或默认规则解析成功。任一条件不满足即按空处理。核对数组长度与字符串格式（如 `valueFormat="yyyyMMdd"` 对应 `['20260301', '20260315']`）。

### 设了 `valueFormat` 但提交值不是该格式

`valueFormat` 仅在 `dataType="string"`（默认）时生效；`data-type="date"` / `data-type="timestamp"` 模式下绑定值分别是 `Date` 与毫秒数，不存在格式串。
