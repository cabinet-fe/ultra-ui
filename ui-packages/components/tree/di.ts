import type { InjectionKey, ShallowReactive, ShallowRef } from 'vue'
import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import type { BEM } from '@ui/utils'

export interface TreeConText {
  /** 树组件属性 */
  treeProps: TreeProps
  /** BEM */
  cls: BEM<'tree'>
  /** 单选选中的节点 */
  selectNodes: ShallowRef<Record<string, any>>
  /** 多选的节点 */
  checkedData: Set<string | number> & Omit<Set<string | number>, keyof Set<any>>
  currentChecked: ShallowRef<currentCheckedType>
  treeEmit: TreeEmit
}

interface currentCheckedType {
  checked: boolean
  node: Record<string, any>
}

/** 树依赖注入key */
export const TreeDIKey: InjectionKey<ShallowReactive<TreeConText>> =
  Symbol('TreeDIKey')
