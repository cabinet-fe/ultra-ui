import type { InjectionKey, ShallowReactive, ShallowRef, VNode } from 'vue'
import type { TreeEmit, TreeProps, CustomTreeNode } from '@ui/types/components/tree'
import type { BEM } from '@ui/utils'

interface TreeSlotsScope {
  node: CustomTreeNode<any>
  data: any
}

export interface TreeConText {
  /** 树组件属性 */
  treeProps: TreeProps
  /** BEM */
  cls: BEM<'tree'>
  /** 单选选中的节点 */
  selected: ShallowRef<CustomTreeNode<Record<string, any>> | undefined>
  /** 多选的节点 */
  checked:  Set<string | number>
  getTreeSlotsNode: (ctx: TreeSlotsScope) => VNode[] | undefined
  treeEmit: TreeEmit
}

/** 树依赖注入key */
export const TreeDIKey: InjectionKey<ShallowReactive<TreeConText>> =
  Symbol('TreeDIKey')
