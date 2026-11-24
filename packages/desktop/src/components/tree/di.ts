import type { BEM } from '@veltra/utils'
import type { InjectionKey, VNode } from 'vue'

import type { TreeEmit, TreeProps, TreeNode } from '../../types'

export interface TreeSlotsScope {
  node: TreeNode
  data: Record<string, any>
}

export interface TreeConText {
  treeProps: TreeProps
  cls: BEM<'tree'>
  selectedData: Record<string, any> | undefined
  checkedData: Set<any>
  handleSelect: (data: TreeNode) => void
  toggleCheck: (node: TreeNode, check: boolean, ctrlKey?: boolean) => void
  getTreeSlotsNode: (ctx: TreeSlotsScope) => VNode[] | string | undefined
  treeEmit: TreeEmit
  getFlattedNodes: (filter?: (node: TreeNode) => boolean) => void
}

export const TreeDIKey: InjectionKey<TreeConText> = Symbol('TreeDIKey')
