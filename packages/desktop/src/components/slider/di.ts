import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey } from 'vue'

import type { SliderProps } from '../../types'

export interface SliderContext {
  cls: BEM<'slider'>
  range: [number, number]
  sliderProps: SliderProps<[number, number] | number>
  disabled: ComputedRef<boolean>
  getOffsetByStep: (offset: number) => number
}

export const sliderContextKey: InjectionKey<SliderContext> = Symbol('sliderContextKey')
