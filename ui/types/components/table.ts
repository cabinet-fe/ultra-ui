import type { Forest, TreeNode } from 'cat-kit/fe'
import type { DeconstructValue, RenderReturn } from '../helper'
import type { ShallowRef, Slots, VNode } from 'vue'
import type { ComponentSize } from '../component-common'
import type { ColumnNode } from '@ui/components'

export type TableColumnAlign = 'left' | 'center' | 'right'

/**
 * 合计上下文
 */
export interface TableSummaryContext {
  /** 总数 */
  total: number
  /** 所有行数据 */
  rows: TableRow[]
  /** 当前列 */
  column: ColumnNode
}

export interface TableColumn {
  /** 列的唯一键 */
  key: string
  /** 列的名称 */
  name: string
  /** 表头渲染，优先级大于name属性 */
  nameRender?: (ctx: {
    column: TableColumnNode
  }) =>
    | VNode
    | string
    | null
    | undefined
    | (VNode | string | null | undefined)[]
  /** 列最大宽度 */
  width?: number
  /** 列最小宽度 */
  minWidth?: number
  /**
   * 列固定方式，为嵌套表头时此值无效
   * @default 'left'
   */
  fixed?: 'left' | 'right'
  /**
   * 列对齐方式
   * @default 'left'
   */
  align?: TableColumnAlign
  /** 列渲染 */
  render?: (scope: TableColumnRenderContext) => RenderReturn
  /** 子列 */
  children?: TableColumn[]
  /** 表尾合计 */
  summary?: boolean | ((ctx: TableSummaryContext) => RenderReturn)
  [key: string]: any
}

/** 表格组件属性 */
export interface TableProps<
  DataItem extends Record<string, any> = Record<string, any>
> {
  size?: ComponentSize
  /** 表格数据 */
  data?: DataItem[]
  /** 表格列 */
  columns?: TableColumn[]
  /** 多选时的已选项 */
  checked?: DataItem[]
  /**
   * 单选时的已选项
   * @description 该属性需要指定rowKey来表示唯一性
   */
  selected?: DataItem
  /**
   * 多选
   * @description 该属性需要指定rowKey来表示唯一性
   */
  checkable?: boolean
  /** 索引 */
  showIndex?: boolean
  /** 单选 */
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
  /** 单元格合并 */
  mergeCell?: (ctx: TableColumnRenderContext) =>
    | {
        rowspan: number
        colspan: number
      }
    | undefined
  /** 高亮当前选中行 */
  highlightCurrent?: boolean
  /** 当前选中行 */
  currentRow?: TableRow<DataItem>
  /**
   * 行key
   * @description 用于标识行的唯一性，对于单选和多选来说是必须的
   */
  rowKey?: string

  /**  默认展开全部 */
  defaultExpandAll?: boolean
  /** 文本溢出省略 */
  textEllipsis?: boolean
}

export interface TableRow<
  DataItem extends Record<string, any> = Record<string, any>
> extends TreeNode<DataItem> {
  /** 是否展开 */
  expanded: boolean
  /** 操作中 */
  operating: boolean
  /** 是否选中 */
  checked: boolean
  /** 是否为当前点击的行 */
  isCurrent: boolean
  /** id */
  uid: number | string
  indexes: number[]
  /** 子row */
  children?: TableRow<DataItem>[]
  /** 父row */
  parent: TableRow<DataItem> | null
}

export interface TableColumnNode extends TreeNode<TableColumn> {
  /** 子列 */
  children?: TableColumnNode[] | undefined
  /** 父列 */
  parent: TableColumnNode | null
  /** 叶子节点数量 */
  leafs?: number
  key: string
  name: string
  align: TableColumnAlign
  width: number | undefined
  minWidth: number | undefined
  fixed: 'left' | 'right' | undefined
  isLastFixed: boolean
  isFirstFixed: boolean
  style: Record<string, number>
}

/**
 * 列渲染函数参数上下文
 */
export interface TableColumnRenderContext {
  /** 行 */
  row: TableRow
  /** 行数据 */
  rowData: Record<string, any>
  /** 列节点 */
  column: TableColumnNode
  /** 单元格数据 */
  val: any
}

/** 表格列插槽作用域 */
export interface TableColumnSlotsScope extends TableColumnRenderContext {
  /** 交互模型 */
  model: {
    modelValue: any
    'onUpdate:modelValue': (val: any) => void
  }
}

/** 表格组件定义的事件 */
export interface TableEmits<
  DataItem extends Record<string, any> = Record<string, any>
> {
  /** 多选 */
  (e: 'update:checked', value: DataItem[]): void
  /** 单选 */
  (e: 'update:selected', value: DataItem | undefined): void
  /** 数据更新 */
  (e: 'update:data', value: DataItem[]): void
  /** 行数据更新 */
  (e: 'update:rows', rows: TableRow<DataItem>[]): void
  /** 树形数据森林结构更新 */
  (e: 'update:forest', rows?: Forest<TableRow<DataItem>>): void
  /** 行点击事件 */
  (e: 'row-click', row: TableRow<DataItem>): void
  /** 当前行变更 */
  (e: 'update:currentRow', row?: TableRow<DataItem>): void
}

/** 表格组件暴露的属性和方法(组件内部使用) */
export interface _TableExposed {
  el: ShallowRef<HTMLElement | undefined>
  /** 清除选中的项 */
  clearChecked: () => void
  /** 清除单选的选项 */
  clearSelected: () => void
  /** 通过数据获取表格行 */
  getRowByData: (data: Record<string, any>) => TableRow | undefined
}

/** 表格组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TableExposed = DeconstructValue<_TableExposed>
