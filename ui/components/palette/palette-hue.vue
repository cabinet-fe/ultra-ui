<template>
  <div :class="cls.e('hue')" ref="hueRef">
    <span
      :class="cls.e('hue-thumb')"
      ref="hueThumbRef"
      @click.stop
      :style="hueThumbStyle"
    ></span>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { PaletteDIKey } from './di'
import { useHue } from './use-hue'

defineOptions({
  name: 'PaletteHue'
})

const { cls, updateHue } = inject(PaletteDIKey)!

const { hueRef, hueThumbRef, hueThumbStyle } = useHue({
  updateHue
})
</script>
