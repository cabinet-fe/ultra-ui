# UTableEditor — 表格编辑器

> `import type { TableEditorProps, TableEditorEmits } from '@veltra/desktop'`

基于 `UTable` 的行数据编辑器，内置新增/复制/删除操作列。用 `v-model:modelValue` 替代 `UTable` 的 `data` prop。其他 Table 功能（多选、虚拟滚动、树形、列固定）全部继承。

## Import

```ts
// UTableEditor 由 Vite 自动导入，无需手动 import
```

## Props

继承 `Omit<TableProps, 'data'>`（详见 `table.md`），新增：

| prop         | type    | default | 说明                                              |
| ------------ | ------- | ------- | ------------------------------------------------- |
| `modelValue` | `any[]` | `[]`    | 表格数据，`v-model:modelValue` 双向绑定           |

**强制覆盖**：`showIndex`（始终 `true`）、`stripe`（始终 `false`），传入会被忽略。
**保留 key**：组件内置 `__operation` 操作列，列定义不要使用此 key。

## Emits

继承 `TableEmits`，追加：

| event               | 参数             | 说明                               |
| ------------------- | ---------------- | ---------------------------------- |
| `update:modelValue` | `(value: any[])` | 数据变更（新增/复制/删除时触发）   |

## Slots

与 `UTable` 一致（透传所有父级插槽），但 **`column:__operation` 和 `empty` 由组件内部占用**，父级传入会被覆盖。列插槽作用域 `{ model: { modelValue, onUpdate:modelValue } }` 用于行内编辑。

## Exposed

```ts
interface TableEditorExposed {}
```

## Examples

### 基础

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

### 列插槽行内编辑 + 多选

列插槽作用域 `model` 封装了双向绑定对象（`modelValue` + `onUpdate:modelValue`），直接 `v-model="model.modelValue"`：

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

### 树形 + 行展开 + 表尾合计

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TableColumn } from '@veltra/desktop'

const list = ref<any[]>([
  { id: 1, name: '商品 A', price: 99, desc: '优质商品',
    children: [{ id: 11, name: '规格 A1', price: 99 }] }
])

const columns: TableColumn[] = [
  { key: 'name', name: '商品', minWidth: 200 },
  { key: 'price', name: '单价', width: 100, align: 'right', summary: true }
]
</script>

<template>
  <u-table-editor
    v-model:modelValue="list"
    :columns="columns"
    tree expandable row-key="id" border
  >
    <template #row:expand="{ rowData }">
      <div style="padding: 12px 24px">描述：{{ rowData.desc }}</div>
    </template>
  </u-table-editor>
</template>
```
