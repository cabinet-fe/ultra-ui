import { useResizeObserver } from '@ultra-ui/compositions'
import { ref, type Ref, type ShallowRef, shallowRef } from 'vue'

import type { SliderProps } from '../../types'

interface UseSliderReturn {
  offset1: Ref<number>
  offset2: Ref<number>
  sliderSize: Ref<number>
  sliderRef: ShallowRef<HTMLElement | undefined>
  slideRange: [number, number]
  value2SliderOffset: (value: number) => number
  sliderOffset2Value: (offset: number) => number
  getOffsetByStep: (offset: number) => number
}

export function useSlider(props: SliderProps<number | [number, number]>): UseSliderReturn {
  const sliderRef = shallowRef<HTMLElement>()
  const sliderSize = ref(0)
  const slideRange: [number, number] = [0, 0]
  const offset1 = ref(0)
  const offset2 = ref(0)

  useResizeObserver({
    targets: sliderRef,
    onResize([entry]) {
      if (!entry) return
      const { blockSize, inlineSize } = entry.borderBoxSize[0] ?? {}
      sliderSize.value = (props.vertical ? blockSize : inlineSize) ?? 0
      if (props.vertical) {
        slideRange[0] = -sliderSize.value
        slideRange[1] = 0
      } else {
        slideRange[0] = 0
        slideRange[1] = sliderSize.value
      }
    }
  })

  /**
   * 将value转换为slider的offset
   * @param value
   * @returns
   */
  function value2SliderOffset(value: number): number {
    const { min, max, vertical } = props
    const progress = (value - min!) / (max! - min!)
    const offset = sliderSize.value * progress
    return vertical ? -offset : offset
  }

  /**
   * 将slider的offset转换为value
   * @param offset
   * @returns
   */
  function sliderOffset2Value(offset: number): number {
    const { min, max } = props
    const progress = Math.abs(offset) / sliderSize.value

    return Math.round(progress * (max! - min!) + min!)
  }

  function getOffsetByStep(offset: number) {
    const { min, max, step } = props

    if (step) {
      const slideStep = (sliderSize.value / (max! - min!)) * step
      offset = Math.round(offset / slideStep) * slideStep

      if (offset > slideRange[1]) {
        offset = slideRange[1]
      } else if (offset < slideRange[0]) {
        offset = slideRange[0]
      }
    }

    return offset
  }

  return {
    offset1,
    offset2,
    sliderSize,
    sliderRef,
    slideRange,
    value2SliderOffset,
    sliderOffset2Value,
    getOffsetByStep
  }
}
