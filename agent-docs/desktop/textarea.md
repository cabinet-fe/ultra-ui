---
title: "UTextarea - 文本域"
description: "多行输入、字数统计与自适应高度，以及在 UForm 内用 field 绑定"
keywords:
  - UTextarea
  - @veltra/desktop
  - textarea
  - Textarea
  - 文本域
aliases: ["textarea", "UTextarea", "Textarea", "文本域"]
---

## 快速上手

```ts
import { UTextarea } from '@veltra/desktop'
```

## 典型示例

独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。`autosize` 随内容增高；`show-count` 配合 `maxlength` 显示字数；`resize` 控制能否拖拽。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const text = shallowRef('')
</script>

<template>
  <u-textarea v-model="text" :rows="3" autosize placeholder="请输入" />
  <u-textarea v-model="text" :maxlength="200" show-count clearable />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ description: '' })
</script>

<template>
  <u-form :model="form">
    <u-textarea label="简介" field="description" :rows="3" span="full" placeholder="请输入简介" />
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

/** textarea组件属性 */
export interface TextareaProps extends FormComponentProps {
  /**
   * 文本域的值
   */
  modelValue?: string
  /**
   * 文本域的高度
   */
  height?: string
  /**
   * 文本域的占位符
   */
  placeholder?: string
  /**
   * 文本域是否禁用
   */
  disabled?: boolean
  /**
   * 文本域是否只读
   */
  readonly?: boolean

  /**
   * 是否能被缩放
   */
  resize?: boolean
  /**
   * 文本域的行数
   */
  rows?: number
  /**
   * 文本域的列数
   */
  cols?: number
  /**
   * 文本域的最大字数
   */
  maxlength?: number
  /**
   * 是否显示字符数
   */
  showCount?: boolean
  /**
   * 清空
   */
  clearable?: boolean

  /** 原生只读 */
  nativeReadonly?: boolean

  /**是否自适应大小 */
  autosize?: boolean
}

/** textarea组件定义的事件 */
export interface TextareaEmits {
  /**modelValue值改变时触发 */
  (e: 'update:modelValue', value: string): void
  /**当 modelValue 改变时，并且文本框失去焦点或用户按Enter时触发 */
  (e: 'change', value: string): void
  /**文本框获取焦点时触发 */
  (e: 'focus'): void
  /**文本框失去焦点时触发 */
  (e: 'blur'): void
  /**清空按钮时触发 */
  (e: 'clear'): void
}

/** textarea组件暴露的属性和方法(组件内部使用) */
export interface _TextareaExposed {}

/** textarea组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextareaExposed = DeconstructValue<_TextareaExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
