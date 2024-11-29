<template>
  <div :class="cls.e('alpha-slider')" ref="alphaSliderRef">
    <div
      :class="cls.e('alpha-slider-bg')"
      :style="{
        background: alphaSliderBG
      }"
    ></div>

    <span
      :class="cls.e('slider-thumb')"
      ref="alphaSliderThumbRef"
      @click.stop
      :style="alphaSliderThumbStyle"
    ></span>
  </div>
</template>

<script lang="ts" setup>
import { useAlphaSlider } from './use-alpha-slider'
import { PaletteDIKey } from './di'
import { computed, inject } from 'vue'

defineOptions({
  name: 'PaletteAlphaSlider'
})

const { cls, updateAlpha, RGBA } = inject(PaletteDIKey)!

const { alphaSliderRef, alphaSliderThumbRef, alphaSliderThumbStyle } =
  useAlphaSlider({
    updateAlpha
  })

const alphaSliderBG = computed(() => {
  const { r, g, b } = RGBA
  return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1))`
})
</script>
