---
title: UTimePicker 时间选择器（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端时间选择器：点击触发器弹出底部面板，时 / 分 / 秒三列滚轮（scroll-snap 对齐）选择，滚动与点击结果先暂存、点确定才落盘，取消丢弃；绑定值支持字符串、毫秒时间戳与 Date，支持按维度禁用时段与清除。属性与 @veltra/desktop 的 UTimePicker 同名同默认值。'
aliases: [time-picker, u-time-picker, TimePicker, 时间选择器, 时间滚轮]
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
    滚轮,
    scroll-snap,
    暂存,
    确定,
    时间选择,
    时分秒,
    禁用时段,
    移动端时间
  ]
---

# UTimePicker 时间选择器（@veltra/mobile 移动端）

`@veltra/mobile` 导出时间选择器 `UTimePicker`：点击触发器弹出**底部面板**，时 / 分 / 秒三列滚轮（`scroll-snap` 逐行对齐，行高 44px）选择；面板头部为「取消 / 标题 / 确定」，滚动与点击结果**先暂存**，点「确定」才写入 `v-model` 并发出 `change`，点「取消」或遮罩丢弃暂存。支持字符串 / 毫秒时间戳 / `Date` 三种绑定值类型与按维度禁用时段。属性名、类型与默认值与 `@veltra/desktop` 的 `UTimePicker` 完全对齐。

日期与时间的分工：选日期 / 月份 / 年份用 `UDatePicker`；仅选一天内的时间（时:分:秒）用 `UTimePicker`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UTimePicker } from '@veltra/mobile'
import '@veltra/mobile/components/time-picker/style'

const startAt = shallowRef('09:30:00')
</script>

<template>
  <UTimePicker v-model="startAt" placeholder="选择时间" />
  <!-- 滚动到 10:05:00 后点确定：startAt => '10:05:00'（默认 dataType='string'，格式 'HH:mm:ss'） -->
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/time-picker/style`。独立使用走 `v-model`；放进 `<UForm>` 时必须改用 `field` 绑定，禁止再写 `v-model`。

## API 签名

```ts
// 以下公共类型定义来自 @veltra/utils（@veltra/mobile 未再导出，此处仅说明 prop 类型）
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  /** 是否必填。`true` 或校验失败提示文本 */
  required?: boolean | string
  /** 长度 */
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
  /** 预设规则 */
  preset?: PresetRule
  /** 自定义校验：返回错误文本表示失败 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 绑定值类型 */
export type TimePickerDataType = 'date' | 'timestamp' | 'string'

/** 时间选择器属性（TimePickerProps 继承的 FormComponentProps 已展开） */
export interface TimePickerProps {
  /** 选中值；实际类型随 dataType：'string' 为格式化字符串、'timestamp' 为毫秒数、'date' 为原生 Date */
  modelValue?: string | number | Date
  /** 占位符。默认 '选择时间' */
  placeholder?: string
  /** 触发器显示格式。默认 'HH:mm:ss' */
  format?: string
  /** 值格式：仅 dataType 为 'string'（默认）时生效；未指定时复用 format */
  valueFormat?: string
  /** 绑定值类型。默认 'string'；非 'string' 时 valueFormat 不生效 */
  dataType?: TimePickerDataType
  /** 禁用的小时：返回的时值在滚轮时列中不可选 */
  disabledHours?: () => number[]
  /** 禁用的分钟：按暂存的小时计算返回禁用分值 */
  disabledMinutes?: (hour: number) => number[]
  /** 禁用的秒：按暂存的小时与分钟计算返回禁用秒值 */
  disabledSeconds?: (hour: number, minute: number) => number[]
  /** 是否显示清除按钮。默认 true */
  clearable?: boolean
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
  /** UForm 内的提示文字；移动端 UForm 不渲染该提示 */
  tips?: string
  /** 所占列数；移动端 UForm 单列呈现，该属性不生效 */
  span?:
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字，仅 UForm 内生效 */
  label?: string
  /** UForm 内绑定的 model 字段。设置后禁止再写 v-model */
  field?: string
  /** 是否禁用。默认 false */
  disabled?: boolean
  /** 是否只读（渲染为纯文本，不渲染触发器与面板）。默认 false */
  readonly?: boolean
  /** 校验规则，仅 UForm 内生效 */
  rules?: ValidateRule
}

export interface TimePickerEmits {
  /** 点确定或清除时触发；清除时 value 为 undefined */
  (e: 'update:modelValue', value?: string | number | Date): void
  /** 点确定或清除时触发；payload 为选中时间的原生 Date，清除时为 undefined */
  (e: 'change', time?: Date): void
}

/** 组件 ref 暴露成员：无（TimePickerExposed 为空对象类型，ref 上无可调用的方法或属性） */
export interface TimePickerExposed {}
```

## 参数说明

| 参数                     | 类型                                           | 默认              | 必填 | 约束                                                                                |
| ------------------------ | ---------------------------------------------- | ----------------- | :--: | ----------------------------------------------------------------------------------- |
| `v-model` / `modelValue` | `string \| number \| Date`                     | `undefined`       |  否  | 实际类型随 `dataType`；字符串先按 `valueFormat ?? format` 解析，失败再按原生规则解析，仍失败按空处理 |
| `format`                 | `string`                                       | `'HH:mm:ss'`      |  否  | 触发器显示格式；`HH` 时、`mm` 分、`ss` 秒                                           |
| `valueFormat`            | `string`                                       | 复用 `format`     |  否  | 仅 `dataType="string"` 时生效：决定提交的字符串格式，并用于解析传入字符串           |
| `dataType`               | `'string' \| 'date' \| 'timestamp'`            | `'string'`        |  否  | 绑定值类型；非 `'string'` 时 `valueFormat` 不生效                                   |
| `disabledHours`          | `() => number[]`                               | —                 |  否  | 返回的时值（0~23）在滚轮不可选                                                      |
| `disabledMinutes`        | `(hour: number) => number[]`                   | —                 |  否  | `hour` 为暂存的小时；返回的分值（0~59）不可选                                       |
| `disabledSeconds`        | `(hour: number, minute: number) => number[]`   | —                 |  否  | `hour` / `minute` 为暂存的小时 / 分；返回的秒值（0~59）不可选                       |
| `clearable`              | `boolean`                                      | `true`            |  否  | 有值且非禁用时触发器常显清除按钮（无 hover 概念）                                   |
| `placeholder`            | `string`                                       | `'选择时间'`      |  否  | 无值时的触发器文案；同时作为底部面板标题                                             |
| `field`                  | `string`                                       | —                 |  否  | 表单内生效。绑定 `<UForm :model>` 的字段；有 `field` 禁止再写 `v-model`             |
| `label`                  | `string`                                       | —                 |  否  | 表单内生效。表单标签文字                                                            |
| `rules`                  | `ValidateRule`                                 | —                 |  否  | 表单内生效。结构见 `## API 签名` 的 `ValidateRule`                                  |
| `tips`                   | `string`                                       | —                 |  否  | 表单内生效；移动端不渲染悬浮提示                                                    |
| `span`                   | `number \| 'full' \| 按 BreakpointName 的对象` | —                 |  否  | 表单内生效；移动端单列呈现，不生效                                                  |
| `size`                   | `ComponentSize`                                | `'default'`       |  否  | `'small' \| 'default' \| 'large'`；组件 props > 表单 > 默认                         |
| `disabled`               | `boolean`                                      | `false`           |  否  | 禁用后不可弹出面板、不可清除                                                        |
| `readonly`               | `boolean`                                      | `false`           |  否  | `true` 时整个组件渲染为纯文本（空值显示 `-`），不渲染触发器与面板                   |

## 方法与事件

| 事件                | payload                                 | 触发时机                                                                                                                                                             |
| ------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `update:modelValue` | `string \| number \| Date \| undefined` | 点面板「确定」时按 `dataType` 提交：`'string'` → 按 `valueFormat ?? format` 格式化的字符串；`'timestamp'` → 毫秒数；`'date'` → 原生 `Date`；点击清除时为 `undefined` |
| `change`            | `Date \| undefined`                     | 与 `update:modelValue` 同步触发；payload 始终是选中时间的原生 `Date`，清除时为 `undefined`                                                                           |

滚轮行为：

- 三列（时 0~23、分 0~59、秒 0~59）逐行 `scroll-snap` 对齐，行高 44px，列高固定 5 行；滚动停稳约 100ms 后取视口中心行的值写入暂存，停在禁用项上则平滑回弹到当前暂存值。
- 点击滚轮中的选项同样写入暂存并平滑滚动到该项中心。
- 面板打开时以当前绑定值定位三列；无值时停在 `00:00:00`。点「确定」时若无绑定值，以**今天 00:00:00 为基底**应用暂存的时分秒。
- 面板展开期间滚动 / 点击只改暂存，不触发 `update:modelValue`；点「取消」或遮罩丢弃暂存。

组件 `ref` 无暴露成员。

## 典型示例

### 三种绑定值类型

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UTimePicker } from '@veltra/mobile'
import '@veltra/mobile/components/time-picker/style'

const str = shallowRef('09:30:00')
const ts = shallowRef<number>(Date.now())
const d = shallowRef<Date>(new Date())
</script>

<template>
  <!-- 默认 dataType='string'，提交 'HH:mm:ss' 字符串 -->
  <UTimePicker v-model="str" />
  <!-- dataType='timestamp'，提交毫秒数 -->
  <UTimePicker v-model="ts" data-type="timestamp" />
  <!-- dataType='date'，提交原生 Date -->
  <UTimePicker v-model="d" data-type="date" />
</template>
```

### 禁用时段

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UTimePicker } from '@veltra/mobile'
import '@veltra/mobile/components/time-picker/style'

const startAt = shallowRef('08:30:30')

// 返回列表内的时值不可选
function disabledHours() {
  return [0, 1, 2, 3, 4, 5, 20, 21, 22, 23]
}

// hour 为暂存的小时；8 点时禁用 0~29 分
function disabledMinutes(hour: number) {
  return hour === 8 ? Array.from({ length: 30 }, (_, i) => i) : []
}

// 8:30 时禁用 0~29 秒
function disabledSeconds(hour: number, minute: number) {
  return hour === 8 && minute === 30 ? Array.from({ length: 30 }, (_, i) => i) : []
}
</script>

<template>
  <UTimePicker
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
import { reactive } from 'vue'

import { UForm, UTimePicker } from '@veltra/mobile'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/time-picker/style'

const form = reactive({ startAt: '', endAt: undefined as number | undefined })
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model；label/rules 此处才生效 -->
  <UForm :model="form">
    <UTimePicker label="开始时间" field="startAt" :rules="{ required: '请选择开始时间' }" />
    <UTimePicker label="结束时间" field="endAt" data-type="timestamp" />
  </UForm>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是**三列滚轮 + 暂存 + 确定/取消**：滚动与点击只改暂存，点「确定」才提交 `update:modelValue` 与 `change`，点「取消」或遮罩丢弃；桌面端是三列点击列表、点击列项立即提交且面板保持展开。
> - 移动端滚轮逐行 `scroll-snap` 对齐（行高 44px、列高 5 行），滚动停稳约 100ms 落暂存；桌面端无滚轮。
> - 移动端清除按钮在有值且 `clearable` 时**常显**（无 hover 概念），桌面端悬停触发器时才显示。
> - 无值时打开面板三列停在 `00:00:00`；点「确定」后以今天 00:00:00 为基底提交。
> - 滚动停在禁用项上时该列回弹到当前暂存值，禁用项不可选。
> - 禁用回调按「面板暂存值」计算：`disabledMinutes(hour)` 的 `hour` 是暂存小时，未选值时为 `0`。
> - 本库是独立时间选择器（时 / 分 / 秒），不是日期时间混合形态；需要选日期时用 `UDatePicker`。
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；独立使用时才用 `v-model`。
> - `valueFormat` 仅在 `dataType="string"`（默认）时生效；`dataType` 为 `'date'` / `'timestamp'` 时该属性被忽略。
> - 触发器不可键入；只能通过面板选择。清除后 `update:modelValue` 与 `change` 都收到 `undefined`。
> - `readonly` 是把整个组件渲染为纯文本（空值显示 `-`），不是让触发器可编辑。
> - 绑定值类型由 `dataType` 声明决定（默认字符串），本库不会按传入值类型自动切换输出类型。

## 常见问题

### 滚轮拨好了但 `v-model` 没有变化

原因：滚轮结果只写暂存，必须点面板头部的「确定」才落盘；点「取消」或遮罩会丢弃暂存。修复：确认流程走「滚动 → 确定」。

### 设了 `valueFormat` 但 `modelValue` 格式没变

`valueFormat` 仅在 `dataType="string"`（默认）时生效。检查是否传了 `data-type="date"` 或 `data-type="timestamp"`——这两种模式的绑定值分别是原生 `Date` 与毫秒数，不存在格式串。

### 传入的字符串回显为空

字符串解析顺序：先按 `valueFormat ?? format`（默认 `'HH:mm:ss'`）解析（如 `valueFormat="HHmmss"` 对应 `'093000'`），失败再按原生 `new Date` 规则解析；两次都失败按空处理，不抛错。核对字符串与格式是否一致。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UTimePicker } from '@veltra/mobile'
import '@veltra/mobile/components/time-picker/style'

// valueFormat="HH:mm" 时初值必须是对应格式的字符串
const startAt = shallowRef('09:30') // 正确，滚轮定位到 09:30:00
// const startAt = shallowRef('093000') // 错误：按 HH:mm 解析失败，回显为空
</script>

<template>
  <UTimePicker v-model="startAt" format="HH:mm:ss" value-format="HH:mm" />
</template>
```
