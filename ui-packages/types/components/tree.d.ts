import type { PropsWithServerQuery } from '../component-common'
import type { TreeNode } from 'cat-kit/fe'

interface CustomTreeNode<DataItem extends Record<string, any>>
  extends TreeNode<DataItem> {
  parent: CustomTreeNode<DataItem> | null
  children?: CustomTreeNode<DataItem>[]
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
  data: DataItem[]
  /** 可多选 */
  checkable?:
    | boolean
    | ((item: DataItem, node: CustomTreeNode<DataItem>) => boolean)
  /** 可单选 */
  selectable?:
    | boolean
    | ((item: DataItem, node: CustomTreeNode<DataItem>) => boolean)
  checkStrictly?: boolean
}

export interface TreeEmit {
  (e: 'expand', node: CustomTreeNode<DataItem>): void
  (e: 'node-click', node: CustomTreeNode<DataItem>): void
  (
    e: 'check',
    checked: boolean,
    value: DataItem,
    checkKeys: Set<string | number>
  ): void
}

export interface TreeNodeProps {
  node: CustomTreeNode<Record<string, any>>
}
