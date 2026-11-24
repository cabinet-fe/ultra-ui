import type { InjectionKey, ShallowReactive, ShallowRef } from 'vue'

import type { Breakpoint, GridItemProps } from '../../types'

export interface GridContext {
  currentBreakpoint: ShallowRef<Breakpoint | undefined>
  gridItemsProps: ShallowReactive<Set<GridItemProps>>
}

export const GridDIKey: InjectionKey<GridContext> = Symbol('GridDIKey')
