import type { BEM } from '@ui/utils'
import type { InjectionKey, Ref, ComponentInternalInstance } from 'vue'
import type { MenuProps, MenuEmits } from '@ui/types/components/menu'

export interface MenuContext {
  cls: BEM<'menu'>
  menuProps: MenuProps
  menuEmit: MenuEmits
  expand: boolean
  openIndex: Ref<string>
  closeIndex: Ref<string>
  activeIndex: Ref<string>
}

export const MenuDIKey: InjectionKey<MenuContext> = Symbol('MenuDIKey')



export const calcIndent = (instance: ComponentInternalInstance) => {
  let depth = 0
  const getParent = (instance: ComponentInternalInstance) => {
    if (instance.parent) {
      if (instance.parent.type.name !== 'Menu') {
        if (!['BaseTransition', 'Transition'].includes(instance.parent.type.name!)) depth++
        getParent(instance.parent)
      }
    }
    return depth
  }

  return `${getParent(instance) * 20}px`
}