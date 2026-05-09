import { type BEM, type ComponentSize, ExpandTransition } from '@veltra/utils'
import type { Component, ComputedRef, InjectionKey } from 'vue'

import type { CollapseIconPosition, CollapseValue } from '../../types'

export interface CollapseContext {
  cls: BEM<'collapse'>
  size: ComputedRef<ComponentSize>
  iconPosition: ComputedRef<CollapseIconPosition>
  expandIcon: ComputedRef<Component | undefined>
  activeValues: ComputedRef<CollapseValue[]>
  toggle: (value: CollapseValue) => void
  expandTransition: ExpandTransition
}

export const CollapseDIKey: InjectionKey<CollapseContext> = Symbol('Collapse')
