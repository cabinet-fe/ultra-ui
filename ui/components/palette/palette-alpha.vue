<template>
  <div :class="cls.e('alpha')" ref="alphaRef">
    <div
      :class="cls.e('alpha-bg')"
      :style="{
        background: alphaSliderBG
      }"
    ></div>

    <span
      :class="cls.e('alpha-thumb')"
      @click.stop
      :style="alphaThumbStyle"
    ></span>
  </div>
</template>

<script lang="ts" setup>
import { PaletteDIKey } from './di'
import { computed, inject, shallowRef, onMounted } from 'vue'
import { useDrag } from '@ui/compositions'

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
    updateAlpha(offsetX / alphaWidth)
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

function init() {
  getAlphaWidth()
  alphaThumbTransformX.value = alphaWidth * alpha.value
}

onMounted(() => {
  init()
})

defineExpose({
  init
})
</script>
