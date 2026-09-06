---
title: UExpressionEditor 表达式编辑器示例
description: 输入 @ 插入变量；selectableLevels 控制分支节点能否选中
---

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
