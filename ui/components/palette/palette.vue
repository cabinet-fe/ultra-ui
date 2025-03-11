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
      <PaletteColorSwitch v-model="colorType" :hex-color="color" />
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type { PaletteProps } from '@ui/types'
import { bem } from '@ui/utils'
import { UTip } from '../tip'
import { computed, provide, shallowRef, watch } from 'vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import PaletteSV from './palette-sv.vue'
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

const { RGB, alpha, ...rest } = useRGBA()

const color = defineModel<string>()
const colorType = shallowRef<'HEX' | 'RGB'>('HEX')

function RGB2HEX() {
  let hexStr = ['r', 'g', 'b']
    .map(key => RGB[key].toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  if (alpha.value < 1) {
    hexStr += Math.round(alpha.value * 255)
      .toString(16)
      .padStart(2, '0')
  }

  return hexStr
}

watch([alpha, RGB, colorType], ([alpha, RGB, colorType]) => {
  if (colorType === 'HEX') {
    color.value = `#${RGB2HEX()}`
  } else {
    color.value = `rgba(${RGB.r}, ${RGB.g}, ${RGB.b}, ${alpha})`
  }
})

provide(PaletteDIKey, {
  cls,
  RGB,
  alpha,
  ...rest
})
</script>
