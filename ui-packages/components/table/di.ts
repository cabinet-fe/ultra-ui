import type { InjectionKey } from "vue"
import type { TableProps } from "@ui/types/components/table"
import type { BEM } from "@ui/utils"

export const TableDIKey: InjectionKey<{
  /** 表格属性 */
  tableProps: TableProps<any>
  /** 类 */
  cls: BEM<'table'>
}> = Symbol('TableDIKey')