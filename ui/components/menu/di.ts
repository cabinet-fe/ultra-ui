import type { BEM } from '@ui/utils'
import type { InjectionKey, Ref } from 'vue'
import type { MenuProps, MenuEmits } from '@ui/types/components/menu'

export interface MenuContext {
  cls: BEM<'menu'>
  menuProps: MenuProps
  menuEmit: MenuEmits
  expand: boolean
  openIndex: Ref<string>
  closeIndex: Ref<string>
}

export const MenuDIKey: InjectionKey<MenuContext> = Symbol('MenuDIKey')