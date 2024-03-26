<template>
  <div :class="cls.e('button-wrap')" :style="styles" ref="slideButtonRef"
    @mousedown="handleButtonDown"
  >
    <div :class="cls.e('button')" />
  </div>
</template>
<script lang="ts" setup>
import { computed, inject, shallowReactive, shallowRef } from 'vue'
import { sliderContextKey } from './di'
import { useSlideButton } from './_compositions'
import { useDrag } from '@ui/compositions'
import countPosition from '../tip/position'

let injected = inject(sliderContextKey)!

let { cls } = injected

// const { wrapperStyle, handleButtonDown } = useSlideButton()

const mouseDownHandler = computed(() => {
  return injected.disable?.value ? undefined : handleButtonDown
})

const slideButtonRef = shallowRef<HTMLDivElement>()

const transform = shallowReactive({
  x: 0,
  y: 0
})

const styles = computed(() => {
  return {
    transform: `translate(${transform.x}px, ${transform.y}px)`
  }
})

const currentTransform = {
  x: 0,
  y: 0
}

useDrag({
  target: slideButtonRef,
  onDrag(x, y, e) {
    x = x + currentTransform.x
    transform.x = x < 0 ? 0 : x
    //  transform.y = y
  },

  onDragEnd(x, y, e) {
    currentTransform.x += x
  }
})
</script>
