import { useResizeObserver } from '@ui/compositions'
import type { SliderProps } from '@ui/types/components/slider'
import {
  ref,
  shallowReactive,
  shallowRef,
  type ShallowRef
} from 'vue'

export const useSlide = (
  props: SliderProps,
  sliderSize: ShallowRef<number>
) => {
  /** 第一个值的位置 */
  let onePosition = ref(0)
  /** 第二个值的位置 */
  let twoPosition = ref(0)

  /** 范围最小值 */
  let minValue = ref(0)
  /** 范围最大值 */
  let maxValue = ref(0)

  const { range, vertical } = props

  const runwayRef = shallowRef<HTMLElement>()

  /** 根据页面实时响应 */
  useResizeObserver({
    target: runwayRef,
    onResize([entry]) {
      const rect = entry!.target.getBoundingClientRect()
      if (vertical) {
        sliderSize.value = rect.height
      } else {
        sliderSize.value = rect.width
      }
    }
  })

  const barStyles = shallowReactive({
    width: vertical ? '100%' : '0%',
    height: '100%',
    left: `0px`,
    bottom: `0px`
  })

  /** 更新bar的大小 */
  const updateSliderBarSize = ({ x, y }) => {
    if (range) {
      /** 最小的按钮的位置 */
      let minPosition = Math.min(onePosition.value, twoPosition.value)
      /** 最大按钮的位置 */
      let maxPosition = Math.max(onePosition.value, twoPosition.value)

      if (vertical) {
        barStyles.bottom = `${-maxPosition}px`
        barStyles.height = `${maxPosition - minPosition}px`
      } else {
        barStyles.left = `${minPosition}px`
        barStyles.width = `${maxPosition - minPosition}px`
      }
    } else {
      if (vertical) {
        barStyles.height = `${-y}px`
        barStyles.width = `100%`
      } else {
        barStyles.height = `100%`
        barStyles.width = `${x}px`
      }
    }
  }

  return {
    onePosition,
    twoPosition,
    barStyles,
    minValue,
    maxValue,
    runwayRef,
    updateSliderBarSize
  }
}
