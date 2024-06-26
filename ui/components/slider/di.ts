import type { SliderEmits, SliderProps } from '@ui/types/components/slider'
import type { BEM } from '@ui/utils'
import type { ComputedRef, InjectionKey, ModelRef, ShallowRef } from 'vue'

export interface SliderContext {
  cls: BEM<'slider'>
  runwayRef: ShallowRef<HTMLElement | undefined>
  sliderSize: ShallowRef<number>
  emit: SliderEmits
  sliderProps: SliderProps
  model: ModelRef<number | number[] | undefined>
  disabled: ComputedRef<boolean>
  setSliderBarSize: ({ x, y }: { x: number; y: number }) => void
}

export const sliderContextKey: InjectionKey<SliderContext> =
  Symbol('sliderContextKey')
