import type { InjectionKey, ShallowRef, VNode } from 'vue'
import type { TreeEmit, TreeProps, TreeNode } from '@ui/types/components/tree'
import type { BEM } from '@ui/utils'

export interface TreeSlotsScope {
  node: TreeNode
  data: Record<string, any>
}

export interface TreeConText {
  /** 树组件属性 */
  treeProps: TreeProps
  /** BEM */
  cls: BEM<'tree'>
  /** 单选选中的节点 */
  selected: ShallowRef<Record<string, any> | undefined>
  /** 多选的节点 */
  checked: Set<any>
  /** 隐藏的节点 */
  hiddenNodes: Set<TreeNode>
  /** 选择事件 */
  handleSelect: (data: TreeNode) => void
  /** 多选事件 */
  handleCheck: (node: TreeNode, check: boolean, ctrlKey?: boolean) => void
  /** 获取树的作用域插槽节点 */
  getTreeSlotsNode: (ctx: TreeSlotsScope) => VNode[] | string | undefined
  /** 树事件 */
  treeEmit: TreeEmit
  /** 获取碾平后的节点 */
  getFlattedNodes: (filter?: (node: TreeNode) => boolean) => void
}

/** 树依赖注入key */
export const TreeDIKey: InjectionKey<TreeConText> = Symbol('TreeDIKey')
