import type { InjectionKey, ShallowReactive, ShallowRef } from 'vue'
import type { Breakpoint, GridItemProps } from '../../types'

export interface GridContext {
  /** 当前断点 */
  currentBreakpoint: ShallowRef<Breakpoint | undefined>
  /** 栅格项属性 */
  gridItemsProps: ShallowReactive<Set<GridItemProps>>
}

export const GridDIKey: InjectionKey<GridContext> = Symbol('GridDIKey')
