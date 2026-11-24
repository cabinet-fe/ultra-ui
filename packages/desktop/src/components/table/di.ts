import type { VirtualItem } from '@cat-kit/fe'
import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey, ShallowRef, Slots } from 'vue'

import type {
  TableProps,
  TableColumnSlotsScope,
  TableColumnRenderContext,
  TableRow,
  RenderReturn,
  TableColumn,
  TableRowSlotsScope
} from '../../types'
import type { ColumnNode } from './node/col'
import type { ColumnConfig } from './use-columns'

export const TableDIKey: InjectionKey<{
  tableProps: TableProps
  tableSlots: Slots
  cls: BEM<'table'>
  rows: ShallowRef<TableRow[]>
  checkedRows: ShallowRef<Set<TableRow>>
  columnConfig: ColumnConfig
  handleRowClick: (row: TableRow, ev: MouseEvent) => void
  handleCellClick: (row: TableRow, column: TableColumn, ev: MouseEvent) => void
  getColumnSlotsNode: (ctx: TableColumnSlotsScope | TableColumnRenderContext) => RenderReturn
  getExpandRowSlotsNode: (ctx: TableRowSlotsScope) => RenderReturn
  getHeaderSlotsNode: (ctx: { column: ColumnNode }) => RenderReturn
  toggleTreeRowExpand: (row: TableRow) => void
  getCellClass: (column: ColumnNode) => string
  getHeaderCellClass: (column: ColumnNode) => string
  getCellCtx: (
    row: TableRow,
    column: ColumnNode
  ) => TableColumnSlotsScope | TableColumnRenderContext

  /**
   * 当前渲染窗口的虚拟项列表。
   *
   * 由 `useVirtualizer` 拆分出的 `items` shallowRef：仅在底层 `items`
   * 引用变化时才更新，`isScrolling` / 纯尺寸变化不会导致此 ref 更新。
   */
  virtualList: ShallowRef<VirtualItem[]>
  virtualEnabled: ComputedRef<boolean>
  /**
   * 测量行元素尺寸（参数顺序与底层 `Virtualizer.measureElement` 一致）。
   *
   * 元素卸载（`el === null`）时会从底层解绑，避免被移除的 `<tr>` 继续触发
   * size=0 测量回调。
   */
  measureElement: (index: number, el: Element | null) => void
}> = Symbol('TableDIKey')

export const TableResizeKey: InjectionKey<{
  handleResizeMousedown: (e: MouseEvent, resizeColumn: ColumnNode) => void
  headerRef: ShallowRef<HTMLElement | undefined>
}> = Symbol('TableResizeKey')
