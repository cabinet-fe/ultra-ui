import type { SliderProps } from '@ui/types'
import type { BEM } from '@ui/utils'
import type { ComputedRef, InjectionKey } from 'vue'

export interface SliderContext {
  cls: BEM<'slider'>
  range: [number, number]
  sliderProps: SliderProps<[number, number] | number>
  disabled: ComputedRef<boolean>
  getOffsetByStep: (offset: number) => number
}

export const sliderContextKey: InjectionKey<SliderContext> =
  Symbol('sliderContextKey')
