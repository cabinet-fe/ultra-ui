import type { InjectionKey, ShallowRef, VNode } from 'vue'
import type { TreeEmit, TreeProps, TreeNode } from '@ui/types/components/tree'
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
  selected: ShallowRef<Record<string, any> | undefined>
  /** 多选的节点 */
  checked: Set<Record<string, any>>
  /** 选择事件 */
  handleSelect: (data: TreeNode<Record<string, any>>) => void
  /** 多选事件 */
  handleCheck: (node: TreeNode<Record<string, any>>, check: boolean) => void
  /** 获取树的作用域插槽节点 */
  getTreeSlotsNode: (ctx: TreeSlotsScope) => VNode[] | undefined
  /** 树事件 */
  treeEmit: TreeEmit<Record<string, any>>
  /** 获取碾平后的节点 */
  getFlattedNodes: (
    filter?: (node: TreeNode<Record<string, any>>) => boolean
  ) => void
}

/** 树依赖注入key */
export const TreeDIKey: InjectionKey<TreeConText> = Symbol('TreeDIKey')
