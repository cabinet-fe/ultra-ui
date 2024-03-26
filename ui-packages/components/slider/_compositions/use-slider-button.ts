import { computed, inject, nextTick, ref, render, shallowRef } from 'vue'
import { sliderContextKey } from '../di'
import type { SliderEmits } from '@ui/types/components/slider'

export const useSlideButton = () => {
  let injected = inject(sliderContextKey)!

  let {
    disable,
    vertical,
    modelValue,
    initData,
    min,
    max,
    step,
    emit,
    resetSize
  } = injected

  let minVal = min?.value!
  let maxVal = max?.value!
  let stepVal = step?.value!

  const currentPosition = computed(() => {
    return `${((modelValue.value - minVal) / (maxVal - minVal)) * 100}%`
  })

  /** button的偏移值 */
  const wrapperStyle = computed(() => {
    return vertical?.value
      ? { bottom: `${currentPosition.value}` }
      : { left: `${currentPosition.value}` }
  })

  const getClientXY = (event: MouseEvent | TouchEvent) => {
    let clientX: number
    let clientY: number

    if (event.type.startsWith('touch')) {
      clientY = (event as TouchEvent).touches[0]?.clientY!
      clientX = (event as TouchEvent).touches[0]?.clientX!
    } else {
      clientY = (event as MouseEvent).clientY
      clientX = (event as MouseEvent).clientX
    }

    return {
      clientX,
      clientY
    }
  }

  const currentValue = ref(modelValue)

  /**  */
  const onDragging = (event: MouseEvent) => {
    let diff: number
    resetSize()

    const { clientX, clientY } = getClientXY(event)

    initData.currentX = clientX

    diff = ((initData.currentX - initData.startX) / initData.sliderSize) * 100

    console.log(initData.startPosition, 'initData.startPosition')
    initData.newPosition = initData.startPosition + diff

    setPosition(initData.newPosition)
  }

  /** 更新位置 */
  const setPosition = async (newPosition: number) => {
    if (newPosition === null || Number.isNaN(+newPosition)) return
    if (newPosition < 0) {
      newPosition = 0
    } else if (newPosition > 100) {
      newPosition = 100
    }

    const lengthPerStep = 100 / ((maxVal - minVal) / stepVal)
    const steps = Math.round(newPosition / lengthPerStep)
    let value = steps * lengthPerStep * (maxVal - minVal) * 0.01 + minVal

    emit('update:modelValue', value)

    if (!initData.dragging && modelValue.value !== initData.oldValue) {
      initData.oldValue = modelValue.value
    }
  }

  /** 松手时 */
  const onDraggingStop = (event: MouseEvent) => {
    console.log(initData.dragging, 'initData.dragging')
    if (initData.dragging) {
      initData.dragging = false

      window.removeEventListener('mousemove', onDragging)
      window.removeEventListener('mouseup', onDraggingStop)
    }
  }

  /** 抓 */
  const handleButtonDown = (event: MouseEvent) => {
    if (disable?.value) return
    // initData.dragging = true
    event.preventDefault()

    onDraggingStart(event)

    window.addEventListener('mousemove', onDragging)
    window.addEventListener('mouseup', onDraggingStop)
  }

  const onDraggingStart = (event: MouseEvent) => {
    if (initData.dragging) {
      initData.dragging = true
      const { clientX, clientY } = getClientXY(event)

      if (vertical?.value) {
        initData.startY = clientY
      } else {
        initData.startX = clientX
      }

      console.log(currentPosition, 'currentPosition')
      initData.startPosition = Number.parseFloat(currentPosition.value)
      initData.newPosition = initData.startPosition
    }
  }

  return { wrapperStyle, handleButtonDown }
}
