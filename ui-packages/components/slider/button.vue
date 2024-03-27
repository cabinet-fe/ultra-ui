<template>
  <div
    :style="warpStyles"
    ref="slideButtonRef"
    @click.stop
    :class="cls.e('button-wrap')"
  >
    <div :class="cls.e('button-back')">
      <div :class="cls.e('button')" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { inject, nextTick, shallowRef } from 'vue'
import { sliderContextKey } from './di'
import { useDrag } from '@ui/compositions'
import { useSlideButton } from './_compositions'

let injected = inject(sliderContextKey)!

let { resetSize, initData, emit, sliderProps } = injected

let { modelValue, vertical } = sliderProps

let { cls } = injected

const { convertToPosition, convertToPercentage, warpStyles, slideButtonRef } = useSlideButton()

// const sliderButtonRef = shallowRef<HTMLDivElement>()

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
    initData.transform.y = position
    initData.currentTransform.y = position
  } else {
    initData.transform.x = position
    initData.currentTransform.x = position
  }
}
handleButtonPosition()

/** 拖拽手柄 */
useDrag({
  target: slideButtonRef,
  onDrag(x, y, e) {
    if (!slideButtonRef.value?.offsetWidth) return
    /** 获取宽高 */
    const offset = vertical
      ? slideButtonRef.value?.offsetHeight
      : slideButtonRef.value?.offsetWidth
    if (!offset) return

    const runwayMax = initData.sliderSize - offset

    let newPosition: number

    if (vertical) {
      newPosition = y + initData.currentTransform.y
      initData.transform.y = Math.min(Math.max(0, newPosition), runwayMax)
    } else {
      newPosition = x + initData.currentTransform.x
      initData.transform.x = Math.min(Math.max(0, newPosition), runwayMax)
    }

    emit(
      'update:modelValue',
      convertToPercentage(
        initData.sliderSize,
        offset,
        vertical ? initData.transform.y : initData.transform.x
      )
    )
  },

  onDragEnd(x, y, e) {
    if (vertical) {
      initData.currentTransform.y += y
    } else {
      initData.currentTransform.x += x
    }
  }
})
</script>
