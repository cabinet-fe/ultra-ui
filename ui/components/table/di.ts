import type { InjectionKey, ShallowRef, Slots, VNode } from 'vue'
import type {
  TableProps,
  TableColumnSlotsScope,
  TableColumnRenderContext
} from '@ui/types/components/table'
import type { BEM } from '@ui/utils'
import type { TableRow } from './use-rows'
import type { ColumnConfig, ColumnNode } from './use-columns'
import type { EventHandlers } from './use-events'

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
  eventHandlers: EventHandlers<any>
  /** 表格列插槽node */
  getColumnSlotsNode: (ctx: TableColumnSlotsScope | TableColumnRenderContext) => VNode[] | undefined | VNode | string
  /** 表头插槽node */
  getHeaderSlotsNode: (ctx: {
    column: ColumnNode
  }) => VNode[] | string | undefined | VNode

  /** 展开/隐藏子节点 */
  toggleTreeRowExpand: (row: TableRow<Record<string, any>>) => void

  /** 获取单元格的类 */
  getCellClass: (column: ColumnNode) => string

  /** 获取单元格上下文 */
  getCellCtx: (row: TableRow, column: ColumnNode) => TableColumnSlotsScope | TableColumnRenderContext
}> = Symbol('TableDIKey')
