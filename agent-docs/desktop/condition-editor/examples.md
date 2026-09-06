---
title: UConditionEditor 条件编辑器示例
description: 编辑条件表达式 JSON；evaluateConditionExpression 可脱离 UI 求值
---

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
