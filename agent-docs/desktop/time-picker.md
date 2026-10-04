---
title: UTimePicker 时间选择器
description: '从 `@veltra/desktop` 导出的时间选择器：只读输入框点击弹出时 / 分 / 秒三列滚动面板，绑定值支持字符串、毫秒时间戳与 Date，支持按维度禁用时段与清除；放进 UForm 时用 `field` 绑定 model 并按 `rules` 校验。'
aliases: [time-picker, u-time-picker, TimePicker, 时间选择器, 时间输入框]
keywords:
  [
    modelValue,
    'update:modelValue',
    change,
    format,
    valueFormat,
    dataType,
    TimePickerDataType,
    disabledHours,
    disabledMinutes,
    disabledSeconds,
    clearable,
    Dater,
    时间选择,
    时分秒,
    禁用时段,
    禁用时间,
    时间戳,
    清除,
    占位符
  ]
---

# UTimePicker 时间选择器

`@veltra/desktop` 导出时间选择器 `UTimePicker`：只读输入框，点击后弹出下拉时间面板（时 / 分 / 秒三列滚动列表），点击列项立即更新绑定值，面板保持展开供继续调整，点击面板外或触发框收起；支持字符串 / 毫秒时间戳 / `Date` 三种绑定值类型、按维度禁用时段与悬停清除。放进 `UForm` 时用 `field` 绑定。

日期与时间的分工：选日期 / 月份 / 年份用 `UDatePicker`；选日期区间用 `UDateRangePicker`；仅选一天内的时间（时:分:秒）用 `UTimePicker`。

## 快速上手

```vue
<script setup lang="ts">
import { UTimePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const startAt = shallowRef('09:30:00')
</script>

<template>
  <u-time-picker v-model="startAt" placeholder="选择时间" />
</template>
```

独立使用走 `v-model`；放进 `<u-form>` 时必须改用 `field` 绑定，禁止再写 `v-model`。使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

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

/** 表单组件通用属性：label / field / rules / tips / span 仅在 UForm（或 UFormItem）内生效 */
export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?: number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
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

/** 绑定值类型 */
export type TimePickerDataType = 'date' | 'timestamp' | 'string'

/** 时间选择器属性 */
export interface TimePickerProps extends FormComponentProps {
  /** 选中值；实际类型随 dataType：'string' 为格式化字符串、'timestamp' 为毫秒数、'date' 为原生 Date */
  modelValue?: string | number | Date
  /** 占位符。默认 '选择时间' */
  placeholder?: string
  /** 输入框显示格式；默认 'HH:mm:ss' */
  format?: string
  /** 值格式：仅 dataType 为 'string'（默认）时生效；未指定时复用 format */
  valueFormat?: string
  /** 绑定值类型。默认 'string' */
  dataType?: TimePickerDataType
  /** 禁用的小时：返回的时值在面板时列中不可选 */
  disabledHours?: () => number[]
  /** 禁用的分钟：按已选小时计算返回禁用分值 */
  disabledMinutes?: (hour: number) => number[]
  /** 禁用的秒：按已选小时与分钟计算返回禁用秒值 */
  disabledSeconds?: (hour: number, minute: number) => number[]
  /** 是否显示清除按钮。默认 true */
  clearable?: boolean
}

export interface TimePickerEmits {
  /** 点击列项或清除时触发；清除时 value 为 undefined */
  (e: 'update:modelValue', value?: string | number | Date): void
  /** 点击列项或清除时触发；payload 为选中时间的原生 Date，清除时为 undefined */
  (e: 'change', time?: Date): void
}

/** 组件 ref 暴露成员：无（TimePickerExposed 为空对象，ref 上无可调用的方法或属性） */
export interface TimePickerExposed {}
```

## 参数说明

| 参数                     | 类型                                           | 默认              |  必填   | 约束                                                                               |
| ------------------------ | ---------------------------------------------- | ----------------- | :-----: | ---------------------------------------------------------------------------------- |
| `v-model` / `modelValue` | `string \| number \| Date`                     | `undefined`       |  否  | 实际类型随 `dataType`；字符串先按 `valueFormat ?? format` 解析，失败再按原生规则解析，仍失败按空处理 |
| `format`                 | `string`                                       | `'HH:mm:ss'`      |  否  | 输入框显示格式；占位符 `HH` 时、`mm` 分、`ss` 秒                                    |
| `valueFormat`            | `string`                                       | 复用 `format`     |  否  | 仅 `dataType="string"` 时生效：决定提交的字符串格式，并用于解析传入字符串           |
| `dataType`               | `'string' \| 'date' \| 'timestamp'`            | `'string'`        |  否  | 绑定值类型；非 `'string'` 时 `valueFormat` 不生效                                   |
| `disabledHours`          | `() => number[]`                               | —                 |  否  | 返回的时值（0~23）在面板不可选                                                      |
| `disabledMinutes`        | `(hour: number) => number[]`                   | —                 |  否  | `hour` 为当前选中的时；返回的分值（0~59）不可选                                     |
| `disabledSeconds`        | `(hour: number, minute: number) => number[]`   | —                 |  否  | `hour` / `minute` 为当前选中的时 / 分；返回的秒值（0~59）不可选                     |
| `clearable`              | `boolean`                                      | `true`            |  否  | 清除图标显示条件：悬停 + 有值 + 非禁用                                              |
| `placeholder`            | `string`                                       | `'选择时间'`      |  否  | —                                                                                   |
| `field`                  | `string`                                       | —                 |  否  | 表单内生效。绑定 `<u-form :model>` 的字段；有 `field` 禁止再写 `v-model`            |
| `label`                  | `string`                                       | —                 |  否  | 表单内生效。表单标签文字                                                            |
| `rules`                  | `ValidateRule`                                 | —                 |  否  | 表单内生效。结构见 `## API 签名` 的 `ValidateRule`                                  |
| `tips`                   | `string`                                       | —                 |  否  | 表单内生效。表单项提示文案                                                          |
| `span`                   | `number \| 'full' \| 按 BreakpointName 的对象` | —                 |  否  | 表单内生效。`'full'` 占满一行；对象形态必须含 `default` 键                          |
| `size`                   | `ComponentSize`                                | `'default'`       |  否  | `'small' \| 'default' \| 'large'`；优先级：组件 props > 表单 > 全局配置 > 默认      |
| `disabled`               | `boolean`                                      | `false`           |  否  | 禁用后不可弹出面板、不可清除；优先级同 `size`                                        |
| `readonly`               | `boolean`                                      | `false`           |  否  | `true` 时整个组件渲染为纯文本（空值显示 `-`），不渲染下拉                            |

## 方法与事件

| 事件                | payload                                 | 触发时机                                                                                                                                                             |
| ------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `update:modelValue` | `string \| number \| Date \| undefined` | 点击任一列项时按 `dataType` 提交：`'string'` → 按 `valueFormat ?? format` 格式化的字符串；`'timestamp'` → 毫秒数；`'date'` → 原生 `Date`；点击清除时为 `undefined` |
| `change`            | `Date \| undefined`                     | 与 `update:modelValue` 同步触发；payload 始终是选中时间的原生 `Date`，清除时为 `undefined`                                                                          |

组件 `ref` 无暴露成员。输入框原生只读，禁止键入，只能通过面板选择；面板展开期间点击列项不会收起面板，点击面板外或触发框收起。无值时打开面板三列停在顶部（不预选当前时刻）。

## 典型示例

### 三种绑定值类型

```vue
<script setup lang="ts">
import { UTimePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const str = shallowRef('09:30:00')
const ts = shallowRef<number>(Date.now())
const d = shallowRef<Date>(new Date())
</script>

<template>
  <!-- 默认 dataType='string'，提交 'HH:mm:ss' 字符串 -->
  <u-time-picker v-model="str" />
  <!-- dataType='timestamp'，提交毫秒数 -->
  <u-time-picker v-model="ts" data-type="timestamp" />
  <!-- dataType='date'，提交原生 Date -->
  <u-time-picker v-model="d" data-type="date" />
</template>
```

### 禁用时段

```vue
<script setup lang="ts">
import { UTimePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const startAt = shallowRef('08:30:30')

// 返回 true 列表内的时值不可选
function disabledHours() {
  return [0, 1, 2, 3, 4, 5, 20, 21, 22, 23]
}

// hour 为当前选中的时；8 点时禁用 0~29 分
function disabledMinutes(hour: number) {
  return hour === 8 ? Array.from({ length: 30 }, (_, i) => i) : []
}

// 8:30 时禁用 0~29 秒
function disabledSeconds(hour: number, minute: number) {
  return hour === 8 && minute === 30 ? Array.from({ length: 30 }, (_, i) => i) : []
}
</script>

<template>
  <u-time-picker
    v-model="startAt"
    :disabled-hours="disabledHours"
    :disabled-minutes="disabledMinutes"
    :disabled-seconds="disabledSeconds"
  />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { UForm, UTimePicker } from '@veltra/desktop'
import { reactive } from 'vue'

const form = reactive({ startAt: '', endAt: undefined as number | undefined })
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model；label/rules/tips/span 此处才生效 -->
  <u-form :model="form">
    <u-time-picker
      label="开始时间"
      field="startAt"
      tips="请选择开始时间"
      :rules="{ required: '请选择开始时间' }"
    />
    <u-time-picker label="结束时间" field="endAt" data-type="timestamp" />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
>
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；独立使用时才用 `v-model`。
> - `label` / `field` / `rules` / `tips` / `span` 仅在 `UForm`（或 `UFormItem` 包裹）内生效，独立使用时传入无效。
> - `valueFormat` 仅在 `dataType="string"`（默认）时生效；`dataType` 为 `'date'` / `'timestamp'` 时该属性被忽略。
> - 本库是独立时间选择器（时 / 分 / 秒），不是 AntD TimePicker 的日期时间混合形态；需要选日期时用 `UDatePicker`。
> - 点击列项会立即提交 `update:modelValue` 并保持面板展开；这与 `UDatePicker` 选中即收起不同。
> - 禁用回调按「当前选中值」计算：`disabledMinutes(hour)` 的 `hour` 是已选小时，未选值时传 `0`。
> - 输入框原生只读，禁止键入；只能通过面板选择。清除后 `update:modelValue` 与 `change` 都收到 `undefined`。
> - `readonly` 是把整个组件渲染为纯文本（空值显示 `-`），不是让输入框可编辑。
> - 绑定值类型由 `dataType` 声明决定（默认字符串），本库不会按传入值类型自动切换输出类型。
> - 独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 设了 `valueFormat` 但 `modelValue` 格式没变

`valueFormat` 仅在 `dataType="string"`（默认）时生效。检查是否传了 `data-type="date"` 或 `data-type="timestamp"`——这两种模式的绑定值分别是原生 `Date` 与毫秒数，不存在格式串。

### 传入的字符串回显为空

字符串解析顺序：先按 `valueFormat ?? format`（默认 `'HH:mm:ss'`）解析（如 `valueFormat="HHmmss"` 对应 `'093000'`），失败再按原生 `new Date` 规则解析；两次都失败按空处理，不抛错。核对字符串与格式是否一致。
