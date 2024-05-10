import type { PropsWithServerQuery } from '../component-common'
import type { TreeNode as _TreeNode } from 'cat-kit/fe'
import type { DeconstructValue } from '../helper'

export interface TreeNode<DataItem extends Record<string, any>>
  extends _TreeNode<DataItem> {
  parent: TreeNode<DataItem> | null
  children?: TreeNode<DataItem>[]
  visible: boolean
  expanded: boolean
  loading: boolean
  loaded: boolean
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  /** 单选高亮 */
  active: boolean
}

/** 树组件属性 */
export interface TreeProps<
  DataItem extends Record<string, any> = Record<string, any>
> extends PropsWithServerQuery {
  /** 是否展开所有节点 */
  expandAll?: boolean
  /** 是否在点击节点的时候展开或者收缩节点 */
  expandOnClickNode?: boolean
  /** label键 */
  labelKey?: string
  /** value键 */
  valueKey?: string
  /** 子节点键 */
  childrenKey?: string
  /** 数据 */
  data?: DataItem[]
  /** 禁止单选或多选的节点 */
  disabledNode?: (item: DataItem, node: TreeNode<DataItem>) => boolean
  /** 可多选 */
  checkable?: boolean
  /** 可单选 */
  selectable?: boolean
  /** 严格选择，选择的内容和父级不会产生关联 */
  checkStrictly?: boolean
  /** 单选选中项 */
  selected?: any
  /** 多选选中项 */
  checked?: any[]

}

export interface TreeEmit<
  Data extends Record<string, any> = Record<string, any>
> {
  /** 节点展开/折叠事件 */
  (e: 'expand', node: TreeNode<Data>): void
  /** 节点点击事件 */
  (e: 'node-click', node: TreeNode<Data>): void
  (e: 'update:selected', selected?: any, selectedData?: Data): void
  (e: 'update:checked', checked: any[], checkedData: Data[]): void
}

export interface TreeNodeProps {
  node: TreeNode<Record<string, any>>
}

/** 树组件暴露的属性和方法(组件内部使用) */
export interface _TreeExposed<DataItem extends Record<string, any>> {
  filter(filter: (node: TreeNode<DataItem>) => boolean): void
}

/** 树组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeExposed<DataItem extends Record<string, any>> =
  DeconstructValue<_TreeExposed<DataItem>>
