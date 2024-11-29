<template>
  <div :class="cls.e('slider')" ref="sliderRef">
    <span
      :class="cls.e('slider-thumb')"
      ref="sliderThumbRef"
      @click.stop
      :style="sliderThumbStyle"
    ></span>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { PaletteDIKey } from './di'
import { useColorSlider } from './use-color-slider'

defineOptions({
  name: 'PaletteColorSlider'
})

const { cls, updateRGB } = inject(PaletteDIKey)!

const { sliderRef, sliderThumbRef, sliderThumbStyle } = useColorSlider({
  updateRGB
})
</script>
