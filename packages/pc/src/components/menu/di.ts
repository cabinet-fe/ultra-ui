import type { BEM, ComponentSize } from '@ultra-ui/core'
import type { ComputedRef, InjectionKey } from 'vue'
import type { MenuProps, MenuEmits } from '@ultra-ui/pc/types'
export interface MenuContext {
  cls: BEM<'menu', 'u-'>
  collapsedCls: BEM<'collapsed-menu', 'u-'>
  menuProps: MenuProps
  menuEmit: MenuEmits
  expandedPath: Set<string>
  size: ComputedRef<ComponentSize>
}

export const MenuDIKey: InjectionKey<MenuContext> = Symbol('MenuDIKey')
