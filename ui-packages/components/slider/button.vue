<template>
  {{}}
  <div :style="warpStyles" ref="slideButtonRef" :class="cls.e('button-wrap')">
    <div :class="cls.e('button')" />
  </div>
</template>
<script lang="ts" setup>
import { computed, inject, nextTick, shallowReactive } from 'vue'
import { sliderContextKey } from './di'
import { useDrag } from '@ui/compositions'
import { useSlideButton } from './_compositions'
import { useStops } from './_compositions'
import type { SliderButtonEmits } from '@ui/types/components/slider'

let injected = inject(sliderContextKey)!

let { cls, resetSize, emit, initData, sliderProps } = injected

let { modelValue, vertical, height } = sliderProps

const buttonEmit = defineEmits<SliderButtonEmits>()

const {
  convertToPosition,
  convertToPercentage,
  resetButtonOffset,
  slideButtonRef,
  buttonOffset
} = useSlideButton(sliderProps, initData)

const { setStepButtonPosition } = useStops(sliderProps, initData)

const transform = shallowReactive({
  x: 0,
  y: 0
})

const currentTransform = {
  x: 0,
  y: 0
}

/** button的位移距离 */
const warpStyles = computed(() => {
  return {
    transform: `translate(${transform.x}px, ${transform.y}px)`
  }
})

/** 页面加载时获取手柄位置 */
const handleButtonPosition = async () => {
  await nextTick()
  /** 执行这个获取轨道宽度 */
  resetSize()

  let position = convertToPosition(
    modelValue,
    initData.sliderSize,
    slideButtonRef.value?.offsetWidth!
  )
  if (vertical) {
    transform.y = height! - position
    currentTransform.y = height! - position
  } else {
    transform.x = position
    currentTransform.x = position
  }

  buttonEmit('firstValue', transform, currentTransform)
}
handleButtonPosition()

useDrag({
  target: slideButtonRef,
  onDrag(x, y, e) {
    if (!slideButtonRef.value?.offsetWidth) return

    if (buttonOffset.value === 0) {
      resetButtonOffset()
    }

    if (!buttonOffset.value) return

    const runwayMax = initData.sliderSize - buttonOffset.value
    let newPosition: number

    if (vertical) {
      newPosition = currentTransform.y + y
    } else {
      newPosition = x + currentTransform.x
    }

    // 是否使用步长
    if (sliderProps.step && sliderProps.step > 0) {
      newPosition = setStepButtonPosition(newPosition)
    }

    const boundedPosition = Math.min(Math.max(0, newPosition), runwayMax)

    if (vertical) {
      transform.y = boundedPosition
      buttonEmit('firstValue', transform, currentTransform)
    } else {
      transform.x = boundedPosition
      buttonEmit('firstValue', transform, currentTransform)
      // console.log(transform.x, currentTransform.x, 'firstValue')
    }

    emit(
      'update:modelValue',
      convertToPercentage(
        initData.sliderSize,
        buttonOffset.value,
        vertical ? initData.transform.y : initData.transform.x
      )
    )
  },

  onDragEnd(x, y, e) {
    if (vertical) {
      currentTransform.y = transform.y
      buttonEmit('firstValue', transform, currentTransform)
    } else {
      currentTransform.x = transform.x
      buttonEmit('firstValue', transform, currentTransform)
    }
  }
})
</script>
