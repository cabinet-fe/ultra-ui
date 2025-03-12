<template>
  <u-tip trigger="click" :class="cls.e('panel')">
    <span :class="className" :style="{ backgroundColor: color }"> </span>

    <template #content>
      <!-- 饱和度和亮度 -->
      <PaletteSV />

      <!-- 色相 -->
      <PaletteHue />

      <!-- 透明度 -->
      <PaletteAlpha />

      <!-- 颜色切换 -->
      <PaletteColorSwitch :color="color" />
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type { PaletteProps } from '@ui/types'
import { bem } from '@ui/utils'
import { UTip } from '../tip'
import { computed, provide, watch } from 'vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import PaletteSV from './palette-sv.vue'
import PaletteHue from './palette-hue.vue'
import PaletteAlpha from './palette-alpha.vue'
import PaletteColorSwitch from './palette-color-switch.vue'
import { useHSV } from './use-hsv'
import { PaletteDIKey } from './di'
import { HSV2RGB, RGB2HEX, HEX2RGBA, RGB2HSV } from './color-transform'

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

const { HSV, alpha, ...rest } = useHSV()

const color = defineModel<string>()

const RGB = computed(() => {
  return HSV2RGB(HSV)
})

watch([alpha, RGB], ([alpha, RGB]) => {
  color.value = `#${RGB2HEX(RGB, alpha)}`
})

watch(
  color,
  color => {
    if (!color) return

    const { RGB, alpha } = HEX2RGBA(color)
    const hsv = RGB2HSV(RGB)
    rest.updateHue(hsv.h)
    rest.updateSV({ s: hsv.s, v: hsv.v })
    rest.updateAlpha(alpha)
  },
  { immediate: true }
)

provide(PaletteDIKey, {
  cls,
  HSV,
  RGB,
  alpha,
  ...rest
})
</script>
