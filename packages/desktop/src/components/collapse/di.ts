import { type BEM, type ComponentSize, ExpandTransition } from '@veltra/utils'
import type { Component, ComputedRef, InjectionKey } from 'vue'

import type { CollapseValue } from '../../types'

export interface CollapseContext {
  cls: BEM<'collapse'>
  size: ComputedRef<ComponentSize>
  bordered: ComputedRef<boolean>
  expandIcon: ComputedRef<Component | undefined>
  activeValues: ComputedRef<CollapseValue[]>
  toggle: (value: CollapseValue) => void
  expandTransition: ExpandTransition
  register: (value: CollapseValue) => void
  unregister: (value: CollapseValue) => void
}

export const CollapseDIKey: InjectionKey<CollapseContext> = Symbol('Collapse')
