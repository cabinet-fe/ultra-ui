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
  const slider = shallowRef<HTMLElement>()

  const sliderPointerEvent = (event: MouseEvent | TouchEvent) => {
    if (!initData.dragging || props.disable) return
    let newPercent = ref(0)

    const clientX =
      (event as TouchEvent).touches?.item(0)?.clientX ??
      (event as MouseEvent).clientX

    console.log(clientX, 'clientX')
    // const sliderOffsetLeft = slider.value!.getBoundingClientRect().left
    // newPercent.value = clientX - sliderOffsetLeft

    return newPercent
  }

  const handleSliderDown = async (event: MouseEvent | TouchEvent) => {
    initData.dragging = true

    console.log(sliderPointerEvent(event))
  }

  return {
    handleSliderDown
  }
}
