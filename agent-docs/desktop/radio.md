---
title: "URadio - 单选框"
description: "单个单选框用 value 匹配 model；表单场景请用 URadioGroup 加 field"
keywords:
  - URadio
  - @veltra/desktop
  - radio
  - Radio
  - 单选框
aliases: ["radio", "URadio", "Radio", "单选框"]
---

## 快速上手

```ts
import { URadio } from '@veltra/desktop'
```

## 典型示例

多个 `URadio` 绑定同一个 `v-model`，用 `value` 区分选项。文案可用 `label` 或默认插槽。独立使用不要写 `field`。表单里请用 `URadioGroup` + `field`，不要给多个 `URadio` 写同一个 `field`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const selected = shallowRef('1')
const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]
</script>

<template>
  <u-radio
    v-for="item of items"
    :key="item.value"
    v-model="selected"
    :value="item.value"
    :disabled="item.value === '3'"
  >
    {{ item.label }}
  </u-radio>
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

/** 单选框组件属性 */
export interface RadioProps extends FormComponentProps {
  /** 单选框值 */
  value?: any
  /** 文本 */
  label?: string
  /**全部禁用 */
  disabled?: boolean
  /** 绑定值 */
  modelValue?: any
}

/** 单选框组件定义的事件 */
export interface RadioEmits {
  (e: 'update:modelValue', value: any): void
}

/** 单选框组件暴露的属性和方法(组件内部使用) */
export interface _RadioExposed {
  change: (isChecked: boolean) => void
}

/** 单选框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioExposed = DeconstructValue<_RadioExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
