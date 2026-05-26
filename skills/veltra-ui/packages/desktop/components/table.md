# UTable — 表格

> `import type { TableProps, TableColumn, TableEmits, TableExposed, TableColumnRenderContext, TableColumnSlotsScope, TableRowSlotsScope, TableSummaryContext, TableRow, TableColumnNode } from '@veltra/desktop'`

支持多级表头、多选/单选、树形数据、行展开、虚拟滚动、列固定、列宽拖拽、单元格合并、表尾合计、斑马纹、文字溢出省略。

## Import

```ts
// UTable 由 Vite 自动导入，无需手动 import
import { defineTableColumns } from '@veltra/desktop'
```

## 关联类型

```ts
interface TableColumn {
  key: string                                           // 列唯一键 = 数据字段名 = 列插槽匹配名
  name: string                                          // 表头文本（优先级低于 nameRender）
  nameRender?: (ctx: { column: TableColumnNode }) => RenderReturn  // 自定义表头渲染
  width?: number                                        // 列最大宽度（px）
  minWidth?: number                                     // 列最小宽度（px）
  fixed?: 'left' | 'right'                              // 列固定（嵌套表头时无效）
  align?: 'left' | 'center' | 'right'                   // 列对齐，默认 'left'
  headerAlign?: 'left' | 'center' | 'right'             // 表头对齐，默认跟随 align
  render?: (scope: TableColumnRenderContext) => RenderReturn  // 自定义单元格渲染
  children?: TableColumn[]                              // 多级表头
  summary?: boolean | ((ctx: TableSummaryContext) => RenderReturn)  // 表尾合计
  resizable?: boolean                                   // 列宽可拖拽
  [key: string]: any                                    // 透传到列插槽的额外属性
}

interface TableColumnRenderContext {
  row: TableRow
  rowData: Record<string, any>
  column: TableColumnNode
  val: any
}

interface TableColumnSlotsScope extends TableColumnRenderContext {
  model: { modelValue: any; 'onUpdate:modelValue': (val: any) => void }  // 行内编辑用
}

interface TableRowSlotsScope {
  row: TableRow
  rowData: Record<string, any>
  columns: TableColumnNode[]
  index: number
}

interface TableSummaryContext {
  total: number
  rows: TableRow[]
  checkedRows: Set<TableRow>
  column: TableColumnNode
}

interface TableRow extends TreeNode<Record<string, any>> {
  expanded: boolean
  operating: boolean
  checked: boolean
  isCurrent: boolean
  uid: number | string
  indexes: number[]
  children?: TableRow[]
  parent?: TableRow
  isExpandRow: boolean
}
```

### `defineTableColumns(columns, commonProps?)`

批量设置列公共属性（DFS 遍历包括子列），仅当列自身未定义某属性时才合并 `commonProps`。`commonProps` 仅支持 `align` 与 `minWidth`。

```ts
const columns = defineTableColumns(
  [
    { key: 'name', name: '姓名' },
    { key: 'age', name: '年龄', align: 'right' },  // align 不被覆盖
    { key: 'address', name: '地址' }
  ],
  { align: 'center', minWidth: 100 }
)
```

## Props

| prop               | type                                                                              | default     | 说明                                                                            |
| ------------------ | --------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| `data`             | `Record<string, any>[]`                                                           | —           | 表格数据                                                                        |
| `columns`          | `TableColumn[]`                                                                   | —           | 列定义                                                                          |
| `rowKey`           | `string`                                                                          | —           | 行唯一标识字段名（多选/单选/树形必须）                                          |
| `size`             | `ComponentSize`                                                                   | `'default'` | 尺寸                                                                            |
| `checkable`        | `boolean`                                                                         | —           | 多选（需 `rowKey`），配合 `v-model:checked`                                     |
| `selectable`       | `boolean`                                                                         | —           | 单选（需 `rowKey`），配合 `v-model:selected`                                    |
| `current`          | `TableRow`                                                                        | —           | 当前行（`v-model:current`）                                                     |
| `highlightCurrent` | `boolean`                                                                         | `false`     | 高亮当前点击行                                                                  |
| `showIndex`        | `boolean`                                                                         | —           | 显示行索引（左侧固定列，60px）                                                  |
| `tree`             | `boolean \| string`                                                               | `false`     | 树形：`true` 用 `children` 字段；传字符串自定义子节点字段名                     |
| `expandable`       | `boolean`                                                                         | —           | 行展开（非树形模式下有效）                                                      |
| `defaultExpandAll` | `boolean`                                                                         | —           | 默认展开全部（树形）                                                            |
| `stripe`           | `boolean`                                                                         | `true`      | 斑马纹                                                                          |
| `border`           | `boolean`                                                                         | `false`     | 边框                                                                            |
| `textEllipsis`     | `boolean`                                                                         | —           | 文本溢出省略                                                                    |
| `virtualThreshold` | `number`                                                                          | `80`        | 虚拟滚动阈值，超过此值自动开启；`0` 强制开启                                    |
| `mergeCell`        | `(ctx: TableColumnRenderContext) => { rowspan: number; colspan: number } \| undefined` | —     | 单元格合并函数                                                                  |
| `slots`            | `Readonly<Slots>`                                                                 | —           | 跨组件传入外部作用域插槽                                                        |

## Emits

| event             | 参数                                                   | 说明                  |
| ----------------- | ------------------------------------------------------ | --------------------- |
| `update:checked`  | `(value: DataItem[])`                                  | 多选项变更            |
| `update:selected` | `(value: DataItem \| undefined)`                       | 单选项变更            |
| `update:current`  | `(row?: TableRow)`                                     | 当前行变更            |
| `update:rows`     | `(rows: TableRow[])`                                   | 行数据更新            |
| `update:forest`   | `(rows?: Forest<Record<string, unknown>, any>)`        | 树形森林结构更新      |
| `row-click`       | `(row: TableRow, ev: MouseEvent)`                      | 行点击                |
| `cell-click`      | `(row: TableRow, column: TableColumn, ev: MouseEvent)` | 单元格点击            |

## Slots

| slot           | 作用域                                            | 说明                                                                          |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `column:{key}` | `TableColumnSlotsScope`                           | 动态列插槽（`{key}` = 列 `key`），作用域含 `model` 双向绑定对象（行内编辑用） |
| `header:{key}` | `{ column: ColumnNode }`                          | 动态表头插槽                                                                  |
| `row:expand`   | `TableRowSlotsScope`                              | 展开行内容（需 `expandable` 或 `tree`）                                       |
| `body`         | `{ columns: ColumnNode[]; rows: TableRowNode[] }` | 自定义整个 body                                                               |
| `foot`         | `{ columns: ColumnNode[]; rows: TableRowNode[] }` | 自定义表尾                                                                    |
| `empty`        | —                                                 | 空数据                                                                        |
| `append`       | —                                                 | 追加在表格滚动区域之后                                                        |

**优先级**：列插槽 `column:{key}` > 列 `render` 函数。

## Exposed

```ts
interface TableExposed {
  el: HTMLElement | undefined
  clearChecked(): void
  clearSelected(): void
  getRowByData(data: Record<string, any>): TableRow | undefined
  getSummaryRow(): Record<string, any>
}
```

## Examples

### 基础 + 多选

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const checked = ref<any[]>([])
const columns = defineTableColumns(
  [
    { key: 'name', name: '姓名', width: 120 },
    { key: 'age', name: '年龄', width: 80, align: 'center' },
    { key: 'address', name: '地址', minWidth: 200 }
  ],
  { align: 'center' }
)

const data = [
  { id: 1, name: '张三', age: 28, address: '北京市海淀区' },
  { id: 2, name: '李四', age: 32, address: '上海市浦东新区' },
  { id: 3, name: '王五', age: 25, address: '广州市天河区' }
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
    stripe
  />
</template>
```

### 自定义列渲染（render 函数）

```vue
<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@veltra/desktop'

const columns: TableColumn[] = [
  { key: 'name', name: '名称', minWidth: 150 },
  {
    key: 'status',
    name: '状态',
    width: 100,
    align: 'center',
    render: ({ val }) =>
      h(UTag, { type: val === 1 ? 'success' : 'danger' }, () => (val === 1 ? '启用' : '禁用'))
  },
  { key: 'createTime', name: '创建时间', width: 180 }
]
</script>

<template>
  <u-table :columns="columns" :data="data" border />
</template>
```

### 操作列（列插槽 + UAction）

> 列插槽优先级 > render；插槽作用域含 `model` 用于行内编辑。

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称', minWidth: 150 },
  { key: 'action', name: '操作', width: 200, align: 'center' }
])
</script>

<template>
  <u-table :columns="columns" :data="data" row-key="id" border>
    <template #column:action="{ rowData }">
      <u-action-group :max="4">
        <u-action @run="handleEdit(rowData)">编辑</u-action>
        <u-action need-confirm type="danger" @run="handleDelete(rowData)">删除</u-action>
      </u-action-group>
    </template>
  </u-table>
</template>
```

### 树形表格

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称', minWidth: 200 },
  { key: 'size', name: '大小', width: 100, align: 'right' }
])

// tree=true 用 children；tree="subItems" 自定义子节点字段名
const data = [
  {
    id: 1, name: 'src',
    children: [
      { id: 2, name: 'components',
        children: [{ id: 3, name: 'Button.vue', size: '3.2 KB' }] }
    ]
  }
]
</script>

<template>
  <u-table tree :columns="columns" :data="data" border />
</template>
```

### 行展开 + 表尾合计

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '商品', minWidth: 150 },
  { key: 'price', name: '单价', width: 100, align: 'right', summary: true },
  { key: 'quantity', name: '数量', width: 80, align: 'center' },
  {
    key: 'total', name: '金额', width: 120, align: 'right',
    render: ({ rowData }) => `¥${(rowData.price * rowData.quantity).toFixed(2)}`,
    summary: ctx => {
      const sum = ctx.rows.reduce((s, r) => s + (r.data as any).price * (r.data as any).quantity, 0)
      return `¥${sum.toFixed(2)}`
    }
  }
])
</script>

<template>
  <u-table expandable :columns="columns" :data="data" row-key="id" border>
    <template #row:expand="{ rowData }">
      <div style="padding: 16px 24px">
        <p>商品详情：{{ rowData.name }}</p>
      </div>
    </template>
  </u-table>
</template>
```

### 多级表头 + 单元格合并

```vue
<script setup lang="ts">
import type { TableColumn, TableColumnRenderContext } from '@veltra/desktop'

// 多级表头：用 children 嵌套
const columns: TableColumn[] = [
  {
    key: 'name', name: '基本信息', align: 'center',
    children: [
      { key: 'firstName', name: '名', minWidth: 100 },
      { key: 'lastName', name: '姓', minWidth: 100 }
    ]
  },
  {
    key: 'contact', name: '联系方式', align: 'center',
    children: [
      { key: 'email', name: '邮箱', minWidth: 200 },
      { key: 'phone', name: '电话', width: 140 }
    ]
  }
]

// 合并单元格
function mergeCell(ctx: TableColumnRenderContext) {
  if (ctx.column.key === 'category' && ctx.row.index % 2 === 0) {
    return { rowspan: 2, colspan: 1 }
  }
}
</script>

<template>
  <u-table :columns="columns" :data="data" :merge-cell="mergeCell" border />
</template>
```

### 配合 UPaginator 分页

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const allData = ref(Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `条目 ${i + 1}` })))
const pageNumber = ref(1)
const pageSize = ref(10)
const pagedData = computed(() => {
  const start = (pageNumber.value - 1) * pageSize.value
  return allData.value.slice(start, start + pageSize.value)
})

const columns = defineTableColumns([{ key: 'name', name: '名称', minWidth: 150 }])
</script>

<template>
  <u-table :columns="columns" :data="pagedData" row-key="id" border stripe />
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="allData.length"
    :page-size-options="[10, 20, 50]"
  />
</template>
```

### 虚拟滚动（大数据）

```vue
<script setup lang="ts">
const data = Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, name: `行 ${i + 1}` }))
</script>

<template>
  <u-table
    :columns="columns"
    :data="data"
    row-key="id"
    :virtual-threshold="50"
    border stripe
    style="height: 500px"
  />
</template>
```
