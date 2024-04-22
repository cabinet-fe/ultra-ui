import type { ComputedRef, InjectionKey, VNode } from 'vue'
import type { TableProps } from '@ui/types/components/table'
import type { BEM } from '@ui/utils'
import type { TableRow } from './use-rows'
import type { ColumnConfig, ColumnNode } from './use-columns'
import type { EventHandlers } from './use-events'

/** 表格列插槽作用域 */
export interface TableColumnSlotsScope {
  row: TableRow
  rowData: Record<string, any>
  column: ColumnNode
  val: any
  model: {
    modelValue: any
    'onUpdate:modelValue': (val: any) => void
  }
}

export const TableDIKey: InjectionKey<{
  /** 表格属性 */
  tableProps: TableProps
  /** 类 */
  cls: BEM<'table'>
  /** 行 */
  rows: ComputedRef<TableRow[]>
  /** 结构化列 */
  columnConfig: ColumnConfig
  /** 事件处理方法 */
  eventHandlers: EventHandlers<any>
  /** 表格列插槽node */
  getColumnSlotsNode: (
    key: string,
    ctx: TableColumnSlotsScope
  ) => VNode[] | undefined
  /** 表头插槽node */
  getHeaderSlotsNode: (
    key: string,
    ctx: { column: ColumnNode }
  ) => VNode[] | string | undefined

  /** 获取单元格的类 */
  getCellClass: (column: ColumnNode) => string[]
}> = Symbol('TableDIKey')
