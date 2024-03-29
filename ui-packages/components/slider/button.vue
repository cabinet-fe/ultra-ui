<template>
  <div
    :style="warpStyles"
    ref="slideButtonRef"
    @click.stop
    :class="cls.e('button-wrap')"
  >
    <div :class="cls.e('button')" />
  </div>
</template>
<script lang="ts" setup>
import { inject, nextTick } from 'vue'
import { sliderContextKey } from './di'
import { useDrag } from '@ui/compositions'
import { useSlideButton } from './_compositions'
import { useStops } from './_compositions'

let injected = inject(sliderContextKey)!

let { cls, resetSize, emit, initData, sliderProps } = injected

let { modelValue, vertical, height } = sliderProps

const {
  convertToPosition,
  convertToPercentage,
  resetButtonOffset,
  warpStyles,
  slideButtonRef,
  buttonOffset
} = useSlideButton(sliderProps, initData)

const { setStepButtonPosition } = useStops(sliderProps, initData)

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
    initData.transform.y = height! - position
    initData.currentTransform.y = height! - position
  } else {
    initData.transform.x = position
    initData.currentTransform.x = position
  }
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
      newPosition = initData.currentTransform.y + y
    } else {
      newPosition = x + initData.currentTransform.x
    }

    // let percentage = convertToPercentage(
    //   initData.sliderSize,
    //   buttonOffset.value,
    //   newPosition
    // )

    // 是否使用步长
    if (sliderProps.step && sliderProps.step > 0) {
      newPosition = setStepButtonPosition(newPosition)
    }

    const boundedPosition = Math.min(Math.max(0, newPosition), runwayMax)

    if (vertical) {
      initData.transform.y = boundedPosition
    } else {
      initData.transform.x = boundedPosition
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
      initData.currentTransform.y = initData.transform.y
    } else {
      initData.currentTransform.x = initData.transform.x
    }
  }
})
</script>
