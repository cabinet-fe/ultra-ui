import type { SliderProps } from '@ui/types'
import { ref, type Ref, type ShallowRef, shallowRef } from 'vue'
import { useResizeObserver } from '@ui/compositions'

interface UseSliderReturn {
  offset1: Ref<number>
  offset2: Ref<number>
  sliderSize: Ref<number>
  sliderRef: ShallowRef<HTMLElement | undefined>
  slideRange: [number, number]
  value2SliderOffset: (value: number) => number
  sliderOffset2Value: (offset: number) => number
}

export function useSlider(
  props: SliderProps<number | [number, number]>
): UseSliderReturn {
  const sliderRef = shallowRef<HTMLElement>()
  const sliderSize = ref(0)
  const slideRange: [number, number] = [0, 0]
  const offset1 = ref(0)
  const offset2 = ref(0)

  useResizeObserver({
    targets: sliderRef,
    onResize([entry]) {
      if (!entry) return
      slideRange[1] = sliderSize.value = entry.borderBoxSize[0]?.inlineSize ?? 0
    }
  })

  /**
   * 将value转换为slider的offset
   * @param value
   * @returns
   */
  function value2SliderOffset(value: number): number {
    const { min, max } = props
    const progress = (value - min!) / (max! - min!)
    return sliderSize.value * progress
  }

  /**
   * 将slider的offset转换为value
   * @param offset
   * @returns
   */
  function sliderOffset2Value(offset: number): number {
    const { min, max } = props
    const progress = offset / sliderSize.value

    return Math.round(progress * (max! - min!) + min!)
  }

  return {
    offset1,
    offset2,
    sliderSize,
    sliderRef,
    slideRange,
    value2SliderOffset,
    sliderOffset2Value
  }
}
