import type { BEM } from '@ui/utils'
import type { ComputedRef, InjectionKey } from 'vue'
import type { MenuProps, MenuEmits } from '@ui/types'
import type { ComponentSize } from '@ui/types'
export interface MenuContext {
  cls: BEM<'menu', 'u-'>
  collapsedCls: BEM<'collapsed-menu', 'u-'>
  menuProps: MenuProps
  menuEmit: MenuEmits
  expandedPath: Set<string>
  size: ComputedRef<ComponentSize>
}

export const MenuDIKey: InjectionKey<MenuContext> = Symbol('MenuDIKey')
