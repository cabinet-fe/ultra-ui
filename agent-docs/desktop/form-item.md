---
title: "UFormItem - 表单项"
description: "仅在多控件组合或自定义 label 时显式使用；field 写在 Item 上"
keywords:
  - UFormItem
  - @veltra/desktop
  - form-item
  - FormItem
  - 表单项
aliases: ["form-item", "UFormItem", "FormItem", "表单项"]
---

## 快速上手

```ts
import { UFormItem } from '@veltra/desktop'
```

## 典型示例

单字段控件直接放在 `UForm` 上写 `field` 即可，一般不必手写 `UFormItem`。仅当需要多控件组合同一个字段、或自定义 label 插槽时才用：`field` / `label` / `rules` / `tips` 写在 Item 上；**内部控件自行 `v-model`，且不再写 `field`**。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  name: '',
  priceRange: { min: undefined as number | undefined, max: undefined as number | undefined }
})
</script>

<template>
  <u-form :model="form" label-width="100px" :cols="1">
    <u-input label="商品名" field="name" :rules="{ required: '商品名不能为空' }" />

    <u-form-item
      label="价格区间"
      field="priceRange"
      :rules="{ required: '请填写价格区间' }"
      tips="最低价不能高于最高价"
    >
      <u-number-input v-model="form.priceRange.min" placeholder="最低" />
      <span>—</span>
      <u-number-input v-model="form.priceRange.max" placeholder="最高" />
    </u-form-item>
  </u-form>
</template>
```

自定义 label 插槽：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ agree: false })
</script>

<template>
  <u-form :model="form">
    <u-form-item field="agree">
      <template #label>
        <span>我已阅读并同意条款</span>
      </template>
      <u-checkbox v-model="form.agree" />
    </u-form-item>
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

/** 组件项组件属性 */
export interface FormItemProps extends FormComponentProps {
  /** 标签宽度 */
  labelWidth?: string | number
  /** 标签位置 */
  labelPosition?: 'top' | 'left'
}

/** 组件项组件定义的事件 */
export interface FormItemEmits {}

/** 组件项组件暴露的属性和方法 */
export interface FormItemExposed {}
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
