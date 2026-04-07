import type { BEM } from '@ultra-ui/utils'
import type { ComputedRef, InjectionKey } from 'vue'
import type { MenuProps, MenuEmits } from '@ultra-ui/desktop/types'
import type { ComponentSize } from '@ultra-ui/desktop/types'
export interface MenuContext {
  cls: BEM<'menu', 'u-'>
  collapsedCls: BEM<'collapsed-menu', 'u-'>
  menuProps: MenuProps
  menuEmit: MenuEmits
  expandedPath: Set<string>
  size: ComputedRef<ComponentSize>
}

export const MenuDIKey: InjectionKey<MenuContext> = Symbol('MenuDIKey')
