import type { InjectionKey } from 'vue'
import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import type { BEM } from '@ui/utils'

/** 树依赖注入key */
export const TreeDIKey: InjectionKey<{
  /** 树组件属性 */
  treeProps: TreeProps
  /** BEM */
  cls: BEM<'tree'>,
  treeEmit: TreeEmit
}> = Symbol('TreeDIKey')
