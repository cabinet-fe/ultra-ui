import type { Forest, TreeNode } from '@cat-kit/core'
import type { ComponentSize, DeconstructValue, RenderReturn } from '@veltra/utils'
import type { ShallowRef, Slots, VNode } from 'vue'

export type TableColumnAlign = 'left' | 'center' | 'right'

export interface TableColumnStyle {
  color?: string
  fontSize?: number | string
}

export interface TableSummaryContext {
  total: number
  rows: TableRow[]
  checkedRows: Set<TableRow>
  column: TableColumnNode
}

export interface TableColumn {
  key: string
  name: string
  /** 表头渲染，优先级大于name属性 */
  nameRender?: (ctx: {
    column: TableColumnNode
  }) => VNode | string | null | undefined | (VNode | string | null | undefined)[]
  /** 列最大宽度 */
  width?: number
  minWidth?: number
  /**
   * 列固定方式，为嵌套表头时此值无效
   * @default 'left'
   */
  fixed?: 'left' | 'right'
  /**
   * 表头对齐方式, 如果没有指定，则默认使用align属性
   * @default TableColumn['align']
   */
  headerAlign?: TableColumnAlign
  /**
   * @default 'left'
   */
  align?: TableColumnAlign
  style?: TableColumnStyle
  /** 表头单元格样式，未指定时取 style */
  headerStyle?: TableColumnStyle
  render?: (scope: TableColumnRenderContext) => RenderReturn
  children?: TableColumn[]
  summary?: boolean | ((ctx: TableSummaryContext) => RenderReturn)
  resizable?: boolean
  [key: string]: any
}

export interface TableProps {
  size?: ComponentSize
  data?: Record<string, any>[]
  columns?: TableColumn[]
  checked?: Record<string, any>[]
  /**
   * 单选时的已选项
   * @description 该属性需要指定rowKey来表示唯一性
   */
  selected?: Record<string, any>
  /**
   * 多选
   * @description 该属性需要指定rowKey来表示唯一性
   */
  checkable?: boolean
  showIndex?: boolean
  selectable?: boolean
  /**
   * 标记为一个树形组件
   * @default false
   * @description 如果传入了一个字符串则代表树的子节点的key值
   */
  tree?: boolean | string
  /**
   * 作用域插槽
   * @description
   * 使用此插槽可以自定义使用外部组件的插槽而无需一级一级的嵌套
   */
  slots?: Readonly<Slots>
  mergeCell?: (ctx: TableColumnRenderContext) => { rowspan: number; colspan: number } | undefined

  current?: TableRow

  /**
   * 高亮当前点击的行，即使没有设置current属性
   * @default false
   *
   */
  highlightCurrent?: boolean
  /**
   * 行key
   * @description 用于标识行的唯一性，对于单选和多选来说是必须的
   */
  rowKey?: string

  /**
   * @default true
   */
  stripe?: boolean
  /**
   * @default false
   */
  border?: boolean
  /**
   * @default 80
   */
  virtualThreshold?: number
  /** 是否开启展开行, 只在非树形模式下有效 */
  expandable?: boolean
  defaultExpandAll?: boolean
  textEllipsis?: boolean
}

export interface TableRow extends TreeNode<Record<string, any>> {
  expanded: boolean
  operating: boolean
  checked: boolean
  isCurrent: boolean
  uid: number | string
  /** 索引路径 */
  indexes: number[]
  children?: TableRow[]
  parent?: TableRow
  isExpandRow: boolean
}

export interface TableColumnNode extends TreeNode<TableColumn> {
  children?: TableColumnNode[] | undefined
  parent?: TableColumnNode
  leafs?: number
  key: string
  name: string
  align: TableColumnAlign
  headerAlign: TableColumnAlign
  cellStyle?: Record<string, string>
  headerCellStyle?: Record<string, string>
  width: number | undefined
  minWidth: number | undefined
  fixed: 'left' | 'right' | undefined
  isLastFixed: boolean
  isFirstFixed: boolean
  style: Record<string, number>
}

export interface TableColumnRenderContext {
  row: TableRow
  rowData: Record<string, any>
  column: TableColumnNode
  val: any
}

export interface TableColumnSlotsScope extends TableColumnRenderContext {
  model: { modelValue: any; 'onUpdate:modelValue': (val: any) => void }
}

export interface TableRowSlotsScope {
  row: TableRow
  rowData: Record<string, any>
  columns: TableColumnNode[]
  index: number
}

export interface TableEmits<DataItem extends Record<string, any> = Record<string, any>> {
  (e: 'update:checked', value: DataItem[]): void
  (e: 'update:selected', value: DataItem | undefined): void
  (e: 'update:rows', rows: TableRow[]): void
  (e: 'update:forest', rows?: Forest<Record<string, unknown>, any>): void
  (e: 'row-click', row: TableRow, ev: MouseEvent): void
  (e: 'cell-click', row: TableRow, column: TableColumn, ev: MouseEvent): void
  (e: 'update:current', row?: TableRow): void
}

export interface _TableExposed {
  el: ShallowRef<HTMLElement | undefined>
  clearChecked: () => void
  clearSelected: () => void
  getRowByData: (data: Record<string, any>) => TableRow | undefined
  getSummaryRow: () => Record<string, any>
}

/** 表格组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TableExposed = DeconstructValue<_TableExposed>
