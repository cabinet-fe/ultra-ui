# UTableEditor 示例

## 基础

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TableColumn } from '@veltra/desktop'

const list = ref<any[]>([
  { name: '张三', age: 28 },
  { name: '李四', age: 32 }
])

const columns: TableColumn[] = [
  { key: 'name', name: '姓名', minWidth: 150 },
  { key: 'age', name: '年龄', width: 100, align: 'center' }
]
</script>

<template>
  <u-table-editor v-model:modelValue="list" :columns="columns" border />
</template>
```

## 列插槽行内编辑 + 多选

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TableColumn } from '@veltra/desktop'

const list = ref<any[]>([
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 32 }
])
const checked = ref<any[]>([])

const columns: TableColumn[] = [
  { key: 'name', name: '姓名', minWidth: 150 },
  { key: 'age', name: '年龄', width: 100, align: 'center' }
]
</script>

<template>
  <u-table-editor
    v-model:modelValue="list"
    v-model:checked="checked"
    :columns="columns"
    row-key="id"
    checkable
    border
  >
    <template #column:name="{ model }">
      <u-input v-model="model.modelValue" />
    </template>
    <template #column:age="{ model }">
      <u-input v-model.number="model.modelValue" type="number" />
    </template>
  </u-table-editor>
</template>
```

## 树形 + 行展开 + 表尾合计

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TableColumn } from '@veltra/desktop'

const list = ref<any[]>([
  {
    id: 1,
    name: '商品 A',
    price: 99,
    desc: '优质商品',
    children: [{ id: 11, name: '规格 A1', price: 99 }]
  }
])

const columns: TableColumn[] = [
  { key: 'name', name: '商品', minWidth: 200 },
  { key: 'price', name: '单价', width: 100, align: 'right', summary: true }
]
</script>

<template>
  <u-table-editor v-model:modelValue="list" :columns="columns" tree expandable row-key="id" border>
    <template #row:expand="{ rowData }">
      <div style="padding: 12px 24px">描述：{{ rowData.desc }}</div>
    </template>
  </u-table-editor>
</template>
```
