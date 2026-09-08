---
title: "URadioGroup - 单选框组"
description: "用 items 渲染一组单选，以及在 UForm 内用 field 绑定"
keywords:
  - URadioGroup
  - @veltra/desktop
  - radio-group
  - RadioGroup
  - 单选框组
aliases: ["radio-group", "URadioGroup", "RadioGroup", "单选框组"]
---

## 快速上手

```ts
import { URadioGroup } from '@veltra/desktop'
```

## 典型示例

`items` 必填；默认 `value-key` 为 `'value'`、`label-key` 为 `'label'`。`disabled-item` 按项禁用，`block` 为纵向排布。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const gender = shallowRef('1')
const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]
</script>

<template>
  <u-radio-group v-model="gender" :items="items" />
  <u-radio-group v-model="gender" :items="items" :disabled-item="(item) => item.value === '1'" />
  <u-radio-group v-model="gender" :items="items" block />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ gender: '' })
const genderList = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]
</script>

<template>
  <u-form :model="form">
    <u-radio-group label="性别" field="gender" :items="genderList" :rules="{ required: true }" />
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

/** 单选框默认父组件组件属性 */
export interface RadioGroupProps extends FormComponentProps {
  /** 值 */
  modelValue?: any
  /** 单选框项 */
  items: Record<string, any>[]
  /**
   * 选项值key
   * @default 'value'
   */
  valueKey?: string
  /**
   * 标签文本key
   * @default 'label'
   */
  labelKey?: string
  /** 禁用 */
  disabled?: boolean
  /** 禁用的选项 */
  disabledItem?: (item: Record<string, any>) => boolean
  /** 块级布局 */
  block?: boolean
}

/** 单选框默认父组件组件定义的事件 */
export interface RadioGroupEmits {
  /** 值更新 */
  (e: 'update:modelValue', modelValue: any): void
  /** 选项更新事件 */
  (e: 'change', item: Record<string, any>): void
}

/** 单选框默认父组件组件暴露的属性和方法(组件内部使用) */
export interface _RadioGroupExposed {}

/** 单选框默认父组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioGroupExposed = DeconstructValue<_RadioGroupExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
