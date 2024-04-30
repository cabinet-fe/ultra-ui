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
  /** 可多选 */
  checkable?:
    | boolean
    | ((item: DataItem, node: TreeNode<DataItem>) => boolean)
  /** 可单选 */
  selectable?:
    | boolean
    | ((item: DataItem, node: TreeNode<DataItem>) => boolean)
  checkStrictly?: boolean
}

export interface TreeEmit {
  (e: 'expand', node: TreeNode<Record<string, any>>): void
  (e: 'node-click', node: TreeNode<Record<string, any>>): void
  (
    e: 'check',
    checked: boolean,
    value: Record<string, any>,
    checkKeys: Set<string | number>
  ): void
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
