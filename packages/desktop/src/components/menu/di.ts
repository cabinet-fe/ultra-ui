import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey } from 'vue'

import type { MenuProps, MenuEmits } from '../../types'
import type { ComponentSize } from '../../types'

export interface MenuContext {
  cls: BEM<'menu', 'u-'>
  collapsedCls: BEM<'collapsed-menu', 'u-'>
  menuProps: MenuProps
  menuEmit: MenuEmits
  expandedPath: Set<string>
  size: ComputedRef<ComponentSize>
}

export const MenuDIKey: InjectionKey<MenuContext> = Symbol('MenuDIKey')
