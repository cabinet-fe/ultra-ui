<template>
  <div :class="cls.e('alpha')" ref="alphaRef">
    <div :class="cls.e('alpha-bg')" :style="{ background: alphaSliderBG }"></div>

    <span :class="cls.e('alpha-thumb')" @click.stop :style="alphaThumbStyle"></span>
  </div>
</template>

<script lang="ts" setup>
import { useDrag } from '@veltra/compositions'
import { computed, inject, shallowRef, onMounted, watch } from 'vue'

import { PaletteDIKey } from './di'

defineOptions({
  name: 'PaletteAlpha'
})

const { cls, updateAlpha, hueRGB, alpha, updater } = inject(PaletteDIKey)!

const alphaRef = shallowRef<HTMLElement>()

const alphaThumbTransformX = shallowRef(0)

const alphaThumbStyle = computed(() => {
  return { transform: `translateX(${alphaThumbTransformX.value}px)` }
})

let alphaWidth = 0
const rangeX = [0, 0] as [number, number]

function getAlphaWidth() {
  alphaWidth = alphaRef.value?.offsetWidth ?? 0
  rangeX[1] = alphaWidth
}

function updateOffsetX(offsetX: number) {
  updater.updateAndLock(() => {
    alphaThumbTransformX.value = offsetX
    updateAlpha(alphaWidth > 0 ? offsetX / alphaWidth : 0)
  })
}

const alphaDragger = useDrag({
  target: alphaRef,
  rangeX,
  onDrag({ offsetX }) {
    updateOffsetX(offsetX)
  },
  onDragStart(e) {
    getAlphaWidth()

    alphaDragger.update({ offsetX: e.offsetX })

    updateOffsetX(e.offsetX)
  }
})

const alphaSliderBG = computed(() => {
  const { r, g, b } = hueRGB.value
  return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1))`
})

function init(): void {
  getAlphaWidth()
  alphaThumbTransformX.value = alphaWidth > 0 ? alphaWidth * alpha.value : 0
}

onMounted(() => {
  init()
})

watch(
  alpha,
  (newAlphaValue) => {
    updater.update(() => {
      alphaThumbTransformX.value = alphaWidth > 0 ? alphaWidth * newAlphaValue : 0
    })
  },
  { flush: 'post' }
)

defineExpose({
  init
})
</script>
