import { computed, type ComputedRef, type ShallowRef } from 'vue'
import type { SliderProps } from '..'
import type { SliderInitData } from '@ui/types/components/slider'

interface Options {
  sliderProps: SliderProps
  sliderSize: ShallowRef<number>
}

export const useStops = (options: Options) => {
  const { sliderProps, sliderSize } = options
  /** 断点位置(px) */
  let stops = computed(() => {
    if (sliderProps.step === 0) {
      console.error('step不应该为0')
      return []
    }
  })

    /** 断点就位 */
    let getStopStyle = (position: number) => {
      return sliderProps.vertical ? { bottom: `${position}px` } : { left: `${position}px` }
    }

  return { stops, getStopStyle }
}
