# UTable — 数据表格

> `import type { TableProps, TableExposed } from '@veltra/desktop'`

支持排序、多选/单选、树形数据、行展开、虚拟滚动、列固定、列宽拖拽、表尾合计。

## Import

```ts
import { UTable, defineTableColumns } from '@veltra/desktop'
// 或按需
import { UTable } from '@veltra/desktop'
```

## Column Definition

```ts
interface TableColumn {
  key: string              // 列唯一键（对应数据字段名）
  name: string             // 列名（表头文本）
  width?: number           // 列宽(px)
  minWidth?: number        // 最小列宽
  fixed?: 'left' | 'right' // 固定列
  align?: 'left' | 'center' | 'right'
  render?: (ctx: TableColumnRenderContext) => VNode  // 自定义渲染
  children?: TableColumn[] // 多级表头
  summary?: boolean | ((ctx: TableSummaryContext) => VNode)  // 合计
  resizable?: boolean      // 可拖拽调整列宽
}
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `data` | `Record[]` | — | 表格数据 |
| `columns` | `TableColumn[]` | — | 列定义 |
| `checkable` | `boolean` | — | 多选（需 `rowKey`） |
| `selectable` | `boolean` | — | 单选（需 `rowKey`） |
| `checked` | `Record[]` | — | 多选已选项 |
| `selected` | `Record` | — | 单选已选项 |
| `rowKey` | `string` | — | 行唯一标识（多选/单选必须） |
| `showIndex` | `boolean` | — | 显示行索引 |
| `tree` | `boolean \| string` | `false` | 树形模式，字符串为子节点 key |
| `stripe` | `boolean` | `true` | 斑马纹 |
| `border` | `boolean` | `false` | 边框 |
| `expandable` | `boolean` | — | 可展开行（非树形） |
| `defaultExpandAll` | `boolean` | — | 默认展开全部（树形） |
| `virtualThreshold` | `number` | `80` | 虚拟滚动阈值 |
| `size` | `ComponentSize` | — | 尺寸 |

## Emits

| event | 参数 |
|-------|------|
| `update:checked` | `(value: DataItem[])` |
| `update:selected` | `(value: DataItem \| undefined)` |
| `row-click` | `(row: TableRow, ev: MouseEvent)` |
| `cell-click` | `(row: TableRow, column: TableColumn, ev: MouseEvent)` |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `column:{key}` | `TableColumnSlotsScope` | 动态列插槽 |
| `row:expand` | `{ row, rowData, columns, index }` | 展开行内容 |
| `empty` | — | 空状态 |

## Exposed

| 方法 | 说明 |
|------|------|
| `clearChecked()` | 清除多选 |
| `clearSelected()` | 清除单选 |
| `getRowByData(data)` | 通过数据获取行实例 |
| `getSummaryRow()` | 获取合计行数据 |

## `defineTableColumns(columns, commonProps?)`

批量设置列默认 `align`、`minWidth` 等：

```ts
const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄' }
], { align: 'center', minWidth: 100 })
```

## Examples

### 基础表格

```vue
<script setup>
import { UTable, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '姓名', width: 120 },
  { key: 'age', name: '年龄', width: 80, align: 'center' },
  { key: 'address', name: '地址', minWidth: 200 }
])

const data = [
  { name: '张三', age: 28, address: '北京市' },
  { name: '李四', age: 32, address: '上海市' }
]
</script>

<template>
  <u-table :columns="columns" :data="data" border stripe />
</template>
```

### 多选表格

```vue
<script setup>
import { ref } from 'vue'
import { UTable } from '@veltra/desktop'

const checked = ref([])
const columns = [
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄', align: 'center' }
]
</script>

<template>
  <u-table
    checkable
    row-key="id"
    :columns="columns"
    :data="data"
    v-model:checked="checked"
    border
  />
</template>
```

### 操作列（推荐 #column:action 插槽）

```vue
<script setup>
import { UAction, UActionGroup, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称' },
  { key: 'action', name: '操作', width: 150, align: 'center' }
])
</script>

<template>
  <u-table :columns="columns" :data="data" row-key="id">
    <template #column:action>
      <u-action-group :max="4">
        <u-action @run="handleEdit">编辑</u-action>
        <u-action need-confirm type="danger" @run="handleDelete">删除</u-action>
      </u-action-group>
    </template>
  </u-table>
</template>
```

### 树形表格

```vue
<script setup>
import { UTable } from '@veltra/desktop'

const columns = [
  { key: 'name', name: '名称', minWidth: 200 },
  { key: 'size', name: '大小', width: 100, align: 'right' }
]

const data = [
  {
    name: 'src',
    children: [
      { name: 'components', children: [{ name: 'Button.vue', size: '3.2 KB' }] },
      { name: 'App.vue', size: '1.1 KB' }
    ]
  }
]
</script>

<template>
  <u-table tree :columns="columns" :data="data" border />
</template>
```

### 自定义列渲染

```vue
<script setup>
import { h } from 'vue'
import { UTag } from '@veltra/desktop'

const columns = [
  {
    key: 'status',
    name: '状态',
    render({ val }) {
      return h(UTag, { type: val === 1 ? 'success' : 'danger' },
        () => val === 1 ? '启用' : '禁用')
    }
  },
  { key: 'name', name: '姓名' }
]
</script>
```

### 行展开 + 合计

```vue
<u-table expandable :columns="columns" :data="data">
  <template #row:expand="{ rowData }">
    <div style="padding: 16px">详情：{{ rowData.name }}</div>
  </template>
</u-table>
```

### 配合 UPaginator

```vue
<script setup>
import { ref, computed } from 'vue'

const allData = ref([...])
const pageNumber = ref(1)
const pageSize = ref(10)
const pagedData = computed(() => {
  const s = (pageNumber.value - 1) * pageSize.value
  return allData.value.slice(s, s + pageSize.value)
})
</script>

<template>
  <u-table :columns="columns" :data="pagedData" />
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="allData.length"
    :page-size-options="[10, 20, 50]"
  />
</template>
```
