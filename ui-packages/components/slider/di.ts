import type {
  SliderEmits,
  SliderInitData,
  SliderProps
} from '@ui/types/components/slider'
import type { BEM } from '@ui/utils'
import type { ComputedRef, InjectionKey, ModelRef, ShallowRef } from 'vue'

// export interface SliderContext {
//   cls: BEM<'slider', 'u-slider'>
//   initData: SliderInitData
//   emit: SliderEmits
//   resetSize: () => void
//   sliderProps: SliderProps
// }

export interface SliderContext {
  cls: BEM<'slider', 'u-slider'>
  runwayRef: ShallowRef<HTMLElement | undefined>
  sliderSize: ShallowRef<number>
  emit: SliderEmits
  sliderProps: SliderProps
  model: ModelRef<number | number[] | undefined>,
  setSliderSize: ({ x, y }: { x: number; y: number; }) => void
}

export const sliderContextKey: InjectionKey<SliderContext> =
  Symbol('sliderContextKey')
