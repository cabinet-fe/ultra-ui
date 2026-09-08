---
title: "USegment - 分段选择器"
description: "用 USegment 在互斥选项间切换，表单内用 field 绑定"
keywords:
  - USegment
  - @veltra/desktop
  - segment
  - Segment
  - 分段选择器
aliases: ["segment", "USegment", "Segment", "分段选择器"]
---

## 快速上手

```ts
import { USegment } from '@veltra/desktop'
```

## 典型示例

`USegment` 的 `items` 必填，默认 `label` / `value`。`block` 撑满容器宽度。`disabled-item` 禁用单个选项，`disabled` 禁用整组。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const period = ref('day')
const items = [
  { label: '按日', value: 'day' },
  { label: '按周', value: 'week' },
  { label: '按月', value: 'month' }
]
</script>

<template>
  <u-segment v-model="period" :items="items" />
  <u-segment v-model="period" :items="items" block />
  <u-segment v-model="period" :items="items" :disabled-item="(item) => item.value === 'week'" />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ period: 'month' })
const items = [
  { label: '日', value: 'day' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' }
]
</script>

<template>
  <u-form :model="form">
    <u-segment label="统计周期" field="period" :items="items" />
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

/** 分段单选选项 */
export type SegmentItem = Record<string, any>

/** 分段单选组件属性 */
export interface SegmentProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: any
  /** 选项列表 */
  items: SegmentItem[]
  /**
   * 选项值 key
   * @default 'value'
   */
  valueKey?: string
  /**
   * 选项标签 key
   * @default 'label'
   */
  labelKey?: string
  /** 是否禁用整组 */
  disabled?: boolean
  /** 禁用的选项判断函数 */
  disabledItem?: (item: SegmentItem) => boolean
  /** 是否撑满容器宽度 */
  block?: boolean
}

/** 分段单选组件事件 */
export interface SegmentEmits {
  /** 绑定值更新 */
  (e: 'update:modelValue', modelValue: any): void
  /** 选中项切换事件 */
  (e: 'change', item: SegmentItem): void
}

/** 分段单选组件暴露的属性和方法(组件内部使用) */
export interface _SegmentExposed {}

/** 分段单选组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SegmentExposed = DeconstructValue<_SegmentExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
