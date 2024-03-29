import type { ComputedRef, InjectionKey, VNode } from "vue"
import type { TableProps } from "@ui/types/components/table"
import type { BEM } from "@ui/utils"
import type { TableRow } from "./use-rows"
import type { ColumnConfig } from "./use-columns"

export const TableDIKey: InjectionKey<{
  /** 表格属性 */
  tableProps: TableProps
  /** 类 */
  cls: BEM<'table'>
  /** 行 */
  rows: ComputedRef<TableRow[]>
  /** 结构化列 */
  columnConfig: ColumnConfig
  /** 表格插槽 */
  getColumnSlotsNode: (key: string, ctx: any) => VNode[] | undefined
}> = Symbol('TableDIKey')