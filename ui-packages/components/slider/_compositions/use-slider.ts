import type {
  SliderEmits,
  SliderInitData,
  SliderProps
} from '@ui/types/components/slider'
import { shallowRef, computed } from 'vue'

export const useSlide = (
  props: SliderProps,
  initData: SliderInitData,
  emit: SliderEmits
) => {
  /** 跑道ref */
  let sliderRef = shallowRef<HTMLElement>()
  /** 按钮ref */
  let sliderButtonRef = shallowRef<HTMLElement>()

  /** 点击 */
  const handleSliderDown = async (event: MouseEvent) => {
    if (props.vertical) {
      initData.transform.y = event.offsetY
    } else {
      initData.transform.x = event.offsetX
    }

    // emit('update:modelValue', convertToPercentage(initData.sliderSize, offset))
    // emit(
    //   'update:modelValue',
    //   convertToPercentage(
    //     initData.sliderSize,
    //     offset,
    //     props.vertical ? initData.transform.y : initData.transform.x
    //   )
    // )
  }

  /** 获取跑道大小 */
  const resetSize = () => {
    if (sliderRef.value) {
      initData.sliderSize =
        sliderRef.value[`client${props.vertical ? 'Height' : 'Width'}`]
    }
  }

  const barSize = computed(() => {
    return props.vertical
      ? `${initData.transform.y}px`
      : `${initData.transform.x}px`
  })

  /** bar的宽度或者长度 */
  const barStyles = computed(() => {
    return props.vertical ? { height: barSize.value } : { width: barSize.value }
  })

  return {
    handleSliderDown,
    resetSize,
    barStyles,
    sliderRef,
    sliderButtonRef
  }
}
