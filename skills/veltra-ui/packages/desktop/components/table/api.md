# UTable — 表格

> `import type { TableProps, TableColumn, TableEmits, TableExposed, TableColumnRenderContext, TableColumnSlotsScope, TableRowSlotsScope, TableSummaryContext, TableRow, TableColumnNode } from '@veltra/desktop'`

> 类型：`../../../generated/types/table.ts`

支持多级表头、多选/单选、树形数据、行展开、虚拟滚动、列固定、列宽拖拽、单元格合并、表尾合计、斑马纹、文字溢出省略。

## Import

```ts
// UTable 由 Vite 自动导入，无需手动 import
import { defineTableColumns } from '@veltra/desktop'
```

## 关联类型

```ts
interface TableColumn {
  key: string // 列唯一键 = 数据字段名 = 列插槽匹配名
  name: string // 表头文本（优先级低于 nameRender）
  nameRender?: (ctx: { column: TableColumnNode }) => RenderReturn // 自定义表头渲染
  width?: number // 列最大宽度（px）
  minWidth?: number // 列最小宽度（px）
  fixed?: 'left' | 'right' // 列固定（嵌套表头时无效）
  align?: 'left' | 'center' | 'right' // 列对齐，默认 'left'
  headerAlign?: 'left' | 'center' | 'right' // 表头对齐，默认跟随 align
  render?: (scope: TableColumnRenderContext) => RenderReturn // 自定义单元格渲染
  children?: TableColumn[] // 多级表头
  summary?: boolean | ((ctx: TableSummaryContext) => RenderReturn) // 表尾合计
  resizable?: boolean // 列宽可拖拽
  [key: string]: any // 透传到列插槽的额外属性
}

interface TableColumnRenderContext {
  row: TableRow
  rowData: Record<string, any>
  column: TableColumnNode
  val: any
}

interface TableColumnSlotsScope extends TableColumnRenderContext {
  model: { modelValue: any; 'onUpdate:modelValue': (val: any) => void } // 行内编辑用
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
    { key: 'age', name: '年龄', align: 'right' }, // align 不被覆盖
    { key: 'address', name: '地址' }
  ],
  { align: 'center', minWidth: 100 }
)
```

> 示例见 [examples.md](./examples.md)
