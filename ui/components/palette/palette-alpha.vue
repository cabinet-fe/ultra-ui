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
      ref="alphaThumbRef"
      @click.stop
      :style="alphaThumbStyle"
    ></span>
  </div>
</template>

<script lang="ts" setup>
import { useAlpha } from './use-alpha'
import { PaletteDIKey } from './di'
import { computed, inject } from 'vue'

defineOptions({
  name: 'PaletteAlpha'
})

const { cls, updateAlpha, hue } = inject(PaletteDIKey)!

const { alphaRef, alphaThumbRef, alphaThumbStyle } = useAlpha({
  updateAlpha
})

const alphaSliderBG = computed(() => {
  const { r, g, b } = hue
  return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1))`
})
</script>
