---
title: UTable 表格示例
description: 用 defineTableColumns 定义列，data 提供行数据；列插槽名为 column:key
---

`UTable` 用 `data` 与 `columns`。`defineTableColumns(columns, commonProps?)` 会按 DFS 把 `align` / `minWidth` 合并到尚未设置的列上。多选需要 `checkable` 与 `rowKey`，用 `v-model:checked`。树形把 `tree` 设为 `true` 或子节点字段名。自定义单元格用 `#column:{key}`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const checked = shallowRef<Record<string, unknown>[]>([])
const columns = defineTableColumns(
  [
    { key: 'name', name: '姓名', width: 120, fixed: 'left' },
    { key: 'age', name: '年龄', align: 'center' },
    { key: 'action', name: '操作', align: 'center' }
  ],
  { minWidth: 80 }
)
const data = [
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 32 }
]
</script>

<template>
  <u-table
    row-key="id"
    checkable
    border
    :columns="columns"
    :data="data"
    v-model:checked="checked"
  >
    <template #column:action="{ rowData }">
      <u-button text type="primary">编辑 {{ rowData.name }}</u-button>
    </template>
  </u-table>
</template>
```

树形表示例：

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称' },
  { key: 'role', name: '角色' }
])
const data = [
  {
    id: 1,
    name: '技术部',
    role: '部门',
    children: [{ id: 11, name: '张三', role: '工程师' }]
  }
]
</script>

<template>
  <u-table tree row-key="id" default-expand-all :columns="columns" :data="data" />
</template>
```
