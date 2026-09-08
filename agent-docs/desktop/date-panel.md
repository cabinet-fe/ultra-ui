---
title: "UDatePanel - 日期面板"
description: "用 UDatePanel 做内嵌日/月/年选择或范围选择，日期类型为 Dater"
keywords:
  - UDatePanel
  - @veltra/desktop
  - date-panel
  - DatePanel
  - 日期面板
aliases: ["date-panel", "UDatePanel", "DatePanel", "日期面板"]
---

## 快速上手

```ts
import { UDatePanel } from '@veltra/desktop'
```

## 典型示例

`UDatePanel` 是无输入框的日历面板，供自定义布局或被 `UDatePicker` 复用。选中日通过 `date` + `@select:date` 同步，值为 `@cat-kit/core` 的 `Dater`，不是原生 `Date`。`type` 为 `date` / `month` / `year`。范围模式用 `range`、`range-date` 与 `@select:range-date`。

```vue
<script setup lang="ts">
import { date, type Dater } from '@cat-kit/core'
import { ref } from 'vue'

const selected = ref<Dater>()

function disabledDate(d: Dater) {
  return d.timestamp < date().timestamp
}
</script>

<template>
  <u-date-panel :date="selected" :disabled-date="disabledDate" @select:date="selected = $event" />
</template>
```

按月选择，或选一段范围：

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { ref } from 'vue'

const month = ref<Dater>()
const range = ref<[Dater, Dater]>()
</script>

<template>
  <u-date-panel type="month" :date="month" @select:date="month = $event" />
  <u-date-panel range :range-date="range" @select:range-date="range = $event" />
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

export interface Dater {
  year: number
  month: number
  date: number
  [key: string]: any
}

export type PanelType = 'day' | 'month' | 'year'

export interface DatePanelProps {
  date?: Dater
  rangeDate?: [Dater, Dater]
  range?: boolean
  disabledDate?: (date: Dater, raw: Date) => boolean
  type?: 'date' | 'month' | 'year'
  size?: FormComponentProps['size']
}

export interface DatePanelEmits {
  (e: 'select:date', date: Dater): void
  (e: 'select:range-date', rangeDate?: [Dater, Dater]): void
}
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
