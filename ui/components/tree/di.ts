import type { InjectionKey, ShallowRef, VNode } from 'vue'
import type {
  TreeEmit,
  TreeProps,
  TreeNode
} from '@ui/types/components/tree'
import type { BEM } from '@ui/utils'

export interface TreeSlotsScope<
  DataItem extends Record<string, any> = Record<string, any>
> {
  node: TreeNode<DataItem>
  data: DataItem
}

export interface TreeConText {
  /** 树组件属性 */
  treeProps: TreeProps
  /** BEM */
  cls: BEM<'tree'>
  /** 单选选中的节点 */
  selected: ShallowRef<TreeNode<Record<string, any>> | undefined>
  /** 多选的节点 */
  checked: Set<string | number>
  getTreeSlotsNode: (ctx: TreeSlotsScope) => VNode[] | undefined
  treeEmit: TreeEmit
  getFlattedNodes: (filter?: (node: TreeNode<Record<string, any>>) => boolean) => void
}

/** 树依赖注入key */
export const TreeDIKey: InjectionKey<TreeConText> = Symbol('TreeDIKey')
