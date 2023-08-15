import { InjectionKey } from 'vue'
import type { TreeProps } from './tree.type'
import { BEM } from '@ui/utils'

/** 树依赖注入key */
export const TreeDIKey: InjectionKey<{
  /** 树组件属性 */
  treeProps: TreeProps
  /** BEM */
  cls: BEM<'tree'>
}> = Symbol()
