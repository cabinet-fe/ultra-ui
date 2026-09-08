---
title: "URichTextEditor - 富文本编辑器"
description: "用 v-model 绑定 HTML 或 JSON；表单内用 field"
keywords:
  - URichTextEditor
  - @veltra/desktop
  - rich-text-editor
  - RichTextEditor
  - 富文本编辑器
aliases: ["rich-text-editor", "URichTextEditor", "RichTextEditor", "富文本编辑器"]
---

## 快速上手

```ts
import { URichTextEditor } from '@veltra/desktop'
```

## 典型示例

`URichTextEditor` 的 `format` 为 `'html'`（默认语义）或 `'json'`。`toolbar` 为工具栏项数组，项可以是 `'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'heading' | 'bullet-list' | 'ordered-list' | 'blockquote' | 'code-block' | 'link' | 'undo' | 'redo' | '|'`。独立使用 `v-model`；在 `UForm` 内写 `field`，不要并用 `v-model`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const html = shallowRef('<p>Hello</p>')
</script>

<template>
  <u-rich-text-editor
    v-model="html"
    format="html"
    placeholder="请输入内容"
    :toolbar="['bold', 'italic', '|', 'bullet-list', 'link']"
  />
</template>
```

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ content: '' })
</script>

<template>
  <u-form :model="form">
    <u-rich-text-editor label="正文" field="content" placeholder="请输入富文本" />
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

/** 富文本数据格式 */
export type RichTextFormat = 'html' | 'json'

/** 工具栏项 */
export type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'heading'
  | 'bullet-list'
  | 'ordered-list'
  | 'blockquote'
  | 'code-block'
  | 'link'
  | 'undo'
  | 'redo'
  | '|'

/** 富文本编辑器组件属性 */
export interface RichTextEditorProps extends FormComponentProps {
  modelValue?: string
  /** 数据格式：html 或 json */
  format?: RichTextFormat
  /** 工具栏配置 */
  toolbar?: ToolbarItem[]
  /** 占位文本 */
  placeholder?: string
}

/** 富文本编辑器组件定义的事件 */
export interface RichTextEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 富文本编辑器组件暴露的属性和方法(组件内部使用) */
export interface _RichTextEditorExposed {}

/** 富文本编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RichTextEditorExposed = DeconstructValue<_RichTextEditorExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
