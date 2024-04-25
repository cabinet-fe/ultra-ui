import type { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'
import type { MenuProps } from '@ui/types/components/menu'

export interface MenuContext {
  cls: BEM<'menu'>
  menuProps: MenuProps
}

export const MenuDIKey: InjectionKey<MenuContext> = Symbol('MenuDIKey')