---
title: "UConditionEditor - 条件编辑器"
description: "编辑条件表达式 JSON；evaluateConditionExpression 可脱离 UI 求值"
---

# UConditionEditor - 条件编辑器

## 引入

```ts
import { UConditionEditor } from '@veltra/desktop'
```

## 示例

`UConditionEditor` 的 `v-model` 是根分组 `ConditionExpression`（`type: 'group'`，含 `children` 与 `connectors`）。`fields` 描述可选字段（`label` / `value` / `type`）。可用 `createEmptyGroup` / `createEmptyLeaf` 构造空节点。`evaluateConditionExpression(expr, { fields, data })` 是纯函数，空表达式返回 `true`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import {
  createEmptyGroup,
  createEmptyLeaf,
  evaluateConditionExpression,
  type ConditionExpression,
  type ConditionField
} from '@veltra/desktop'

const fields: ConditionField[] = [
  { label: '状态', value: 'status', type: 'string' },
  { label: '优先级', value: 'priority', type: 'number' }
]

const expr = shallowRef<ConditionExpression>({
  type: 'group',
  connectors: [],
  children: [
    {
      type: 'condition',
      field: 'status',
      operator: 'eq',
      value: { kind: 'constant', value: 'open' }
    }
  ]
})

const passed = evaluateConditionExpression(expr.value, {
  fields,
  data: { status: 'open', priority: 1 }
})

const empty = createEmptyGroup()
empty.children = [createEmptyLeaf()]
empty.connectors = []
</script>

<template>
  <u-condition-editor v-model="expr" :fields="fields" />
</template>
```

## API / 类型

```ts
export type ComponentSize = 'small' | 'default' | 'large'

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

/** 字段定义 */
export interface ConditionField {
  label: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  enumOptions?: { label: string; value: string }[]
}

/** 条件右侧值：常量或变量引用 */
export type ConditionValue =
  | { kind: 'constant'; value: string }
  | { kind: 'variable'; name: string }

/** 单行条件叶子节点 */
export interface ConditionLeaf {
  type: 'condition'
  field: string
  operator: string
  value: ConditionValue
}

/** 行间逻辑连接符 */
export type ConditionConnector = 'and' | 'or'

/** 条件组节点 —— 与叶子节点通过 children 统一编排 */
export interface ConditionGroup {
  type: 'group'
  children: ConditionNode[]
  /**
   * 子项之间的连接符
   *
   * - `connectors[i]` 用于 `children[i]` 与 `children[i + 1]` 之间
   * - 长度应等于 `children.length - 1`；缺失项默认为 `and`
   */
  connectors: ConditionConnector[]
}

/** 树节点：叶子或分组 */
export type ConditionNode = ConditionLeaf | ConditionGroup

/** 顶层表达式 = 根分组 */
export type ConditionExpression = ConditionGroup

export interface ConditionEditorProps {
  modelValue?: ConditionExpression
  fields?: ConditionField[]
  variables?: VariableItem[]
  size?: ComponentSize
  disabled?: boolean
  readonly?: boolean
}

export interface ConditionEditorEmits {
  (e: 'update:modelValue', value: ConditionExpression): void
}

export interface _ConditionEditorExposed {}

export type ConditionEditorExposed = DeconstructValue<_ConditionEditorExposed>
```

### 辅助工具

本组件通常配合以下工具来使用。

#### evaluateConditionExpression

对条件表达式 JSON 求值，与编辑器 UI 解耦的纯函数。

使用示例:

```ts
import { evaluateConditionExpression } from '@veltra/desktop'
```

#### createEmptyGroup / createEmptyLeaf

创建空的条件分组或叶子节点。

使用示例:

```ts
import { createEmptyGroup, createEmptyLeaf } from '@veltra/desktop'
```

## 避坑与使用要点

- 在 UForm 中必须使用 field，禁止 v-model。
