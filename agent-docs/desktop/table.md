---
title: UTable 表格
description: "@veltra/desktop 的数据表格组件：columns 定义列、data 提供行数据，内置多选/单选、树形表格、展开行、表尾合计、单元格合并、表头拖拽调宽，行数超过阈值自动虚拟滚动；分页与排序无内置，分页配合 UPaginator、排序自行处理 data。"
aliases: [DataTable, Table, 数据表格, 数据列表]
keywords: [defineTableColumns, columns, data, rowKey, checkable, checked, selectable, selected, virtualThreshold, row-click, cell-click, mergeCell, summary, UPaginator, 分页, 排序, 多选, 单选, 虚拟滚动, 树形表格]
---

# UTable 表格

`@veltra/desktop` 导出数据表格组件 `UTable` 与列定义辅助函数 `defineTableColumns`。`UTable` 用 `columns` 描述列、`data` 提供行数据，内置多选/单选、树形表格、展开行、表尾合计、单元格合并与表头拖拽调宽；行数超过 `virtualThreshold`（默认 80）自动开启虚拟滚动。排序与分页没有内置：排序自行对 `data` 排序后传入，分页配合 `UPaginator` 使用。

## 快速上手

```vue
<script setup lang="ts">
import { UTable, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄', align: 'center' }
])

const data = [
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 32 }
]
</script>

<template>
  <u-table :columns="columns" :data="data" row-key="id" border />
</template>
```

独立页面使用时必须先初始化主题：入口文件 `import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用一次 `loadTheme()`，否则 `--u-*` token 为空、表格无颜色。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type TableColumnAlign = 'left' | 'center' | 'right'

export type RenderReturn =
  | (undefined | VNode | string | null | number)[]
  | undefined
  | VNode
  | string
  | null
  | number

/** 单元格渲染上下文（render 函数与 #column:{key} 插槽共用的基础字段） */
export interface TableColumnRenderContext {
  /** 行节点 */
  row: TableRow
  /** 原始行数据 */
  rowData: Record<string, any>
  /** 列节点 */
  column: TableColumnNode
  /** 单元格数据，取自 rowData[column.key] */
  val: any
}

/** 表格列插槽作用域 */
export interface TableColumnSlotsScope extends TableColumnRenderContext {
  /** 交互模型：modelValue 为当前单元格值，onUpdate:modelValue 写回 rowData[column.key] */
  model: { modelValue: any; 'onUpdate:modelValue': (val: any) => void }
}

/** 展开行插槽作用域 */
export interface TableRowSlotsScope {
  row: TableRow
  rowData: Record<string, any>
  columns: TableColumnNode[]
  index: number
}

/** 表尾合计上下文 */
export interface TableSummaryContext {
  /** 当前列可见行的合计值 */
  total: number
  /** 所有可见行节点 */
  rows: TableRow[]
  /** 多选选中的行节点集合 */
  checkedRows: Set<TableRow>
  /** 当前列节点 */
  column: TableColumnNode
}

export interface TableColumn {
  /** 列的唯一键，单元格按 rowData[key] 取值 */
  key: string
  /** 列名称，表头默认渲染该值 */
  name: string
  /** 表头渲染，优先级高于 name；#header:{key} 插槽优先级低于它 */
  nameRender?: (ctx: { column: TableColumnNode }) => RenderReturn
  /** 列最大宽度，取值小于 minWidth 时按 minWidth 渲染 */
  width?: number
  /** 列最小宽度；叶子列未设置时默认 100 */
  minWidth?: number
  /** 固定列方向；该列有 children（嵌套表头）时无效 */
  fixed?: 'left' | 'right'
  /** 表头对齐方式，未指定时取 align */
  headerAlign?: TableColumnAlign
  /** 列对齐方式，默认 'left' */
  align?: TableColumnAlign
  /** 单元格渲染函数，优先级高于 #column:{key} 插槽 */
  render?: (scope: TableColumnRenderContext) => RenderReturn
  /** 子列，用于多级表头 */
  children?: TableColumn[]
  /** 表尾合计；true 时自动对可见行 rowData[key] 求和 */
  summary?: boolean | ((ctx: TableSummaryContext) => RenderReturn)
  /** 是否可拖拽调整列宽，默认 true */
  resizable?: boolean
  [key: string]: any
}

/** 行节点；由 data 编译生成，row-click 等事件的 payload 即它 */
export interface TableRow {
  /** 原始行数据 */
  data: Record<string, any>
  /** 在兄弟节点中的索引 */
  index: number
  /** 树深度，根为 0 */
  depth: number
  /** 是否展开 */
  expanded: boolean
  /** 操作中 */
  operating: boolean
  /** 是否选中 */
  checked: boolean
  /** 是否为当前点击的行 */
  isCurrent: boolean
  /** 行唯一标识：指定 rowKey 时取 rowData[rowKey]，否则内部自增 uid */
  uid: number | string
  /** 索引路径 */
  indexes: number[]
  children?: TableRow[]
  parent?: TableRow
  /** 是否为展开行内容行 */
  isExpandRow: boolean
}

export interface TableProps {
  /** 组件尺寸，默认 'default' */
  size?: ComponentSize
  /** 表格数据 */
  data?: Record<string, any>[]
  /** 表格列 */
  columns?: TableColumn[]
  /** 多选受控值（原始行数据数组），需要 rowKey */
  checked?: Record<string, any>[]
  /** 单选受控值（原始行数据），需要 rowKey */
  selected?: Record<string, any>
  /** 开启多选列 */
  checkable?: boolean
  /** 开启单选列；与 checkable 同时设置时仅本项生效 */
  selectable?: boolean
  /** 开启序号列（key 为 '__index__'，表头 '#'，固定左侧，宽 60） */
  showIndex?: boolean
  /**
   * 树形表格，默认 false
   * 传字符串时该字符串为子节点字段名；不传字符串时子节点字段为 'children'
   */
  tree?: boolean | string
  /** 作用域插槽透传；函数式组件中包表格时传 $slots */
  slots?: Readonly<Slots>
  /** 单元格合并 */
  mergeCell?: (ctx: TableColumnRenderContext) => { rowspan: number; colspan: number } | undefined
  /** 当前点击的行（TableRow 节点），配合 v-model:current */
  current?: TableRow
  /** 高亮当前点击的行，默认 false */
  highlightCurrent?: boolean
  /** 行 key 字段名；使用 checked / selected 受控绑定时必须设置 */
  rowKey?: string
  /** 斑马纹，默认 true */
  stripe?: boolean
  /** 边框，默认 false */
  border?: boolean
  /** 虚拟滚动阈值：可见行数超过该值才开启虚拟滚动，默认 80；设为 0 则始终开启 */
  virtualThreshold?: number
  /** 开启展开行，仅在非树形模式有效；内容写入 #row:expand 插槽 */
  expandable?: boolean
  /** 树形模式下默认展开全部节点 */
  defaultExpandAll?: boolean
  /** 文本溢出省略 */
  textEllipsis?: boolean
}

export interface TableEmits<DataItem extends Record<string, any> = Record<string, any>> {
  /** 多选变化 */
  (e: 'update:checked', value: DataItem[]): void
  /** 单选变化 */
  (e: 'update:selected', value: DataItem | undefined): void
  /** 可见行列表变化 */
  (e: 'update:rows', rows: TableRow[]): void
  /** 树形数据森林结构变化 */
  (e: 'update:forest', rows?: Forest<Record<string, unknown>, any>): void
  /** 行点击 */
  (e: 'row-click', row: TableRow, ev: MouseEvent): void
  /** 单元格点击 */
  (e: 'cell-click', row: TableRow, column: TableColumn, ev: MouseEvent): void
  /** 当前行变化；再次点击同一行时为 undefined */
  (e: 'update:current', row?: TableRow): void
}

/** 模板 ref 上可访问的属性与方法（DeconstructValue 解包后的形态） */
export interface TableExposed {
  el: HTMLElement | undefined
  clearChecked: () => void
  clearSelected: () => void
  getRowByData: (data: Record<string, any>) => TableRow | undefined
  getSummaryRow: () => Record<string, any>
}

/**
 * 定义表格列：把公共属性合并进列树
 * @param columns 列配置数组
 * @param commonProps 仅支持 'align' | 'minWidth' 两个键
 */
export function defineTableColumns(
  columns: TableColumn[],
  commonProps?: Partial<Pick<TableColumn, 'align' | 'minWidth'>>
): TableColumn[]
```

`defineTableColumns` 的合并规则：

- 对每个列配置及其 `children` 子列做深度优先遍历（DFS），逐个合并 `commonProps`。
- 只写列上为 `undefined` 的属性，不覆盖已有值；列级显式设置始终优先。
- 返回值就是传入的 `columns` 数组本身。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `data` | `Record<string, any>[]` | — | 否 | 空数组或 `undefined` 时渲染默认空态（UEmpty），可用 `#empty` 插槽覆盖 |
| `columns` | `TableColumn[]` | — | 是 | 渲染顺序按数组顺序；`fixed` 列排在两侧 |
| `rowKey` | `string` | — | 否 | 未设置时内部用自增 uid 标识行；使用 `checked` / `selected` 受控绑定时必须设置，否则选中状态无法与外部同步 |
| `checkable` | `boolean` | `false` | 否 | 多选列固定左侧，宽 60（`size` 为 `'large'` 时 80）；勾选带子行的节点时联动勾选全部子行 |
| `selectable` | `boolean` | `false` | 否 | 单选列固定左侧；与 `checkable` 同时设置时仅 `selectable` 生效 |
| `checked` | `Record<string, any>[]` | — | 否 | `v-model:checked`；数组元素是原始行数据，必须能通过 `rowKey` 匹配到行 |
| `selected` | `Record<string, any>` | — | 否 | `v-model:selected`；约束同 `checked` |
| `showIndex` | `boolean` | `false` | 否 | 序号列显示 `row.index + 1` |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | — |
| `tree` | `boolean \| string` | `false` | 否 | 传字符串时该字符串为子节点字段名；默认子节点字段 `'children'` |
| `expandable` | `boolean` | `false` | 否 | 仅非树形模式有效；展开内容写在 `#row:expand` 插槽 |
| `defaultExpandAll` | `boolean` | `false` | 否 | 仅树形模式的初始展开状态生效 |
| `stripe` | `boolean` | `true` | 否 | — |
| `border` | `boolean` | `false` | 否 | — |
| `virtualThreshold` | `number` | `80` | 否 | 行高按 41px 估算并实测校正；设为 `0` 表示始终虚拟滚动 |
| `highlightCurrent` | `boolean` | `false` | 否 | 未绑定 `v-model:current` 时也可高亮点击行 |
| `current` | `TableRow` | — | 否 | `v-model:current`；值来自 `row-click` / `update:current` 的行节点 |
| `mergeCell` | `(ctx) => { rowspan, colspan } \| undefined` | — | 否 | 返回 `{ rowspan, colspan }` 按跨度渲染；`rowspan` 或 `colspan` 为 `0` 时隐藏该单元格；返回 `undefined` 正常渲染 |
| `slots` | `Readonly<Slots>` | — | 否 | 仅函数式组件包裹 `UTable` 时使用，传 `$slots` |
| `textEllipsis` | `boolean` | `false` | 否 | — |

### TableColumn 列定义

| 属性 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `key` | `string` | — | 是 | 唯一；单元格按 `rowData[key]` 取值 |
| `name` | `string` | — | 是 | 表头文字 |
| `width` | `number` | — | 否 | 显式设置后不参与剩余宽度均分；拖拽调宽后锁定为显式宽度 |
| `minWidth` | `number` | `100`（叶子列） | 否 | `width` 小于 `minWidth` 时按 `minWidth` 渲染 |
| `fixed` | `'left' \| 'right'` | — | 否 | 仅顶层列生效，嵌套表头（有 `children`）的列设置无效；固定列未设 `width` 时只按 `minWidth` 占位、不参与均分 |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | 否 | — |
| `headerAlign` | `'left' \| 'center' \| 'right'` | 取 `align` | 否 | — |
| `render` | `(ctx: TableColumnRenderContext) => RenderReturn` | — | 否 | 优先级：`render` > `#column:{key}` 插槽 > 直接显示 `val` |
| `nameRender` | `(ctx: { column }) => RenderReturn` | — | 否 | 优先级：`nameRender` > `#header:{key}` 插槽 > `name` |
| `children` | `TableColumn[]` | — | 否 | 非空时渲染多级表头 |
| `summary` | `boolean \| (ctx) => RenderReturn` | — | 否 | `true` 时对当前可见行求和；任一叶子列设置后渲染表尾合计行，首列显示「合计:」 |
| `resizable` | `boolean` | `true` | 否 | 表头出现拖拽手柄，拖拽后 `width` 被锁定 |

### 插槽

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `#column:{key}` | `TableColumnSlotsScope` | 自定义 `{key}` 列的单元格；`model.modelValue` 写回 `rowData[key]` |
| `#header:{key}` | `{ column }` | 自定义 `{key}` 列的表头 |
| `#row:expand` | `TableRowSlotsScope` | `expandable` 模式的展开行内容，占满整行 |
| `#foot` | `{ columns, rows }` | 渲染在 `tfoot`，与合计行共存 |
| `#body` | `{ columns, rows }` | 接管整个 `tbody` 渲染 |
| `#empty` | 无 | 无数据时的空态，默认渲染 `UEmpty` |
| `#append` | 无 | 渲染在 `table` 元素之后 |

## 方法与事件

事件（`TableEmits`，模板上用 `@row-click` / `v-model:checked` 等绑定）：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:checked` | `DataItem[]`（原始行数据数组） | 勾选/取消任意复选框、表头全选时 |
| `update:selected` | `DataItem \| undefined` | 勾选/取消单选框时；取消为 `undefined` |
| `update:rows` | `TableRow[]` | 可见行列表变化（data 变化、树形展开/折叠） |
| `update:forest` | `Forest \| undefined` | 树形模式下森林结构变化 |
| `row-click` | `(row: TableRow, ev: MouseEvent)` | 点击行；同时切换当前行（滚动中的点击不切换） |
| `cell-click` | `(row: TableRow, column: TableColumn, ev: MouseEvent)` | 点击单元格 |
| `update:current` | `(row?: TableRow)` | 当前行变化；再次点击同一行为 `undefined` |

通过模板 ref 调用的方法（`TableExposed`，同步、无抛错）：

```ts
const tableRef = ref<TableExposed>()

tableRef.value?.clearChecked() // 清空多选
tableRef.value?.clearSelected() // 清空单选
tableRef.value?.getRowByData(data[0]) // => TableRow | undefined
tableRef.value?.getSummaryRow() // => { [columnKey]: number }，合计行数据
tableRef.value?.el // => HTMLElement | undefined，UTable 外层 UScroll 包裹的根元素
```

## 典型示例

### 多选 + 列插槽 + 单元格合并

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UTable, defineTableColumns } from '@veltra/desktop'
import type { TableColumnRenderContext } from '@veltra/desktop'

const checked = ref<Record<string, any>[]>([])

// 第二个参数把 align: 'center' 合并进所有未显式设置对齐的列（含子列）
const columns = defineTableColumns(
  [
    { key: 'dept', name: '部门', width: 120, fixed: 'left' },
    { key: 'name', name: '姓名' },
    { key: 'age', name: '年龄' },
    { key: 'action', name: '操作', align: 'center' }
  ],
  { minWidth: 80 }
)

const data = [
  { id: 1, dept: '研发', name: '张三', age: 28 },
  { id: 2, dept: '研发', name: '李四', age: 32 },
  { id: 3, dept: '设计', name: '王五', age: 25 },
  { id: 4, dept: '设计', name: '赵六', age: 30 }
]

// 同一部门跨两行合并：偶数行 rowspan 2；被覆盖的奇数行必须隐藏单元格
function mergeCell(ctx: TableColumnRenderContext) {
  if (ctx.column.key !== 'dept') return undefined
  return ctx.row.index % 2 === 0 ? { rowspan: 2, colspan: 1 } : { rowspan: 0, colspan: 0 }
}

function handleRowClick(row: any) {
  console.log('点击行：', row.data.name) // => '点击行：张三'
}
</script>

<template>
  <u-table
    ref="tableRef"
    row-key="id"
    checkable
    border
    :columns="columns"
    :data="data"
    v-model:checked="checked"
    :merge-cell="mergeCell"
    @row-click="handleRowClick"
  >
    <template #column:action="{ rowData }">
      <u-button text type="primary" @click="console.log(rowData)">编辑</u-button>
    </template>
  </u-table>
</template>
```

### 树形表格 + 表尾合计

```vue
<script setup lang="ts">
import { UTable, defineTableColumns } from '@veltra/desktop'

// 子节点字段不是 children 时，用 tree="subItems" 指定
const columns = defineTableColumns([
  { key: 'name', name: '名称', minWidth: 200 },
  { key: 'size', name: '大小', width: 120, align: 'right' },
  {
    key: 'count',
    name: '数量',
    width: 100,
    align: 'center',
    summary: true // 自动对可见行 rowData.count 求和
  }
])

const data = [
  {
    id: 1,
    name: 'src',
    count: 2,
    children: [
      { id: 11, name: 'components', count: 1, children: [{ id: 111, name: 'Button.vue', count: 1 }] },
      { id: 12, name: 'utils.ts', count: 1 }
    ]
  },
  { id: 2, name: 'public', count: 3 }
]
</script>

<template>
  <u-table tree row-key="id" default-expand-all border :columns="columns" :data="data" />
  <!-- 表尾合计行 count 列显示 8（2+1+1+1+3，只统计当前可见行） -->
</template>
```

### 虚拟滚动 + UPaginator 分页

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UPaginator, UTable, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([{ key: 'name', name: '名称', minWidth: 150 }])

const allData = ref(Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, name: `行 ${i + 1}` })))

const pageNumber = ref(1)
const pageSize = ref(20)
const pagedData = computed(() => {
  const start = (pageNumber.value - 1) * pageSize.value
  return allData.value.slice(start, start + pageSize.value)
})
</script>

<template>
  <!-- 容器需要显式高度才能纵向滚动；每页 20 行低于阈值 50，本页不虚拟 -->
  <u-table
    :columns="columns"
    :data="pagedData"
    row-key="id"
    border
    stripe
    :virtual-threshold="50"
    style="height: 500px"
  />
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="allData.length"
    :page-size-options="[10, 20, 50]"
  />
</template>
```

## 注意事项

> [!WARNING]
> - 本库不内置排序与分页，不是 Element Plus 的 `el-table`：没有 `sorter` / `pagination` 属性。排序自行对 `data` 排序后传入；分页配合 `UPaginator`。
> - 行数据属性是 `data`，不是 `dataSource`；列配置是 `columns`（`TableColumn[]`），`key` / `name` 必填。
> - 列插槽名是 `#column:{key}`，不是 `#default="{ row }"`；表头插槽是 `#header:{key}`。
> - `checkable` 与 `selectable` 同时设置时仅 `selectable` 生效；两者配合 `v-model:checked` / `v-model:selected` 时必须设置 `rowKey`。
> - `mergeCell` 被合并覆盖的单元格必须返回 `{ rowspan: 0, colspan: 0 }` 隐藏；返回 `undefined` 会正常渲染，导致列错位。
> - `tree` 与 `expandable` 互斥：`expandable` 仅在非树形模式有效；`defaultExpandAll` 仅树形模式的初始展开生效。
> - 数据替换时行数变化比例达到 50%（`|Δlen| / max(新旧行数) ≥ 0.5`）会自动滚回顶部；行内增删几条不会滚动复位。
> - 纵向滚动与虚拟滚动要求容器有显式高度（如 `style="height: 500px"`），否则表格随内容撑开、不出现滚动。

## 常见问题

### 传了 `checked` 但选中状态不回显

原因：未设置 `rowKey`，受控选中按 `rowData[rowKey]` 匹配行，匹配不到就不回显。修复：

```vue
<u-table row-key="id" checkable :data="data" v-model:checked="checked" />
```

### 表格渲染无颜色、样式异常

原因：主题未初始化，`--u-*` token 为空。修复：应用入口执行一次：

```ts
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

### 想要单元格点击后更新行数据

用 `#column:{key}` 插槽的 `model`，写入会直接落到 `rowData[key]`：

```vue
<u-table :columns="columns" :data="data" row-key="id">
  <template #column:age="{ model }">
    <u-input v-model="model.modelValue" />
  </template>
</u-table>
```

需要更完整的行内编辑能力（增删复制行、内置操作列）时改用 `UTableEditor`，见 `agent-docs/desktop/table-editor.md`。
