import { computed, inject } from 'vue'
import { sliderContextKey } from '../di'

export const useSlideButton = () => {
  let injected = inject(sliderContextKey)!

  let { vertical, modelValue, min, max } = injected

  const currentPosition = computed(() => {
    console.log(min)
    // return `${((modelValue - min.value) / (max.value - min.value)) * 100}%`
  })

  /** button的偏移值 */
  const wrapperStyle = computed(() => {
    return vertical?.value
      ? { bottom: `${currentPosition.value}` }
      : { left: `${currentPosition.value}` }
  })

  return { wrapperStyle }
}
