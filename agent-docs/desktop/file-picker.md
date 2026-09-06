---
title: "UFilePicker - 文件选择器"
description: "点击或拖拽拾取文件，通过 pick 事件拿到 File 列表"
---

# UFilePicker - 文件选择器

## 引入

```ts
import { UFilePicker } from '@veltra/desktop'
```

## 示例

`UFilePicker` 点击或拖入文件后触发 `pick`，参数为通过 `accept` 过滤后的 `File[]`。`multiple` 允许多选。默认插槽可拿到 `{ isDragover }`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const files = shallowRef<File[]>([])
</script>

<template>
  <u-file-picker accept="image/*" multiple @pick="files = [...files, ...$event]">
    <u-button>选择图片</u-button>
  </u-file-picker>

  <u-file-picker v-slot="{ isDragover }" @pick="files = [...files, ...$event]">
    <div>{{ isDragover ? '松开以上传' : '拖到此处或点击选择' }}</div>
  </u-file-picker>
</template>
```

## API / 类型

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

/** 文件上传器组件属性 */
export interface UploaderProps extends FormComponentProps {
  /** 渲染标签 */
  tag?: string
  /** 允许上传的文件类型 */
  accept?: string
  /** 是否允许多选 */
  multiple?: boolean
}

/** 文件上传器组件定义的事件 */
export interface UploaderEmits {
  /** 拾取 */
  (e: 'pick', files: File[]): void
}

/** 文件上传器组件暴露的属性和方法(组件内部使用) */
export interface _UploaderExposed {}

/** 文件上传器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type UploaderExposed = DeconstructValue<_UploaderExposed>
```

## 避坑与使用要点

- 在 UForm 中必须使用 field，禁止 v-model。
