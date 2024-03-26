import type { TreeNode } from 'cat-kit/fe'
import type { DeconstructValue } from '../helper'
import type { VNode } from 'vue'

export interface TableColumn {
  key: string
  name: string
  width?: number
  minWidth?: number
  fixed?: 'left' | 'right'
  render?: () => VNode,
  children?: TableColumn[]
}

/** 表格组件属性 */
export interface TableProps<
  DataItem extends Record<string, any> = Record<string, any>
> {
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

/** 表格组件定义的事件 */
export interface TableEmits<DataItem> {
  /** 多选 */
  (e: 'update:checked', value: DataItem[]): void
  /** 单选 */
  (e: 'update:selected', value: DataItem | undefined): void
}

/** 表格组件暴露的属性和方法(组件内部使用) */
export interface _TableExposed {}

/** 表格组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TableExposed = DeconstructValue<_TableExposed>
