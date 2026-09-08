---
title: "UCheckbox / UCheckboxButton - 复选框"
description: "复选框与复选按钮的独立绑定，以及在 UForm 内用 field 绑定"
keywords:
  - UCheckbox
  - UCheckboxButton
  - @veltra/desktop
  - checkbox
  - Checkbox
  - CheckboxButton
  - 复选框
aliases:
  - checkbox
  - UCheckbox
  - UCheckboxButton
  - Checkbox
  - CheckboxButton
  - 复选框
---

## 快速上手

```ts
import { UCheckbox, UCheckboxButton } from '@veltra/desktop'
```

## 典型示例

`UCheckbox` 绑定布尔值。`UCheckboxButton` 是按钮形态，可用 `type`（`primary` / `info` / `success` / `warning` / `danger`）和 `round`。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

`UCheckbox`：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const agreed = ref(false)
</script>

<template>
  <u-checkbox v-model="agreed">我已阅读并同意</u-checkbox>
  <u-checkbox v-model="agreed" indeterminate>半选</u-checkbox>
</template>
```

`UCheckboxButton`：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const deepThink = ref(false)
</script>

<template>
  <u-checkbox-button v-model="deepThink" type="success">深度思考</u-checkbox-button>
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ remember: false, deepThink: false })
</script>

<template>
  <u-form :model="form">
    <u-checkbox label="记住登录" field="remember">30 天内免登录</u-checkbox>
    <u-checkbox-button label="能力" field="deepThink" type="success">深度思考</u-checkbox-button>
  </u-form>
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

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

/** 复选框组件属性 */
export interface CheckboxProps extends FormComponentProps {
  /** 部分选中 */
  indeterminate?: boolean
  /** 是否选中  */
  modelValue?: boolean
}

export interface CheckboxButtonProps extends FormComponentProps {
  /** 是否选中  */
  modelValue?: boolean
  /** 是否圆角 */
  round?: boolean
  /** 类型 */
  type?: ColorType
}

export interface CheckboxEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean, e: MouseEvent): void
}

export interface CheckboxButtonEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean): void
}

/** 复选框暴露的属性和方法 */
export interface CheckboxExposed {}
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
