import type { InjectionKey, VNode } from 'vue'
import type { TreeEmit, TreeProps, TreeNode } from '@ui/types'
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
  selectedData: Record<string, any> | undefined
  /** 多选的节点 */
  checkedData: Set<any>
  /** 选择事件 */
  handleSelect: (data: TreeNode) => void
  /** 多选切换 */
  toggleCheck: (node: TreeNode, check: boolean, ctrlKey?: boolean) => void
  /** 获取树的作用域插槽节点 */
  getTreeSlotsNode: (ctx: TreeSlotsScope) => VNode[] | string | undefined
  /** 树事件 */
  treeEmit: TreeEmit
  /** 获取碾平后的节点 */
  getFlattedNodes: (filter?: (node: TreeNode) => boolean) => void
}

/** 树依赖注入key */
export const TreeDIKey: InjectionKey<TreeConText> = Symbol('TreeDIKey')
