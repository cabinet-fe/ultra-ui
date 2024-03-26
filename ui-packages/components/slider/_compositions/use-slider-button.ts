import { computed, inject } from 'vue'
import { sliderContextKey } from '../di'

export const useSlideButton = () => {
  let injected = inject(sliderContextKey)!

  let { disable, vertical, initData, modelValue, min, max } = injected

  const currentPosition = computed(() => {
    return `${modelValue.value}%`
    // return `${((modelValue - min.value) / (max.value - min.value)) * 100}%`
  })

  /** button的偏移值 */
  const wrapperStyle = computed(() => {
    return vertical?.value
      ? { bottom: `${currentPosition.value}` }
      : { left: `${currentPosition.value}` }
  })

  const onDragging = (event: MouseEvent) => {
    if (initData.dragging) {
      console.log(event, 'event')
    }
    // emit('update:modelValue', currentValue.value);
  }

  const handleButtonDown = (event: MouseEvent | TouchEvent) => {
    if (disable?.value) return
    initData.dragging = true
    event.preventDefault()

    window.addEventListener('mousemove', onDragging)
  }

  const handleButtonStop = event => {}

  return { wrapperStyle, handleButtonDown }
}
