import type { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'
import type { MenuProps, MenuEmits } from '@ui/types/components/menu'

export interface MenuContext {
  cls: BEM<'menu', 'u-'>
  menuProps: MenuProps
  menuEmit: MenuEmits
  expandedPath: Set<string>
}

export const MenuDIKey: InjectionKey<MenuContext> = Symbol('MenuDIKey')
