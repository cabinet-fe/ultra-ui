# UTableEditor — 表格编辑器

> `import type { TableEditorProps, TableEditorEmits } from '@veltra/desktop'`

基于 `UTable` 的行数据编辑器，内置新增、复制、删除操作列。以 `v-model:modelValue` 替代 `UTable` 的 `data` prop，支持双向同步数组变更。其他 Table 功能（多选、虚拟滚动、树形数据、列固定等）全部继承。

## Import

```ts
import { UTableEditor } from '@veltra/desktop'
```

## Props

继承 `Omit<TableProps, 'data'>` 的全部属性，并新增：

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `any[]` | `[]` | 表格数据，支持 `v-model:modelValue` 双向绑定（替换 `data`） |

以下继承自 `TableProps`（`data` 除外）：

| prop | type | default | 说明 |
|------|------|---------|------|
| `columns` | `TableColumn[]` | — | 列定义。注意：组件内置 `__operation` 操作列，不要使用该 key |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 尺寸 |
| `rowKey` | `string` | — | 行唯一标识字段名，多选/单选/树形时必须 |
| `checkable` | `boolean` | — | 开启多选（需 `rowKey`） |
| `checked` | `Record<string, any>[]` | — | 多选已选项（支持 `v-model:checked`） |
| `selectable` | `boolean` | — | 开启单选（需 `rowKey`） |
| `selected` | `Record<string, any>` | — | 单选已选项（支持 `v-model:selected`） |
| `showIndex` | `boolean` | `true`（组件强制） | 显示行索引 |
| `tree` | `boolean \| string` | `false` | 树形模式。`true` 时子节点从 `children` 字段读取；传字符串表示自定义子节点字段名 |
| `expandable` | `boolean` | — | 开启行展开（非树形模式下有效） |
| `defaultExpandAll` | `boolean` | — | 默认展开全部（树形模式） |
| `current` | `TableRow` | — | 当前选中/点击的行（支持 `v-model:current`） |
| `highlightCurrent` | `boolean` | `false` | 高亮当前点击的行 |
| `stripe` | `boolean` | `false`（组件强制） | 斑马纹 |
| `border` | `boolean` | `false` | 边框 |
| `textEllipsis` | `boolean` | — | 文本溢出省略 |
| `virtual` | `boolean` | — | 开启虚拟滚动 |
| `virtualThreshold` | `number` | `80` | 虚拟滚动阈值，超过此值且 `virtual` 未显式为 `false` 时自动开启 |
| `mergeCell` | `(ctx: TableColumnRenderContext) => { rowspan: number; colspan: number } \| undefined` | — | 单元格合并函数 |
| `slots` | `Readonly<Slots>` | — | 传入外部作用域插槽 |

> `showIndex` 和 `stripe` 由组件内部强制设置，外部传入的值会被忽略。

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: any[])` | 数据变更（新增、复制、删除时触发） |

此外继承 `TableEmits` 的全部事件：

| event | 参数 | 说明 |
|-------|------|------|
| `update:checked` | `(value: DataItem[])` | 多选项变更 |
| `update:selected` | `(value: DataItem \| undefined)` | 单选项变更 |
| `update:current` | `(row?: TableRow)` | 当前行变更 |
| `update:rows` | `(rows: TableRow[])` | 行数据更新 |
| `update:forest` | `(rows?: Forest<Record<string, unknown>, any>)` | 树形数据森林结构更新 |
| `row-click` | `(row: TableRow, ev: MouseEvent)` | 行点击事件 |
| `cell-click` | `(row: TableRow, column: TableColumn, ev: MouseEvent)` | 单元格点击事件 |

## Slots

通过 `:slots="$slots"` 透传所有父级插槽到内部 `UTable`。以下插槽可用（与 `UTable` 一致）：

| slot | 作用域 | 说明 |
|------|--------|------|
| `column:{key}` | `TableColumnSlotsScope` | 动态列插槽，`{key}` 为列定义的 `key` 字段值。作用域含 `model` 双向绑定对象 |
| `header:{key}` | `{ column: ColumnNode }` | 动态表头插槽，`{key}` 为列定义的 `key` 字段值 |
| `row:expand` | `TableRowSlotsScope` | 展开行内容（需设置 `expandable` 或 `tree`） |
| `body` | `{ columns: ColumnNode[]; rows: TableRowNode[] }` | 自定义整个 body 内容 |
| `foot` | `{ columns: ColumnNode[]; rows: TableRowNode[] }` | 自定义表尾（合计行） |
| `append` | — | 追加在表格滚动区域之后的内容 |

> **注意**：`column:__operation` 和 `empty` 插槽由组件内部使用，父级传入会被覆盖。

## Exposed

组件不暴露任何公开方法或属性。

## 操作列行为

组件在每个数据行末尾追加一个固定操作列（key: `__operation`，width: `120px`），提供三个按钮：

| 按钮 | 图标 | 行为 |
|------|------|------|
| 删除 | `Minus` | 移除当前行 |
| 新增 | `Plus` | 在当前行下方插入一个空对象 `{}` |
| 复制 | `Copy` | 深拷贝当前行数据并插入到下一行 |

表为空时，`empty` 插槽显示一个「添加」按钮（无图标，`text` 按钮），点击后追加一行空数据。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTableEditor } from '@veltra/desktop'
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

### 列插槽编辑 + 多选

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTableEditor, UInput } from '@veltra/desktop'
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

### 树形数据编辑

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTableEditor } from '@veltra/desktop'
import type { TableColumn } from '@veltra/desktop'

const treeData = ref<any[]>([
  {
    id: 1,
    name: '一级节点',
    children: [
      { id: 2, name: '二级节点 A' },
      { id: 3, name: '二级节点 B' }
    ]
  }
])

const columns: TableColumn[] = [
  { key: 'name', name: '名称', minWidth: 200 }
]
</script>

<template>
  <u-table-editor
    v-model:modelValue="treeData"
    :columns="columns"
    tree
    row-key="id"
    border
  />
</template>
```

### 行展开 + 自定义表尾

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTableEditor } from '@veltra/desktop'
import type { TableColumn } from '@veltra/desktop'

const list = ref<any[]>([
  { id: 1, name: '商品 A', price: 99, desc: '优质商品' },
  { id: 2, name: '商品 B', price: 150, desc: '热销商品' }
])

const columns: TableColumn[] = [
  { key: 'name', name: '商品', minWidth: 150 },
  { key: 'price', name: '单价', width: 100, align: 'right', summary: true }
]
</script>

<template>
  <u-table-editor
    v-model:modelValue="list"
    :columns="columns"
    expandable
    row-key="id"
    border
  >
    <template #row:expand="{ rowData }">
      <div style="padding: 12px 24px">
        描述：{{ rowData.desc }}
      </div>
    </template>
  </u-table-editor>
</template>
```
