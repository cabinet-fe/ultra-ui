import type { SliderInitData, SliderProps } from '@ui/types/components/slider'
import type { BEM } from '@ui/utils'
import type { InjectionKey, ToRefs } from 'vue'

export interface SliderContext extends ToRefs<SliderProps> {
  cls: BEM<'slider', 'u-slider'>,
  initData: SliderInitData
}

export const sliderContextKey: InjectionKey<SliderContext> =
  Symbol('sliderContextKey')
