---
title: UDatePicker 日期选择器
description: "从 `@veltra/desktop` 导出的日期选择器：只读输入框点击弹出日 / 月 / 年选择面板，绑定值支持字符串、毫秒时间戳与 Date，支持禁用日期与清除；放进 UForm 时用 `field` 绑定 model 并按 `rules` 校验。"
aliases: [date-picker, u-date-picker, DatePicker, 日期选择器, 日期输入框]
keywords: [modelValue, "update:modelValue", change, type, format, valueFormat, dataType, DatePickerDataType, disabledDate, clearable, Dater, 日期选择, 月份选择, 年份选择, 禁用日期, 时间戳, 清除, 占位符]
---

# UDatePicker 日期选择器

`@veltra/desktop` 导出日期选择器 `UDatePicker`：只读输入框，点击后弹出下拉日期面板（内嵌 `UDatePanel`），选中后自动关闭；支持日 / 月 / 年三种粒度、字符串 / 毫秒时间戳 / `Date` 三种绑定值类型、禁用日期与悬停清除。放进 `UForm` 时用 `field` 绑定。

四个日期组件的分工：表单里选单个日期 / 月份 / 年份用 `UDatePicker`；一次选一段区间用 `UDateRangePicker`；把面板直接铺在页面或自定义触发器用 `UDatePanel`；仅按月展示日期网格用 `UCalendar`。

## 快速上手

```vue
<script setup lang="ts">
import { UDatePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const birthday = shallowRef('2026-09-01')
</script>

<template>
  <u-date-picker v-model="birthday" placeholder="选择生日" />
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
export type DatePickerDataType = 'date' | 'timestamp' | 'string'

/** 日期选择器属性 */
export interface DatePickerProps extends FormComponentProps {
  /** 选中值；实际类型随 dataType：'string' 为格式化字符串、'timestamp' 为毫秒数、'date' 为原生 Date */
  modelValue?: string | number | Date
  /** 占位符。默认 '选择日期' */
  placeholder?: string
  /** 选择粒度：日 / 月 / 年。默认 'date' */
  type?: 'date' | 'month' | 'year'
  /** 输入框显示格式；默认随 type：'yyyy-MM-dd' | 'yyyy-MM' | 'yyyy' */
  format?: string
  /** 值格式：仅 dataType 为 'string'（默认）时生效；未指定时复用 format */
  valueFormat?: string
  /** 绑定值类型。默认 'string' */
  dataType?: DatePickerDataType
  /** 禁用日期：返回 true 的日期在面板中不可选；date 为 Dater，raw 为原生 Date */
  disabledDate?: (date: Dater, raw: Date) => boolean
  /** 是否显示清除按钮。默认 true */
  clearable?: boolean
}

export interface DatePickerEmits {
  /** 选中或清除时触发；清除时 value 为 undefined */
  (e: 'update:modelValue', value?: string | number | Date): void
  /** 选中或清除时触发；payload 为选中日期的原生 Date，清除时为 undefined */
  (e: 'change', date?: Date): void
}

/** 组件 ref 暴露成员：无（DatePickerExposed 为空对象，ref 上无可调用的方法或属性） */
export interface DatePickerExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model` / `modelValue` | `string \| number \| Date` | `undefined` | 否 | 实际类型随 `dataType`；字符串须能按 `valueFormat` 或默认规则解析，解析失败按空处理 |
| `type` | `'date' \| 'month' \| 'year'` | `'date'` | 否 | 选择粒度：日 / 月 / 年；本库无周（week）粒度 |
| `format` | `string` | 随 `type`：`'yyyy-MM-dd'` / `'yyyy-MM'` / `'yyyy'` | 否 | 输入框显示格式 |
| `valueFormat` | `string` | 复用 `format` | 否 | 仅 `dataType="string"` 时生效：决定提交的字符串格式，并用于解析传入字符串 |
| `dataType` | `'string' \| 'date' \| 'timestamp'` | `'string'` | 否 | 绑定值类型；非 `'string'` 时 `valueFormat` 不生效 |
| `disabledDate` | `(date: Dater, raw: Date) => boolean` | — | 否 | 返回 `true` 的日期不可选 |
| `clearable` | `boolean` | `true` | 否 | 清除图标显示条件：悬停 + 有值 + 非禁用 |
| `placeholder` | `string` | `'选择日期'` | 否 | — |
| `field` | `string` | — | 否 | 表单内生效。绑定 `<u-form :model>` 的字段；有 `field` 禁止再写 `v-model` |
| `label` | `string` | — | 否 | 表单内生效。表单标签文字 |
| `rules` | `ValidateRule` | — | 否 | 表单内生效。结构见 `## API 签名` 的 `ValidateRule` |
| `tips` | `string` | — | 否 | 表单内生效。表单项提示文案 |
| `span` | `number \| 'full' \| 按 BreakpointName 的对象` | — | 否 | 表单内生效。`'full'` 占满一行；对象形态必须含 `default` 键 |
| `size` | `ComponentSize` | `'default'` | 否 | `'small' \| 'default' \| 'large'`；优先级：组件 props > 表单 > 全局配置 > 默认 |
| `disabled` | `boolean` | `false` | 否 | 禁用后不可弹出面板、不可清除；优先级同 `size` |
| `readonly` | `boolean` | `false` | 否 | `true` 时整个组件渲染为纯文本（空值显示 `-`），不渲染下拉 |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `string \| number \| Date \| undefined` | 面板中选中日期时按 `dataType` 提交：`'string'` → 按 `valueFormat ?? format` 格式化的字符串；`'timestamp'` → 毫秒数；`'date'` → 原生 `Date`；点击清除时为 `undefined` |
| `change` | `Date \| undefined` | 与 `update:modelValue` 同步触发；payload 始终是选中日期的原生 `Date`，清除时为 `undefined` |

组件 `ref` 无暴露成员。输入框原生只读，禁止键入，只能通过面板选择；选中后下拉自动关闭。

## 典型示例

### 三种粒度与自定义显示格式

```vue
<script setup lang="ts">
import { UDatePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const day = shallowRef('2026-09-01')
const month = shallowRef('2026-09')
const year = shallowRef('2026')
</script>

<template>
  <!-- type 默认 'date'，默认格式 yyyy-MM-dd -->
  <u-date-picker v-model="day" />
  <!-- 月粒度：默认格式 yyyy-MM，面板直接呈现 12 个月 -->
  <u-date-picker v-model="month" type="month" />
  <!-- 年粒度：默认格式 yyyy，面板一次显示 10 年 -->
  <u-date-picker v-model="year" type="year" />
  <!-- 自定义显示格式；v-model 提交的字符串同为该格式 -->
  <u-date-picker v-model="day" format="yyyy年MM月dd日" />
</template>
```

### 时间戳绑定、禁用过去日期与 change

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { UDatePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const joinAt = shallowRef<number>()

// 返回 true 的日期不可选；Dater 用 timestamp 取毫秒数
function disabledDate(d: Dater) {
  return d.timestamp <= Date.now()
}

function handleChange(d?: Date) {
  // change 的 payload 始终是原生 Date，与 dataType 无关
  console.log(d instanceof Date) // => true
}
</script>

<template>
  <u-date-picker
    v-model="joinAt"
    data-type="timestamp"
    :disabled-date="disabledDate"
    @change="handleChange"
  />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { UDatePicker, UForm } from '@veltra/desktop'
import { reactive } from 'vue'

const form = reactive({
  birthday: '',
  hiredAt: undefined as number | undefined
})
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model；label/rules/tips/span 此处才生效 -->
  <u-form :model="form">
    <u-date-picker
      label="生日"
      field="birthday"
      tips="请选择出生日期"
      :rules="{ required: '请选择生日' }"
    />
    <u-date-picker label="入职时间" field="hiredAt" data-type="timestamp" />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；独立使用时才用 `v-model`。
> - `label` / `field` / `rules` / `tips` / `span` 仅在 `UForm`（或 `UFormItem` 包裹）内生效，独立使用时传入无效。
> - `valueFormat` 仅在 `dataType="string"`（默认）时生效；`dataType` 为 `'date'` / `'timestamp'` 时该属性被忽略。
> - `disabledDate` 的第一个参数是 `@cat-kit/core` 的 `Dater`（用 `d.timestamp` 取毫秒数），第二个参数才是原生 `Date`。
> - 选择粒度是 `type: 'date' | 'month' | 'year'`，本库没有周（week）粒度。
> - 输入框原生只读，禁止键入；只能通过面板选择。清除后 `update:modelValue` 与 `change` 都收到 `undefined`。
> - `readonly` 是把整个组件渲染为纯文本（空值显示 `-`），不是让输入框可编辑。
> - 绑定值类型由 `dataType` 声明决定（默认字符串），本库不会按传入值类型自动切换输出类型。
> - 独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 设了 `valueFormat` 但 `modelValue` 格式没变

`valueFormat` 仅在 `dataType="string"`（默认）时生效。检查是否传了 `data-type="date"` 或 `data-type="timestamp"`——这两种模式的绑定值分别是原生 `Date` 与毫秒数，不存在格式串。

### 传入的字符串回显为空

字符串解析顺序：`dataType="string"` 且指定 `valueFormat` 时按 `valueFormat` 解析（如 `valueFormat="yyyyMMdd"` 对应 `'20260901'`），失败或未指定时按默认规则解析；无法解析的值按空处理，不抛错。核对字符串与格式是否一致。
