import { computed, type ShallowRef } from 'vue'
import type { SliderProps } from '..'

interface Options {
  sliderProps: SliderProps
  sliderSize: ShallowRef<number>
}

export const useStops = (options: Options) => {
  const { sliderProps, sliderSize } = options
  /** 断点位置(px) */
  let stops = computed(() => {
    if (sliderProps.step === 0) {
      console.error('step不应该为0')
      return []
    }

    const stopCount = (sliderProps.max! - sliderProps.min!) / sliderProps.step!
    const stepWidth =
      (sliderSize.value * sliderProps.step!) /
      (sliderProps.max! - sliderProps.min!)

    const result = Array.from<number>({ length: stopCount }).map(
      (_, index) => index * stepWidth
    )

    return result
  })

  /** 断点就位 */
  let getStopStyle = (position: number) => {
    return sliderProps.vertical
      ? { bottom: `${position}px` }
      : { left: `${position}px` }
  }

  /**
   * 在步长模式下 更新按钮位置
   * @param 当前位置
   */
  const setStepButtonPosition = (newPosition: number): number => {
    const positions = [...stops.value, sliderSize.value]

    // 计算 newPosition 和数组中每个位置的距离
    const distances = positions.map(position => {
      return Math.abs(newPosition - position)
    })

    // 找到最小距离的位置
    const minDistance = Math.min(...distances)
    const nearestPositionIndex = distances.indexOf(minDistance)

    // 返回离新位置最近的值
    return positions[nearestPositionIndex] ?? 0
  }

  return { stops, getStopStyle, setStepButtonPosition }
}
