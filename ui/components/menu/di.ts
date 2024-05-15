import type { BEM } from '@ui/utils'
import type { InjectionKey, Ref, ComponentInternalInstance } from 'vue'
import type { MenuProps, MenuEmits } from '@ui/types/components/menu'

export interface MenuContext {
  cls: BEM<'menu'>
  menuProps: MenuProps
  menuEmit: MenuEmits
  /** 是否展开 */
  expand: boolean
  /** 展开index */
  openIndex: Ref<string>
  /** 关闭index */
  closeIndex: Ref<string>
  /** 活动index */
  activeIndex: Ref<string>
  /** 是否缩略模式 */
  simple: Ref<boolean>
  /** 是否将index作为路由path */
  router: boolean
  /** 文字颜色 */
  textColor: string
  /** 激活的文字颜色 */
  activeTextColor: string
  /** 菜单背景色 */
  backgroundColor: string
  /** 唯一打开子菜单 */
  uniqueOpened: boolean
  /** 子菜单及其菜单项的对应关系 */
  structure: Ref<Record<string, Set<string>>>
}

export const MenuDIKey: InjectionKey<MenuContext> = Symbol('MenuDIKey')

export const calcIndent = (instance: ComponentInternalInstance) => {
  let depth = 0
  const getParent = (instance: ComponentInternalInstance) => {
    if (instance.parent) {
      if (instance.parent.type.name !== 'Menu') {
        if (['MenuSub', 'Tip'].includes(instance.parent.type.name!)) depth++
        getParent(instance.parent)
      }
    }
    return depth
  }

  return `${getParent(instance) * 20}px`
}

export const getSiblings = (instance: ComponentInternalInstance) => {
  const parent = instance?.parent?.type.name! === 'BaseTransition'
    ? instance?.parent?.parent?.parent
    : instance?.parent
  return parent?.slots.default ? parent?.slots.default().map((item) => {
    return item.props?.index
  }) : []
}

export const getParentIndex = (instance: ComponentInternalInstance) => {
  let res: string[] = [], parentType = ''
  const getParent = (instance: ComponentInternalInstance) => {
    parentType = instance.type.name || ''
    if (parentType === 'MenuSub') {
      res.push(String(instance.props?.index))
    } else if (parentType === 'Menu') {
      res.push('menu-root')
    }
    if (instance.parent && parentType !== 'Menu') getParent(instance.parent)
  }
  if (instance.parent) {
    getParent(instance.parent)
  }
  return res
}