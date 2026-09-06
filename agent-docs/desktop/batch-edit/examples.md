---
title: UBatchEdit 批量编辑示例
description: 左侧表格加右侧表单；表单控件必须写 field，不要并用 v-model
---

`UBatchEdit` 用 `v-model:data` 绑定行数组，`columns` 描述左侧表。`model` 是与右侧表单同步的对象。`#form` 里的控件必须写 `field`，不要再写 `v-model`。可用 `defineBatchEditColumns` 标注列类型。`features` 限制 `create` / `update` / `delete` / `view` / `createChild`。`quick-edit` 时编辑行会实时写回 `row.data`，不调用 `saveMethod`。

```vue
<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import { defineBatchEditColumns } from '@veltra/desktop'

const columns = defineBatchEditColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '年龄', key: 'age', width: 80 }
])
const data = shallowRef([{ name: '张三', age: 28 }])
const model = reactive({ name: '', age: undefined as number | undefined })
</script>

<template>
  <u-batch-edit
    v-model:data="data"
    :columns="columns"
    :model="model"
    :features="['create', 'update', 'delete']"
    :actions-props="{ delete: { needConfirm: true } }"
  >
    <template #form>
      <u-input field="name" label="姓名" :rules="{ required: true }" />
      <u-number-input field="age" label="年龄" :min="0" :max="120" />
    </template>
  </u-batch-edit>
</template>
```
