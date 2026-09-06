---
title: "UMultiSelect - 多选选择器"
description: "用 UMultiSelect 从选项列表多选，支持搜索、创建与数量上限"
keywords:
  - UMultiSelect
  - @veltra/desktop
  - multi-select
  - MultiSelect
  - 多选选择器
aliases: ["multi-select", "UMultiSelect", "MultiSelect", "多选选择器"]
---
## 快速上手

```ts
import { UMultiSelect } from '@veltra/desktop'
```

## 典型示例

`UMultiSelect` 绑定值是数组。选项默认 `label` / `value`。`options` 可以是数组，也可以是 `(qs: string) => options` 的函数（同步或 Promise）。`filterable` 开启搜索，`creatable` 允许把当前输入建成新选项，`max` 限制可选数量，`visibility-limit` 限制已选项展示个数。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selected = ref<(string | number)[]>([1, 2])
const options = [
  { label: '设计', value: 1 },
  { label: '研发', value: 2 },
  { label: '测试', value: 3 },
  { label: '产品', value: 4 }
]
</script>

<template>
  <u-multi-select
    v-model="selected"
    :options="options"
    :max="3"
    filterable
    creatable
    clearable
  />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ tags: [] as string[] })
const options = [
  { label: '紧急', value: 'urgent' },
  { label: '缺陷', value: 'bug' }
]
</script>

<template>
  <u-form :model="form">
    <u-multi-select label="标签" field="tags" :options="options" />
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

import type { CSSProperties } from 'vue'

/** multi-select组件属性 */
export interface MultiSelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: Array<any>
  /** 列表选项 */
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段 */
  valueKey?: string
  /** 标签字段 */
  labelKey?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 占位符 */
  placeholder?: string
  /** 是否启用搜索功能 */
  filterable?: boolean
  /** 最大展示数量 */
  visibilityLimit?: number
  /** 最大可选数量 */
  max?: number
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 内容容器类名 */
  contentClass?: unknown
  /** 弹框最小宽度 */
  minWidth?: string
  /**
   * 弹框宽度
   * @default '220px'
   */
  width?: string
  /** 是否允许创建新选项 */
  creatable?: boolean
}

/** multi-select组件定义的事件 */
export interface MultiSelectEmits {
  (e: 'update:modelValue', value: Array<any>): void
  (e: 'change', options: Record<string, any>[]): void
}

/** multi-select组件暴露的属性和方法(组件内部使用) */
export interface _MultiSelectExposed {}

/** multi-select组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiSelectExposed = DeconstructValue<_MultiSelectExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
