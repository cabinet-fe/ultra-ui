import type {
  SliderEmits,
  SliderInitData,
  SliderProps
} from '@ui/types/components/slider'
import { shallowRef, computed } from 'vue'
import { useSlideButton } from './use-slider-button'
import { useStops } from '.'

export const useSlide = (
  props: SliderProps,
  initData: SliderInitData,
  emit: SliderEmits
) => {
  /** 跑道ref */
  let sliderRef = shallowRef<HTMLElement>()
  /** 按钮ref */
  let sliderButtonRef = shallowRef<HTMLElement>()

  const { buttonOffset, convertToPercentage, resetButtonOffset } =
    useSlideButton(props, initData)

  const { setStepButtonPosition } = useStops(props, initData)

  /** 点击 */
  const handleSliderDown = async (event: MouseEvent) => {
    if (buttonOffset.value === 0) {
      resetButtonOffset()
    }

    if (props.vertical) {
      initData.transform.y = event.offsetY
      initData.currentTransform.y = event.offsetY
    } else {
      /** 最大边界 */
      const runwayMax = initData.sliderSize - buttonOffset.value

      if ((props.step ?? 0) > 0) {
        let position = setStepButtonPosition(event.offsetX)
        initData.transform.x = Math.min(Math.max(0, position), runwayMax)
        initData.currentTransform.x = Math.min(Math.max(0, position), runwayMax)
      } else {
        initData.transform.x = event.offsetX
        initData.currentTransform.x = event.offsetX
      }
    }
    emit(
      'update:modelValue',
      convertToPercentage(
        initData.sliderSize,
        buttonOffset.value,
        props.vertical ? initData.transform.y : initData.transform.x
      )
    )
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
      ? `${props.height! - initData.transform.y}px`
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
