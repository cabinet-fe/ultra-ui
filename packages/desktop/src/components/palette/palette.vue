<template>
  <u-tip
    trigger="click"
    :class="cls.e('panel')"
    v-model:visible="visible"
    :disabled="disabled || readonly"
  >
    <span
      :class="className"
      :style="{
        backgroundColor: color
      }"
    >
    </span>

    <template #content>
      <!-- 饱和度和亮度 -->
      <PaletteSV ref="palette-sv" />

      <!-- 色相 -->
      <PaletteHue ref="palette-hue" />

      <!-- 透明度 -->
      <PaletteAlpha ref="palette-alpha" />

      <!-- 颜色切换 -->
      <PaletteColorSwitch v-model:color="color" @clear="handleClear" />
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type { PaletteProps } from '../../types'
import { bem } from '@ultra-ui/utils'
import { UTip } from '../tip'
import { computed, provide, shallowRef, useTemplateRef, watch } from 'vue'
import {
  useFormComponent,
  useFormFallbackProps,
  useUpdateLock
} from '@ultra-ui/compositions'
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

const props = withDefaults(defineProps<PaletteProps>(), {
  disabled: undefined,
  readonly: undefined
})

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])

const cls = bem('palette')

const className = computed(() => {
  return [cls.b, cls.m(size.value), bem.is('no-color', !color.value)]
})

const { HSV, alpha, ...rest } = useHSV()

const color = defineModel<string>()
const RGB = computed(() => HSV2RGB(HSV))
const updater = useUpdateLock()

watch([alpha, RGB], ([alpha, RGB]) => {
  color.value = `#${RGB2HEX(RGB, alpha)}`
})

const visible = shallowRef(false)

function handleClear() {
  updater.updateAndLock(() => {
    color.value = ''
    rest.updateAlpha(1)
    visible.value = false
  })
}

const paletteSVRef = useTemplateRef('palette-sv')
const paletteHueRef = useTemplateRef('palette-hue')
const paletteAlphaRef = useTemplateRef('palette-alpha')

watch(
  color,
  color => {
    if (!color) return

    updater.update(() => {
      const { RGB, alpha } = HEX2RGBA(color)
      const hsv = RGB2HSV(RGB)
      rest.updateHue(hsv.h)
      rest.updateSV({ s: hsv.s, v: hsv.v })
      rest.updateAlpha(alpha)

      paletteSVRef.value?.init()
      paletteHueRef.value?.init()
      paletteAlphaRef.value?.init()
    })
  },
  { immediate: true }
)

provide(PaletteDIKey, {
  cls,
  HSV,
  RGB,
  alpha,
  updater,
  ...rest
})
</script>
