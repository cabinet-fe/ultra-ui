import type { PropsWithServerQuery } from '../component-common'
import type { TreeNode } from 'cat-kit/fe'

interface CustomTreeNode<Val extends Record<string, any>>
  extends TreeNode<Val> {
  parent: CustomTreeNode<Val> | null
  children?: CustomTreeNode<Val>[]
  visible: boolean
  expanded: boolean
  loading: boolean
  loaded: boolean
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
  select?:
    | boolean
    | ((item: DataItem, node: CustomTreeNode<DataItem>) => boolean)
}

export interface TreeEmit {
  (e: 'expand', node: CustomTreeNode<DataItem>): void
  (e: 'node-click', value: DataItem, node: CustomTreeNode<DataItem>): void
}

export interface TreeNodeProps<Val> {
  node: CustomTreeNode<Val>
}

// // /** 树组件节点的事件 */
export interface TreeNodeEmit<DataItem> {
  (e: 'node-click', value: DataItem, node: CustomTreeNode<DataItem>): void
}
