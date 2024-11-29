<template>
  <u-tip trigger="click" :class="cls.e('panel')">
    <span :class="className" :style="{ backgroundColor: color }"> </span>

    <template #content>
      <!-- 调色盘 -->
      <PaletteCanvas />

      <!-- 色阶 -->
      <PaletteColorSlider />

      <!-- 透明度 -->
      <PaletteAlphaSlider />

      <!-- 颜色切换 -->
      <PaletteColorSwitch />
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type { PaletteProps } from '@ui/types/components/palette'
import { bem } from '@ui/utils'
import { UTip } from '../tip'
import { computed, provide, watch } from 'vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import PaletteCanvas from './palette-canvas.vue'
import PaletteColorSlider from './palette-color-slider.vue'
import PaletteAlphaSlider from './palette-alpha-slider.vue'
import PaletteColorSwitch from './palette-color-switch.vue'
import { useRGBA } from './use-rgba'
import { PaletteDIKey } from './di'

defineOptions({
  name: 'Palette'
})

const props = defineProps<PaletteProps>()

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])

const cls = bem('palette')

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})
const color = defineModel<string>()

const { RGBA, updateAlpha, updateRGB } = useRGBA()

watch(RGBA, () => {
  color.value = `rgba(${RGBA.r}, ${RGBA.g}, ${RGBA.b}, ${RGBA.a})`
})

provide(PaletteDIKey, {
  cls,
  RGBA,
  updateAlpha,
  updateRGB
})
</script>
