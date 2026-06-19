import { type BEM, ExpandTransition } from '@veltra/utils'
import type { ComputedRef, InjectionKey } from 'vue'

import type { NavProps, NavEmits } from '../../types'
import type { ComponentSize } from '../../types'

export interface NavContext {
  cls: BEM<'nav', 'u-'>
  collapsedCls: BEM<'collapsed-nav', 'u-'>
  navProps: NavProps
  navEmit: NavEmits
  expandedPath: Set<string>
  size: ComputedRef<ComponentSize>
  expandTransition: ExpandTransition
}

export const NavDIKey: InjectionKey<NavContext> = Symbol('NavDIKey')
