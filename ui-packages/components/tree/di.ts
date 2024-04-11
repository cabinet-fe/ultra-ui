import type { InjectionKey, ShallowReactive, ShallowRef } from 'vue'
import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import type { BEM } from '@ui/utils'
import type { CustomTreeNode } from './tree-node'

export interface TreeConText {
  /** 树组件属性 */
  treeProps: TreeProps
  /** BEM */
  cls: BEM<'tree'>
  /** 单选选中的节点 */
  selectNodes: ShallowRef<CustomTreeNode<Record<string, any>>>
  treeEmit: TreeEmit
}

/** 树依赖注入key */
export const TreeDIKey: InjectionKey<ShallowReactive<TreeConText>> = Symbol('TreeDIKey')
