---
title: UTableEditor 表格编辑器示例
description: 用 v-model 绑定行数组，列插槽的 model 可直接绑到单元格控件
---

`UTableEditor` 内部复用 `UTable`，数据用 `v-model`（行对象数组）。列定义与表格相同，可用 `defineTableColumns`。单元格编辑用 `#column:{key}`，作用域里的 `model` 含 `modelValue` 与 `onUpdate:modelValue`，可 `v-bind` 到输入控件。组件会追加操作列（增删复制）。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄' }
])
const data = shallowRef([{ name: '张三', age: 28 }])
</script>

<template>
  <u-table-editor :columns="columns" v-model="data">
    <template #column:name="{ model }">
      <u-input v-bind="model" />
    </template>
    <template #column:age="{ model }">
      <u-number-input v-bind="model" />
    </template>
  </u-table-editor>
</template>
```
