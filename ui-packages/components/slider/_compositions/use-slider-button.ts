import { computed, inject, ref, shallowRef } from 'vue'
import { sliderContextKey } from '../di'
import type { SliderInitData, SliderProps } from '@ui/types/components/slider'

export const useSlideButton = (
  initData: SliderInitData,
  sliderProps: SliderProps
) => {
  let slideButtonRef = shallowRef<HTMLDivElement>()

  /** 按钮的宽高 */
  let buttonOffset = ref(0)

  const warpStyles = computed(() => {
    return {
      transform: `translate(${initData.transform.x}px, ${initData.transform.y}px)`
    }
  })

  /** 更新按钮宽高 */
  const resetButtonOffset = () => {
    if (slideButtonRef.value) {
      buttonOffset.value = sliderProps.vertical
        ? slideButtonRef.value?.offsetHeight
        : slideButtonRef.value?.offsetWidth
    }
  }

  /** 转换百分比 */
  const convertToPercentage = (
    runway: number,
    button: number,
    currentXY: number
  ) => {
    if (sliderProps.vertical) {
      let percent = (currentXY / (button - runway)) * 100 + 100
      /** 将百分比转换成位置 */
      return Math.floor(percent)
    } else {
      let percent = (currentXY / (runway - button)) * 100

      return Math.floor(percent)
    }
  }

  /** 将百分比转换为位置
   * @param percent 百分比
   * @param runway 跑道宽度
   * @param button 手柄宽度
   */
  const convertToPosition = (
    percent: number,
    sliderSize: number,
    button: number
  ) => {
    let position = (percent / 100) * (sliderSize - button)

    return Math.floor(position)
  }

  return {
    warpStyles,
    slideButtonRef,
    buttonOffset,
    resetButtonOffset,
    convertToPosition,
    convertToPercentage
  }
}
