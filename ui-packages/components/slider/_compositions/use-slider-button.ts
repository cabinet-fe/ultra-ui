import { computed, ref, shallowRef } from 'vue'
import type { SliderInitData, SliderProps } from '@ui/types/components/slider'

export const useSlideButton = (
  sliderProps: SliderProps,
  initData: SliderInitData
) => {
  let slideButtonRef = shallowRef<HTMLDivElement>()

  /** 按钮的大小 */
  let buttonOffset = ref(0)

  /** 更新按钮宽高 */
  const resetButtonOffset = () => {
    if (slideButtonRef.value) {
      buttonOffset.value = sliderProps.vertical
        ? slideButtonRef.value?.offsetHeight
        : slideButtonRef.value?.offsetWidth
    }
  }

  /** 转换百分比
   * @param 跑道大小
   * @param 手柄宽度
   * @param 当前的位置
   */
  const convertToPercentage = (
    runway: number,
    button: number,
    position: number
  ) => {
    if (sliderProps.vertical) {
      let percent = (position / (button - runway)) * 100 + 100
      /** 将百分比转换成位置 */
      return Math.floor(percent)
    } else {
      let percent = (position / (runway - button)) * 100

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

    return position
  }

  return {
    slideButtonRef,
    buttonOffset,
    resetButtonOffset,
    convertToPosition,
    convertToPercentage
  }
}
