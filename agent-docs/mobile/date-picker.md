---
title: UDatePicker 日期选择器（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端日期选择器：点击触发器弹出底部日历面板，按日 / 月 / 年三种视图选择，选中即落值并收起；面板支持横向滑动翻页（左滑下一个 / 右滑上一个）并与点击翻页按钮并存；绑定值支持字符串、毫秒时间戳与 Date，支持禁用日期与清除，格子密度与字号走 --um-* 移动端 token。属性与 @veltra/desktop 的 UDatePicker 同名同默认值，放进 UForm 时用 field 绑定。'
aliases: [date-picker, u-date-picker, DatePicker, 日期选择器, 移动端日历]
keywords:
  [
    modelValue,
    'update:modelValue',
    change,
    type,
    format,
    valueFormat,
    dataType,
    DatePickerDataType,
    disabledDate,
    clearable,
    Dater,
    底部日历,
    日期选择,
    月份选择,
    年份选择,
    禁用日期,
    时间戳,
    清除,
    移动端日期
  ]
---

# UDatePicker 日期选择器（@veltra/mobile 移动端）

`@veltra/mobile` 导出日期选择器 `UDatePicker`：点击触发器弹出**底部日历面板**，`type` 决定日 / 月 / 年三种视图，选中即落值并收起面板；支持字符串 / 毫秒时间戳 / `Date` 三种绑定值类型、禁用日期与清除。属性名、类型与默认值与 `@veltra/desktop` 的 `UDatePicker` 完全对齐。

移动端日期组件分工：本组件选单个日期 / 月份 / 年份；时间（时:分:秒）用 `UTimePicker`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UDatePicker } from '@veltra/mobile'
import '@veltra/mobile/components/date-picker/style'

const birthday = shallowRef('2026-09-01')
</script>

<template>
  <UDatePicker v-model="birthday" placeholder="选择生日" />
  <!-- 点击触发器弹出底部日历，选中 2026-09-10 后：birthday => '2026-09-10'（默认 dataType='string'） -->
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/date-picker/style`。独立使用走 `v-model`；放进 `<UForm>` 时必须改用 `field` 绑定，禁止再写 `v-model`。

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

/** @cat-kit/core 的日期对象；disabledDate 回调第一参，常用其 timestamp（毫秒数）与 raw（原生 Date）成员 */
export interface Dater {
  year: number
  month: number
  date: number
  [key: string]: any
}

/** 绑定值类型 */
export type DatePickerDataType = 'date' | 'timestamp' | 'string'

/** 日期选择器属性（DatePickerProps 继承的 FormComponentProps 已展开） */
export interface DatePickerProps {
  /** 选中值；实际类型随 dataType：'string' 为格式化字符串、'timestamp' 为毫秒数、'date' 为原生 Date */
  modelValue?: string | number | Date
  /** 占位符。默认 '选择日期' */
  placeholder?: string
  /** 选择粒度：日 / 月 / 年。默认 'date' */
  type?: 'date' | 'month' | 'year'
  /** 触发器显示格式；默认随 type：'yyyy-MM-dd' | 'yyyy-MM' | 'yyyy' */
  format?: string
  /** 值格式：仅 dataType 为 'string'（默认）时生效；未指定时复用 format */
  valueFormat?: string
  /** 绑定值类型。默认 'string'；非 'string' 时 valueFormat 不生效 */
  dataType?: DatePickerDataType
  /** 禁用日期：返回 true 的日期在面板中不可选；date 为 Dater，raw 为原生 Date */
  disabledDate?: (date: Dater, raw: Date) => boolean
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

export interface DatePickerEmits {
  /** 选中或清除时触发；清除时 value 为 undefined */
  (e: 'update:modelValue', value?: string | number | Date): void
  /** 选中或清除时触发；payload 为选中日期的原生 Date，清除时为 undefined */
  (e: 'change', date?: Date): void
}

/** 组件 ref 暴露成员：无（DatePickerExposed 为空对象类型，ref 上无可调用的方法或属性） */
export interface DatePickerExposed {}
```

## 参数说明

| 参数                     | 类型                                           | 默认                                               | 必填 | 约束                                                                               |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------- | :--: | ---------------------------------------------------------------------------------- |
| `v-model` / `modelValue` | `string \| number \| Date`                     | `undefined`                                        |  否  | 实际类型随 `dataType`；字符串须能按 `valueFormat` 或默认规则解析，解析失败按空处理 |
| `type`                   | `'date' \| 'month' \| 'year'`                  | `'date'`                                           |  否  | 选择粒度：日 / 月 / 年；本库无周（week）粒度                                       |
| `format`                 | `string`                                       | 随 `type`：`'yyyy-MM-dd'` / `'yyyy-MM'` / `'yyyy'` |  否  | 触发器显示格式                                                                     |
| `valueFormat`            | `string`                                       | 复用 `format`                                      |  否  | 仅 `dataType="string"` 时生效：决定提交的字符串格式，并用于解析传入字符串          |
| `dataType`               | `'string' \| 'date' \| 'timestamp'`            | `'string'`                                         |  否  | 绑定值类型；非 `'string'` 时 `valueFormat` 不生效                                  |
| `disabledDate`           | `(date: Dater, raw: Date) => boolean`          | —                                                  |  否  | 返回 `true` 的日期不可选；月格以月末 23:59:59、年格以年末 12-31 23:59:59 参与判定  |
| `clearable`              | `boolean`                                      | `true`                                             |  否  | 有值且非禁用时触发器常显清除按钮（无 hover 概念）                                  |
| `placeholder`            | `string`                                       | `'选择日期'`                                       |  否  | 无值时的触发器文案；同时作为底部面板标题                                            |
| `field`                  | `string`                                       | —                                                  |  否  | 表单内生效。绑定 `<UForm :model>` 的字段；有 `field` 禁止再写 `v-model`            |
| `label`                  | `string`                                       | —                                                  |  否  | 表单内生效。表单标签文字                                                           |
| `rules`                  | `ValidateRule`                                 | —                                                  |  否  | 表单内生效。结构见 `## API 签名` 的 `ValidateRule`                                 |
| `tips`                   | `string`                                       | —                                                  |  否  | 表单内生效；移动端不渲染悬浮提示                                                   |
| `span`                   | `number \| 'full' \| 按 BreakpointName 的对象` | —                                                  |  否  | 表单内生效；移动端单列呈现，不生效                                                 |
| `size`                   | `ComponentSize`                                | `'default'`                                        |  否  | `'small' \| 'default' \| 'large'`；组件 props > 表单 > 默认                        |
| `disabled`               | `boolean`                                      | `false`                                            |  否  | 禁用后不可弹出面板、不可清除                                                       |
| `readonly`               | `boolean`                                      | `false`                                            |  否  | `true` 时整个组件渲染为纯文本（空值显示 `-`），不渲染触发器与面板                  |

## 方法与事件

| 事件                | payload                                 | 触发时机                                                                                                                                                             |
| ------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `update:modelValue` | `string \| number \| Date \| undefined` | 面板中选中日期时按 `dataType` 提交：`'string'` → 按 `valueFormat ?? format` 格式化的字符串；`'timestamp'` → 毫秒数；`'date'` → 原生 `Date`；点击清除时为 `undefined` |
| `change`            | `Date \| undefined`                     | 与 `update:modelValue` 同步触发；payload 始终是选中日期的原生 `Date`，清除时为 `undefined`                                                                           |

组件 `ref` 无暴露成员。触发器不可键入，只能通过面板选择；选中后面板自动收起。面板打开时以当前选中值（无值则今天）定位浏览年月，翻页（上一个 / 下一个按钮，或面板上横向滑动）只移动浏览位置、不改动选中值。

## 典型示例

### 三种粒度与自定义显示格式

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UDatePicker } from '@veltra/mobile'
import '@veltra/mobile/components/date-picker/style'

const day = shallowRef('2026-09-01')
const month = shallowRef('2026-09')
const year = shallowRef('2026')
</script>

<template>
  <!-- type 默认 'date'，默认格式 yyyy-MM-dd；日视图固定 6 行 42 格，含上月尾与下月头补位 -->
  <UDatePicker v-model="day" />
  <!-- 月粒度：默认格式 yyyy-MM，面板一次呈现 12 个月，按年翻页 -->
  <UDatePicker v-model="month" type="month" />
  <!-- 年粒度：默认格式 yyyy，面板一次呈现 10 年，按十年翻页 -->
  <UDatePicker v-model="year" type="year" />
  <!-- 自定义显示格式；v-model 提交的字符串同为该格式 -->
  <UDatePicker v-model="day" format="yyyy年MM月dd日" />
</template>
```

### 时间戳绑定、禁用过去日期与 change

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { shallowRef } from 'vue'

import { UDatePicker } from '@veltra/mobile'
import '@veltra/mobile/components/date-picker/style'

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
  <UDatePicker
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
import { reactive } from 'vue'

import { UDatePicker, UForm } from '@veltra/mobile'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/date-picker/style'

const form = reactive({ birthday: '', hiredAt: undefined as number | undefined })
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model；label/rules 此处才生效 -->
  <UForm :model="form">
    <UDatePicker label="生日" field="birthday" :rules="{ required: '请选择生日' }" />
    <UDatePicker label="入职时间" field="hiredAt" data-type="timestamp" />
  </UForm>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是**底部日历面板**（日 / 月 / 年三视图，带遮罩与上一个 / 下一个翻页按钮），桌面端是下拉面板内嵌 `UDatePanel`。
> - 面板支持**横向滑动翻页**：在日历上左滑切到下一个、右滑切到上一个（日视图按月、月视图按年、年视图按十年），与点击翻页按钮并存；滑动翻页同样只移动浏览位置、不改动选中值。
> - 移动端清除按钮在有值且 `clearable` 时**常显**（无 hover 概念），桌面端悬停触发器时才显示。
> - 移动端日视图固定 6 行 42 格（含上月尾与下月头补位），无虚拟滚动；翻页步长随 `type`：日视图按月、月视图按年、年视图按十年。月份 / 星期 / 日期格子密度与字号走 `--um-*` 移动端 token：日期格字号 `--um-font-size-main`（16px）、热区 `--um-touch-target`（≥44px）、星期头 `--um-font-size-auxiliary`（12px）。
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；独立使用时才用 `v-model`。
> - `label` / `field` / `rules` / `tips` / `span` 仅在 `UForm`（或 `UFormItem` 包裹）内生效；移动端 `span` 与 `tips` 不产生布局与提示效果。
> - `valueFormat` 仅在 `dataType="string"`（默认）时生效；`dataType` 为 `'date'` / `'timestamp'` 时该属性被忽略。
> - `disabledDate` 的第一个参数是 `@cat-kit/core` 的 `Dater`（用 `d.timestamp` 取毫秒数），第二个参数才是原生 `Date`；月 / 年粒度分别以月末、年末时刻参与判定。
> - 选择粒度是 `type: 'date' | 'month' | 'year'`，本库没有周（week）粒度。
> - 清除后 `update:modelValue` 与 `change` 都收到 `undefined`。
> - `readonly` 是把整个组件渲染为纯文本（空值显示 `-`），不是让触发器可编辑。
> - 绑定值类型由 `dataType` 声明决定（默认字符串），本库不会按传入值类型自动切换输出类型。

## 常见问题

### 设了 `valueFormat` 但 `modelValue` 格式没变

`valueFormat` 仅在 `dataType="string"`（默认）时生效。检查是否传了 `data-type="date"` 或 `data-type="timestamp"`——这两种模式的绑定值分别是原生 `Date` 与毫秒数，不存在格式串。

### 传入的字符串回显为空

字符串解析顺序：`dataType="string"` 且指定 `valueFormat` 时按 `valueFormat` 解析（如 `valueFormat="yyyyMMdd"` 对应 `'20260901'`），失败或未指定时按默认规则解析；无法解析的值按空处理，不抛错。核对字符串与格式是否一致。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UDatePicker } from '@veltra/mobile'
import '@veltra/mobile/components/date-picker/style'

// valueFormat="yyyyMMdd" 时初值必须是 8 位数字串
const day = shallowRef('20260901') // 正确，显示 2026-09-01
// const day = shallowRef('2026-09-01') // 错误：按 yyyyMMdd 解析失败，回显为空
</script>

<template>
  <UDatePicker v-model="day" value-format="yyyyMMdd" />
</template>
```
