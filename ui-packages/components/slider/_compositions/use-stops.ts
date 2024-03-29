import { computed, shallowRef, watch } from 'vue'
import type { SliderProps } from '..'
import type { SliderInitData } from '@ui/types/components/slider'
import { useSlideButton } from '.'

export const useStops = (props: SliderProps, initData: SliderInitData) => {
  const { convertToPosition, resetButtonOffset, buttonOffset } = useSlideButton(
    props,
    initData
  )

  /** 断点位置(px) */
  let stops = computed(() => {
    if (props.step === 0) {
      console.error('step不应该为0')
      return []
    }

    let sliderSize = initData.sliderSize

    const stopCount = (props.max! - props.min!) / props.step!
    const stepWidth = (sliderSize * props.step!) / (props.max! - props.min!)

    const result = Array.from<number>({ length: stopCount }).map(
      (_, index) => index * stepWidth
    )

    return result
  })

  /** 断点就位 */
  let getStopStyle = (position: number) => {
    return props.vertical
      ? { bottom: `${position}px` }
      : { left: `${position}px` }
  }

  // /** 将stops转换具体的位置
  //  * @param 跑道大小
  //  * @param button大小
  //  */
  // let stopsToPosition = (runway: number, buttonOffset: number) => {
  //   return stops.value.map((item: any) => {
  //     return convertToPosition(item, runway, buttonOffset)
  //   })
  // }

  // /** 断点位置（px） */
  // const stopsPercentage = computed(() => {
  //   return stopsToPosition(initData.sliderSize, buttonOffset.value)
  // })
  // 如果接近0就跳到0，如果接近最大值

  /**
   * 在步长模式下 更新按钮位置
   * @param 当前位置
   */
  const setStepButtonPosition = (newPosition: number) => {
    let position = [...stops.value, 0, initData.sliderSize]

    const differences = position.map(value => Math.abs(value - newPosition))

    // 找到差值最小的值的索引
    const closestIndex = differences.indexOf(Math.min(...differences))

    // 计算当前位置距离最接近值的一d半的距离
    const halfDistance = Math.abs(position[closestIndex]! - newPosition) / 2

    let closestValue: number = 0

    if (halfDistance <= Math.min(...differences)) {
      // 自动跳转到接近的那个值
      closestValue = position[closestIndex]!
    } else {
      console.error('没有与当前位置接近的值')
    }

    return closestValue
  }

  return { stops, getStopStyle, setStepButtonPosition }
}
