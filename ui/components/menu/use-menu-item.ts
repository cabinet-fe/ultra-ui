import type { MenuItem } from '@ui/types'

import { scrollIntoContainerView, type BEM } from '@ui/utils'
import { computed, inject, shallowRef, watch, type ShallowRef, type ComputedRef } from 'vue'

import { MenuDIKey } from './di'

interface Options {
  itemProps: { menu: MenuItem; depth: number }
  itemRef: ShallowRef<HTMLElement | null>
}

interface UseMenuItemReturned {
  cls: BEM<'menu'>
  collapsedCls: BEM<'collapsed-menu'>

  active: ComputedRef<boolean>
  handleClickMenu: () => void
}

export function useMenuItem(options: Options): UseMenuItemReturned {
  const { itemProps, itemRef } = options
  const { cls, collapsedCls, menuProps, menuEmit } = inject(MenuDIKey)!

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
    if (itemProps.menu.disabled) return
    changedByClick = true
    menuEmit('item-click', itemProps.menu)
  }

  return {
    cls,
    collapsedCls,

    active,
    handleClickMenu
  }
}
