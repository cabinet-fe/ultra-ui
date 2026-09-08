---
title: "UInput - 输入框"
description: "文本输入、前后缀与 pattern，以及在 UForm 内用 field 绑定"
keywords:
  - UInput
  - @veltra/desktop
  - input
  - Input
  - 输入框
aliases: ["input", "UInput", "Input", "输入框"]
---

## 快速上手

```ts
import { UInput } from '@veltra/desktop'
```

## 典型示例

独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。可用 `prefix` / `suffix` 字符串，或 `#prefix` / `#suffix` 插槽。`pattern` 限制可输入内容。

独立使用：

```vue
<script setup lang="ts">
import { Search } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

const keyword = shallowRef('')
</script>

<template>
  <u-input v-model="keyword" placeholder="请输入关键词" clearable />
  <u-input v-model="keyword" prefix="前缀" clearable>
    <template #suffix>
      <u-icon :size="14"><Search /></u-icon>
    </template>
  </u-input>
  <u-input v-model="keyword" :pattern="/^\d*$/" placeholder="仅数字" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ username: '' })
</script>

<template>
  <u-form :model="form">
    <u-input
      label="用户名"
      field="username"
      placeholder="请输入用户名"
      :rules="{ required: true, minLen: [2, '至少 2 个字符'] }"
    />
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

import type { ShallowRef } from 'vue'

/** 输入框组件属性 */
export interface InputProps extends FormComponentProps {
  /** modelValue */
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 前缀 */
  prefix?: string
  /** 后缀 */
  suffix?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 原生只读 */
  nativeReadonly?: boolean
  /**
   * 模式
   * @description 如果指定请保证有一个符合模式的默认值
   */
  pattern?: RegExp
}

export interface InputEmits {
  /** 输入时持续更新 */
  (e: 'update:modelValue', value: string): void
  /** 在输入框失焦时触发更新 */
  (e: 'change', value: string): void
  /** 后缀点击事件 */
  (e: 'suffix:click', value?: string): void
  /** 前缀点击事件 */
  (e: 'prefix:click', value?: string): void
  /** 聚焦事件 */
  (e: 'focus', value?: string): void
  /** 清除事件 */
  (e: 'clear'): void
  /** 失焦事件 */
  (e: 'blur', value?: string): void
  /** 原生输入事件 */
  (e: 'native:input', ev: Event): void
}

export interface _InputExposed {
  el: ShallowRef<HTMLInputElement | undefined>
}

export type InputExposed = DeconstructValue<_InputExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
