import { computed, inject, shallowRef, watch } from 'vue'
import type { MenuItem } from '@ui/types'
import { MenuDIKey } from './di'

interface Options {
  itemProps: { menu: MenuItem; depth: number }
}

export function useMenuItem(options: Options) {
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

    itemEl.scrollIntoView({ block: 'center' })
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
