<template>
  <u-tip trigger="click" :class="cls.e('panel')">
    <span :class="className" :style="{ backgroundColor: color }"> </span>

    <template #content>
      <!-- 饱和度和亮度 -->
      <PaletteCanvas />

      <!-- 色相 -->
      <PaletteHue />

      <!-- 透明度 -->
      <PaletteAlpha />

      <!-- 颜色切换 -->
      <PaletteColorSwitch />
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type { PaletteProps } from '@ui/types'
import { bem } from '@ui/utils'
import { UTip } from '../tip'
import { computed, provide, watch } from 'vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import PaletteCanvas from './palette-sv.vue'
import PaletteHue from './palette-hue.vue'
import PaletteAlpha from './palette-alpha.vue'
import PaletteColorSwitch from './palette-color-switch.vue'
import { useRGBA } from './use-rgba'
import { PaletteDIKey } from './di'

defineOptions({
  name: 'Palette'
})

const props = defineProps<PaletteProps>()

const { formProps } = useFormComponent()

// disabled, readonly
const { size } = useFormFallbackProps([formProps ?? {}, props])

const cls = bem('palette')

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})
const color = defineModel<string>()

const { RGB, alpha, ...rest } = useRGBA()

watch([alpha, RGB], ([alpha, RGB]) => {
  color.value = `rgba(${RGB.r}, ${RGB.g}, ${RGB.b}, ${alpha})`
})

provide(PaletteDIKey, {
  cls,
  RGB,
  alpha,
  ...rest
})
</script>
