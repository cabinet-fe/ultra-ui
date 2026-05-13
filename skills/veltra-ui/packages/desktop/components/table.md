# UTable — 表格

> `import type { TableProps, TableColumn, TableEmits, TableExposed, TableColumnRenderContext, TableColumnSlotsScope, TableRowSlotsScope, TableSummaryContext, TableRow, TableColumnNode } from '@veltra/desktop'`
> `import { defineTableColumns } from '@veltra/desktop'`

支持多级表头、多选/单选、树形数据、行展开、虚拟滚动、列固定、列宽拖拽、单元格合并、表尾合计、斑马纹、文字溢出省略。

## Import

```ts
// UTable 由 Vite 自动导入，无需手动 import
import { defineTableColumns } from '@veltra/desktop'
```

## TableColumn 类型

```ts
interface TableColumn {
  /** 列的唯一键（对应数据字段名，用于列插槽匹配） */
  key: string
  /** 列名称（表头文本，优先级低于 nameRender） */
  name: string
  /** 表头渲染函数，优先级大于 name */
  nameRender?: (ctx: {
    column: TableColumnNode
  }) => VNode | string | null | undefined | (VNode | string | null | undefined)[]
  /** 列最大宽度（px） */
  width?: number
  /** 列最小宽度（px） */
  minWidth?: number
  /**
   * 列固定方式，嵌套表头时此值无效
   * @default undefined（不固定）
   */
  fixed?: 'left' | 'right'
  /**
   * 表头对齐方式，未指定时默认使用 align
   */
  headerAlign?: 'left' | 'center' | 'right'
  /**
   * 列对齐方式
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right'
  /** 列自定义渲染函数 */
  render?: (scope: TableColumnRenderContext) => RenderReturn
  /** 子列（多级表头） */
  children?: TableColumn[]
  /** 表尾合计：true 显示求和，或自定义渲染函数 */
  summary?: boolean | ((ctx: TableSummaryContext) => RenderReturn)
  /** 是否可拖拽调整列宽 */
  resizable?: boolean
  /** 额外自定义属性（可传递给列插槽） */
  [key: string]: any
}
```

### 关联类型

```ts
interface TableColumnRenderContext {
  row: TableRow
  rowData: Record<string, any>
  column: TableColumnNode
  val: any
}

interface TableColumnSlotsScope extends TableColumnRenderContext {
  model: { modelValue: any; 'onUpdate:modelValue': (val: any) => void }
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

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `data` | `Record<string, any>[]` | — | 表格数据 |
| `columns` | `TableColumn[]` | — | 列定义 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 尺寸 |
| `rowKey` | `string` | — | 行唯一标识字段名，多选/单选/树形时必须 |
| `checkable` | `boolean` | — | 开启多选（需 `rowKey`） |
| `checked` | `Record<string, any>[]` | — | 多选已选项（支持 `v-model:checked`） |
| `selectable` | `boolean` | — | 开启单选（需 `rowKey`） |
| `selected` | `Record<string, any>` | — | 单选已选项（支持 `v-model:selected`） |
| `showIndex` | `boolean` | — | 显示行索引（从 1 开始，固定左侧，列宽 60px） |
| `tree` | `boolean \| string` | `false` | 树形模式。`true` 时子节点从 `children` 字段读取；传字符串表示自定义子节点字段名 |
| `expandable` | `boolean` | — | 开启行展开（非树形模式下有效） |
| `defaultExpandAll` | `boolean` | — | 默认展开全部（树形模式） |
| `current` | `TableRow` | — | 当前选中/点击的行（支持 `v-model:current`） |
| `highlightCurrent` | `boolean` | `false` | 高亮当前点击的行（未设置 `current` 时也生效） |
| `stripe` | `boolean` | `true` | 斑马纹（奇偶行交替底色） |
| `border` | `boolean` | `false` | 边框 |
| `textEllipsis` | `boolean` | — | 文本溢出省略 |
| `virtualThreshold` | `number` | `80` | 虚拟滚动阈值，数据量超过此值时自动开启。设为 `0` 则始终开启虚拟滚动 |
| `mergeCell` | `(ctx: TableColumnRenderContext) => { rowspan: number; colspan: number } \| undefined` | — | 单元格合并函数 |
| `slots` | `Readonly<Slots>` | — | 传入外部作用域插槽，用于跨组件传递插槽 |

## Emits

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

| slot | 作用域 | 说明 |
|------|--------|------|
| `column:{key}` | `TableColumnSlotsScope` | 动态列插槽，`{key}` 为列定义的 `key` 字段值。作用域含 `model` 双向绑定对象 |
| `header:{key}` | `{ column: ColumnNode }` | 动态表头插槽，`{key}` 为列定义的 `key` 字段值 |
| `row:expand` | `TableRowSlotsScope` | 展开行内容（需设置 `expandable` 或 `tree`） |
| `body` | `{ columns: ColumnNode[]; rows: TableRowNode[] }` | 自定义整个 body 内容 |
| `foot` | `{ columns: ColumnNode[]; rows: TableRowNode[] }` | 自定义表尾（合计行） |
| `empty` | — | 空数据状态 |
| `append` | — | 追加在表格滚动区域之后的内容 |

**列插槽与 `render` 的优先级**：如果同时定义了列插槽 `column:{key}` 和列的 `render` 函数，插槽优先。

## Exposed

```ts
interface TableExposed {
  /** 根 DOM 元素引用 */
  el: HTMLElement | undefined
  /** 清除多选的所有已选项 */
  clearChecked(): void
  /** 清除单选的已选项 */
  clearSelected(): void
  /** 通过行数据获取对应的 `TableRow` 实例 */
  getRowByData(data: Record<string, any>): TableRow | undefined
  /** 获取合计行的数据 */
  getSummaryRow(): Record<string, any>
}
```

## `defineTableColumns(columns, commonProps?)`

批量设置列的公共属性，以深度优先遍历所有列（包括子列的递归遍历），仅当列自身未定义某属性时才从 `commonProps` 合并。

```ts
function defineTableColumns(
  columns: TableColumn[],
  commonProps?: Partial<Pick<TableColumn, 'align' | 'minWidth'>>
): TableColumn[]
```

```ts
const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄', align: 'right' }, // 不会覆盖
  { key: 'address', name: '地址' }
], { align: 'center', minWidth: 100 })
// 效果：name 和 address 会应用 align: 'center' 和 minWidth: 100，age 的 align 保持 'right'
```

## Examples

### 基础表格

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '姓名', width: 120 },
  { key: 'age', name: '年龄', width: 80, align: 'center' },
  { key: 'address', name: '地址', minWidth: 200 }
], { align: 'center' })

const data = [
  { id: 1, name: '张三', age: 28, address: '北京市海淀区' },
  { id: 2, name: '李四', age: 32, address: '上海市浦东新区' },
  { id: 3, name: '王五', age: 25, address: '广州市天河区' }
]
</script>

<template>
  <u-table :columns="columns" :data="data" border stripe />
</template>
```

### 自定义列渲染

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
    render({ val }) {
      return h(UTag, { type: val === 1 ? 'success' : 'danger' },
        () => val === 1 ? '启用' : '禁用')
    }
  },
  { key: 'createTime', name: '创建时间', width: 180 }
]

const data = [
  { id: 1, name: '项目 A', status: 1, createTime: '2025-01-15' },
  { id: 2, name: '项目 B', status: 0, createTime: '2025-03-22' }
]
</script>

<template>
  <u-table :columns="columns" :data="data" border />
</template>
```

### 自定义列插槽（推荐用于操作列）

> 列插槽优先级高于 `render` 函数。插槽作用域包含 `model` 对象，用于行内编辑。

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称', minWidth: 150 },
  { key: 'action', name: '操作', width: 200, align: 'center' }
])

const data = [
  { id: 1, name: '配置 A' },
  { id: 2, name: '配置 B' }
]

function handleEdit(rowData: Record<string, any>) {
  console.log('编辑', rowData)
}

function handleDelete(rowData: Record<string, any>) {
  console.log('删除', rowData)
}
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

### 多选表格

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const checked = ref<any[]>([])
const columns = defineTableColumns([
  { key: 'name', name: '姓名', minWidth: 120 },
  { key: 'age', name: '年龄', width: 80, align: 'center' },
  { key: 'address', name: '地址', minWidth: 200 }
])

const data = [
  { id: 1, name: '张三', age: 28, address: '北京市' },
  { id: 2, name: '李四', age: 32, address: '上海市' },
  { id: 3, name: '王五', age: 25, address: '广州市' }
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

### 树形表格

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称', minWidth: 200 },
  { key: 'size', name: '大小', width: 100, align: 'right' }
])

const data = [
  {
    id: 1,
    name: 'src',
    children: [
      {
        id: 2,
        name: 'components',
        children: [
          { id: 3, name: 'Button.vue', size: '3.2 KB' },
          { id: 4, name: 'Table.vue', size: '12.5 KB' }
        ]
      },
      { id: 5, name: 'App.vue', size: '1.1 KB' }
    ]
  }
]
</script>

<template>
  <u-table tree :columns="columns" :data="data" border />
</template>
```

### 自定义子节点字段名的树形表格

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'label', name: '部门', minWidth: 200 },
  { key: 'count', name: '人数', width: 80, align: 'center' }
])

const data = [
  {
    id: 1,
    label: '技术部',
    subItems: [
      { id: 2, label: '前端组', count: 12 },
      { id: 3, label: '后端组', count: 18 }
    ]
  }
]
</script>

<template>
  <u-table tree="subItems" :columns="columns" :data="data" border />
</template>
```

### 行展开 + 合计行

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '商品', minWidth: 150 },
  { key: 'price', name: '单价', width: 100, align: 'right', summary: true },
  { key: 'quantity', name: '数量', width: 80, align: 'center' },
  { key: 'total', name: '金额', width: 120, align: 'right',
    render({ rowData }) {
      return `¥${(rowData.price * rowData.quantity).toFixed(2)}`
    },
    summary(ctx) {
      const sum = ctx.rows.reduce((s, r) => s + (r.data as any).price * (r.data as any).quantity, 0)
      return `¥${sum.toFixed(2)}`
    }
  }
])

const data = [
  { id: 1, name: '商品 A', price: 99, quantity: 2 },
  { id: 2, name: '商品 B', price: 150, quantity: 1 },
  { id: 3, name: '商品 C', price: 50, quantity: 5 }
]
</script>

<template>
  <u-table expandable :columns="columns" :data="data" row-key="id" border>
    <template #row:expand="{ rowData }">
      <div style="padding: 16px 24px">
        <p>商品详情：{{ rowData.name }}</p>
        <p>单价：¥{{ rowData.price }} | 数量：{{ rowData.quantity }}</p>
      </div>
    </template>
  </u-table>
</template>
```

### 配合 UPaginator 分页

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const allData = ref(
  Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `条目 ${i + 1}`,
    value: Math.floor(Math.random() * 1000)
  }))
)

const pageNumber = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (pageNumber.value - 1) * pageSize.value
  return allData.value.slice(start, start + pageSize.value)
})

const columns = defineTableColumns([
  { key: 'name', name: '名称', minWidth: 150 },
  { key: 'value', name: '数值', width: 100, align: 'right' }
])
</script>

<template>
  <u-table :columns="columns" :data="pagedData" row-key="id" border stripe />
  <div style="margin-top: 16px">
    <u-paginator
      v-model:page-number="pageNumber"
      v-model:page-size="pageSize"
      :total="allData.length"
      :page-size-options="[10, 20, 50]"
    />
  </div>
</template>
```

### 单元格合并

```vue
<script setup lang="ts">
import type { TableColumn, TableColumnRenderContext } from '@veltra/desktop'

function mergeCell(ctx: TableColumnRenderContext) {
  const { row, column } = ctx
  // 第一列每两行合并
  if (column.key === 'category' && row.index % 2 === 0) {
    return { rowspan: 2, colspan: 1 }
  }
}

const columns: TableColumn[] = [
  { key: 'category', name: '分类', width: 120 },
  { key: 'name', name: '名称', minWidth: 150 },
  { key: 'count', name: '数量', width: 80, align: 'center' }
]

const data = [
  { category: '电子产品', name: '手机', count: 120 },
  { category: '电子产品', name: '电脑', count: 80 },
  { category: '日用品', name: '毛巾', count: 300 },
  { category: '日用品', name: '牙刷', count: 500 }
]
</script>

<template>
  <u-table :columns="columns" :data="data" :merge-cell="mergeCell" border />
</template>
```

### 多级表头

```vue
<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@veltra/desktop'

const columns: TableColumn[] = [
  {
    key: 'name',
    name: '基本信息',
    align: 'center',
    children: [
      { key: 'firstName', name: '名', minWidth: 100 },
      { key: 'lastName', name: '姓', minWidth: 100 }
    ]
  },
  {
    key: 'contact',
    name: '联系方式',
    align: 'center',
    children: [
      { key: 'email', name: '邮箱', minWidth: 200 },
      { key: 'phone', name: '电话', width: 140 }
    ]
  },
  {
    key: 'status',
    name: '状态',
    width: 100,
    align: 'center',
    render({ val }) {
      return h(UTag, { type: val === 1 ? 'success' : 'default' },
        () => val === 1 ? '在职' : '离职')
    }
  }
]

const data = [
  { firstName: '三', lastName: '张', email: 'zhangsan@example.com', phone: '13800001111', status: 1 },
  { firstName: '四', lastName: '李', email: 'lisi@example.com', phone: '13800002222', status: 0 }
]
</script>

<template>
  <u-table :columns="columns" :data="data" border />
</template>
```

### 虚拟滚动

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'index', name: '#', width: 60, align: 'center' },
  { key: 'name', name: '名称', minWidth: 150 },
  { key: 'value', name: '数值', width: 100, align: 'right' }
])

const data = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  index: i + 1,
  name: `数据行 ${i + 1}`,
  value: Math.floor(Math.random() * 10000)
}))
</script>

<template>
  <u-table
    :columns="columns"
    :data="data"
    row-key="id"
    :virtual-threshold="50"
    border
    stripe
    style="height: 500px"
  />
</template>
```
