import {
  computed,
  inject,
  shallowRef,
  watch,
  type ShallowRef,
  type ComputedRef
} from 'vue'
import type { MenuItem } from '@ui/types'
import { MenuDIKey } from './di'
import { scrollIntoContainerView, type BEM } from '@ui/utils'

interface Options {
  itemProps: { menu: MenuItem; depth: number }
}

interface UseMenuItemReturned {
  cls: BEM<'menu'>
  collapsedCls: BEM<'collapsed-menu'>
  itemRef: ShallowRef<HTMLElement | undefined>
  active: ComputedRef<boolean>
  handleClickMenu: () => void
}

export function useMenuItem(options: Options): UseMenuItemReturned {
  const { itemProps } = options
  const { cls, collapsedCls, menuProps, menuEmit } = inject(MenuDIKey)!
  const itemRef = shallowRef<HTMLElement>()

  const active = computed(() => {
    return menuProps.currentPath === itemProps.menu.path
  })

  let changedByClick = false
  watch([active, itemRef], ([active, itemEl]) => {
    if (changedByClick) {
      changedByClick = false
      return
    }
    if (!active || !itemEl) return
    scrollIntoContainerView(itemEl, null)
  })

  function handleClickMenu() {
    changedByClick = true
    menuEmit('item-click', itemProps.menu)
  }

  return {
    cls,
    collapsedCls,
    itemRef,
    active,
    handleClickMenu
  }
}
