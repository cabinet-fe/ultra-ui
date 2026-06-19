import { scrollIntoContainerView, type BEM } from '@veltra/utils'
import { computed, inject, watch, type ShallowRef, type ComputedRef } from 'vue'

import type { NavItem } from '../../types'
import { NavDIKey } from './di'

interface Options {
  itemProps: { item: NavItem; depth: number }
  itemRef: ShallowRef<HTMLElement | null>
}

interface UseNavItemReturned {
  cls: BEM<'nav'>
  collapsedCls: BEM<'collapsed-nav'>

  active: ComputedRef<boolean>
  handleClickItem: () => void
}

export function useNavItem(options: Options): UseNavItemReturned {
  const { itemProps, itemRef } = options
  const { cls, collapsedCls, navProps, navEmit } = inject(NavDIKey)!

  const active = computed(() => {
    return navProps.currentPath === itemProps.item.path
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

  function handleClickItem() {
    if (itemProps.item.disabled) return
    changedByClick = true
    navEmit('item-click', itemProps.item)
  }

  return {
    cls,
    collapsedCls,

    active,
    handleClickItem
  }
}
