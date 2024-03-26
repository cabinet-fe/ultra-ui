import type {
  SliderEmits,
  SliderInitData,
  SliderProps
} from '@ui/types/components/slider'
import { ref, shallowRef, type SetupContext } from 'vue'

export const useSlide = (
  props: SliderProps,
  initData: SliderInitData,
  emit: SetupContext<SliderEmits>['emit']
) => {
  /** 跑道ref */
  let sliderRef = shallowRef<HTMLElement>()

  const handleSliderDown = async (event: MouseEvent | TouchEvent) => {
    initData.dragging = true
  }

  /** 获取跑道大小 */
  const resetSize = () => {
    if (sliderRef.value) {
      initData.sliderSize =
        sliderRef.value[`client${props.vertical ? 'Height' : 'Width'}`]
        console.log(123123)
    }
  }

  return {
    handleSliderDown,
    resetSize,
    sliderRef
  }
}
