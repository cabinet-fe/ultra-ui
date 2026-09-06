---
title: "UExpressionEditor - 表达式编辑器"
description: "输入 @ 插入变量；selectableLevels 控制分支节点能否选中"
keywords:
  - UExpressionEditor
  - @veltra/desktop
  - expression-editor
  - ExpressionEditor
  - 表达式编辑器
aliases: ["expression-editor", "UExpressionEditor", "ExpressionEditor", "表达式编辑器"]
---
## 快速上手

```ts
import { UExpressionEditor } from '@veltra/desktop'
```

## 典型示例

`UExpressionEditor` 绑定表达式字符串。`variables` 为树形 `VariableItem[]`（`label` / `value` / `children?`）。键入 `@` 打开变量面板。`selectableLevels` 默认 `'leaf'`（只选叶子）；`'any'` 时分支节点 Enter 选中自身。独立使用 `v-model`；在 `UForm` 内用 `field`，不要并用 `v-model`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { VariableItem } from '@veltra/desktop'

const expression = shallowRef('欢迎 {form.user.name}')
const variables: VariableItem[] = [
  {
    label: '表单',
    value: 'form',
    children: [
      { label: '用户名', value: 'form.user.name' },
      { label: '部门', value: 'form.department' }
    ]
  }
]
</script>

<template>
  <u-expression-editor
    v-model="expression"
    :variables="variables"
    placeholder="输入 @ 插入变量"
  />
  <u-expression-editor v-model="expression" :variables="variables" selectable-levels="any" />
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

export interface VariableItem {
  label: string
  value: string
  /** 可选类型标识（如 string、number） */
  type?: string
  /** 子级变量（支持树形结构） */
  children?: VariableItem[]
}

/** 选中范围：仅叶子节点，或允许任意层级（含分支） */
export type ExpressionSelectableLevels = 'leaf' | 'any'

/** 表达式编辑器组件属性 */
export interface ExpressionEditorProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  /** 变量列表 */
  variables?: VariableItem[]
  /**
   * 是否允许选中任意层级的变量（含中间分支）。
   * - `'leaf'`（默认）：仅叶子节点可选；分支节点上 Enter / → 进入下一级
   * - `'any'`：分支节点上 Enter 选中分支本身、→ 进入下一级
   */
  selectableLevels?: ExpressionSelectableLevels
}

/** 表达式编辑器组件定义的事件 */
export interface ExpressionEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 表达式编辑器组件暴露的属性和方法(组件内部使用) */
export interface _ExpressionEditorExposed {}

/** 表达式编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ExpressionEditorExposed = DeconstructValue<_ExpressionEditorExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
