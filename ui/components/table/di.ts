import type { InjectionKey, ShallowRef, Slots } from 'vue'
import type {
  TableProps,
  TableColumnSlotsScope,
  TableColumnRenderContext,
  TableRow,
  RenderReturn,
  TableColumn
} from '@ui/types'
import type { BEM } from '@ui/utils'
import type { ColumnConfig } from './use-columns'
import type { VirtualReturned } from '@ui/compositions'
import type { ColumnNode } from './node/col'

export const TableDIKey: InjectionKey<
  {
    /** 表格属性 */
    tableProps: TableProps
    /** 表格插槽 */
    tableSlots: Slots
    /** 类 */
    cls: BEM<'table'>
    /** 行 */
    rows: ShallowRef<TableRow[]>
    /** 选中行 */
    checkedRows: ShallowRef<Set<TableRow>>
    /** 结构化列 */
    columnConfig: ColumnConfig
    /** 事件处理方法 */
    handleRowClick: (row: TableRow, ev: MouseEvent) => void
    /** 单元格点击 */
    handleCellClick: (
      row: TableRow,
      column: TableColumn,
      ev: MouseEvent
    ) => void
    /** 表格列插槽node */
    getColumnSlotsNode: (
      ctx: TableColumnSlotsScope | TableColumnRenderContext
    ) => RenderReturn
    /** 表头插槽node */
    getHeaderSlotsNode: (ctx: { column: ColumnNode }) => RenderReturn

    /** 展开/隐藏子节点 */
    toggleTreeRowExpand: (row: TableRow<Record<string, any>>) => void

    /** 获取单元格的类 */
    getCellClass: (column: ColumnNode) => string

    /** 获取表头单元格的类 */
    getHeaderCellClass: (column: ColumnNode) => string

    /** 获取单元格上下文 */
    getCellCtx: (
      row: TableRow,
      column: ColumnNode
    ) => TableColumnSlotsScope | TableColumnRenderContext
  } & VirtualReturned
> = Symbol('TableDIKey')

export const TableResizeKey: InjectionKey<{
  handleResizeMousedown: (e: MouseEvent, resizeColumn: ColumnNode) => void
  headerRef: ShallowRef<HTMLElement | undefined>
}> = Symbol('TableResizeKey')
