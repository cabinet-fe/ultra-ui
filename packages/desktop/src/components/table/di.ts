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
  handleCellClick: (row: TableRow, column: TableColumn, ev: MouseEvent) => void
  /** 表格列插槽node */
  getColumnSlotsNode: (ctx: TableColumnSlotsScope | TableColumnRenderContext) => RenderReturn
  /** 展开行插槽node */
  getExpandRowSlotsNode: (ctx: TableRowSlotsScope) => RenderReturn
  /** 表头插槽node */
  getHeaderSlotsNode: (ctx: { column: ColumnNode }) => RenderReturn

  /** 展开/隐藏子节点 */
  toggleTreeRowExpand: (row: TableRow) => void

  /** 获取单元格的类 */
  getCellClass: (column: ColumnNode) => string

  /** 获取表头单元格的类 */
  getHeaderCellClass: (column: ColumnNode) => string

  /** 获取单元格上下文 */
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
  /** 是否启用虚拟列表 */
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
