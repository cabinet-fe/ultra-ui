import type { TreeNode } from 'cat-kit/fe'
import type { DeconstructValue } from '../helper'
import type { VNode } from 'vue'
import type { ComponentSize } from '../component-common'

export type TableColumnAlign = 'left' | 'center' | 'right'

export interface TableColumn {
  /** 列的唯一键 */
  key: string
  /** 列的名称 */
  name: string
  /** 列最大宽度 */
  width?: number
  /** 列最小宽度 */
  minWidth?: number
  /**
   * 列固定方式
   * @default 'left'
   */
  fixed?: 'left' | 'right'
  /**
   * 列对齐方式
   * @default 'left'
   */
  align?: TableColumnAlign
  /** 列渲染 */
  render?: () => VNode
  /** 子列 */
  children?: TableColumn[]
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
  /** 单选时的已选项 */
  selected?: DataItem
  /** 多选 */
  checkable?: boolean
  /** 单选 */
  selectable?: boolean
  /** 单元格合并 */
  mergeCell?: () => {
    rowspan: number
    colspan: number
  }
}

export interface TableRow<DataItem extends Record<string, any>>
  extends TreeNode<DataItem> {
  /** 是否展开 */
  expanded: boolean
  /** id */
  uid: number
  /** 子row */
  children?: TableRow<DataItem>[]
  /** 父row */
  parent: TableRow<DataItem> | null
}



/** 表格组件定义的事件 */
export interface TableEmits<DataItem extends Record<string, any>> {
  /** 多选 */
  (e: 'update:checked', value: DataItem[]): void
  /** 单选 */
  (e: 'update:selected', value: DataItem | undefined): void
  /** 行点击事件 */
  (e: 'row-click', row: TableRow<DataItem>): void
}

/** 表格组件暴露的属性和方法(组件内部使用) */
export interface _TableExposed {}

/** 表格组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TableExposed = DeconstructValue<_TableExposed>
