import type { ComputedRef, InjectionKey, ShallowRef, Slots } from 'vue'
import type {
  TableProps,
  TableColumnSlotsScope,
  TableColumnRenderContext
} from '@ui/types/components/table'
import type { BEM } from '@ui/utils'
import type { TableRow } from './use-rows'
import type { ColumnConfig, ColumnNode } from './use-columns'
import type { RenderReturn } from '@ui/types/helper'
import type { VirtualItem } from '@tanstack/vue-virtual'

export const TableDIKey: InjectionKey<{
  /** 表格属性 */
  tableProps: TableProps
  /** 表格插槽 */
  tableSlots: Slots
  /** 类 */
  cls: BEM<'table'>
  /** 行 */
  rows: ShallowRef<TableRow[]>
  /** 结构化列 */
  columnConfig: ColumnConfig
  /** 事件处理方法 */
  handleRowClick: (row: TableRow) => void
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

  /** 获取单元格上下文 */
  getCellCtx: (
    row: TableRow,
    column: ColumnNode
  ) => TableColumnSlotsScope | TableColumnRenderContext

  /** 虚拟列表 */
  virtualList: ComputedRef<VirtualItem<HTMLElement>[]>
  /** 虚拟列表总高度 */
  totalHeight: ComputedRef<number>
}> = Symbol('TableDIKey')
