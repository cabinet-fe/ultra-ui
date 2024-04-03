import type { SliderProps, SliderEmits } from '@ui/types/components/slider'
import { computed, ref, shallowReactive, type ShallowRef } from 'vue'

export const useSlide = (
  props: SliderProps,
  emit: SliderEmits,
  sliderSize: ShallowRef<number>
) => {
  /** 第一个像素值 */
  let onePx = ref(0)

  let twoPx = ref(0)

  /** 范围最小值 */
  let minValue = ref(0)
  /** 范围最大值 */
  let maxValue = ref(0)

  const barStyles = shallowReactive({
    width: '0px',
    height: '0px',
    left: `0px`,
    bottom: `0px`
  })

  /** 更新size */
  const updateSliderBarSize = ({ x, y }) => {
    if (props.range) {
      let minPx = Math.min(onePx.value, twoPx.value)

      let maxPx = Math.max(onePx.value, twoPx.value)

      if (props.vertical) {
        barStyles.bottom = `${-maxPx}px`

        barStyles.width = `10px`
        barStyles.height = `${maxPx - minPx}px`
      } else {
        barStyles.left = `${minPx}px`
        barStyles.height = `10px`
        barStyles.width = `${maxPx - minPx}px`
      }
    } else {
      barStyles.height = `${-y || 10}px`
      barStyles.width = `${x || 10}px`
    }
  }

  return { onePx, twoPx, barStyles, minValue, maxValue, updateSliderBarSize }
}
