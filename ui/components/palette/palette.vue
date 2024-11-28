<template>
  <u-tip trigger="click" :class="cls.e('panel')">
    <span :class="className" :style="{ backgroundColor: color }"> </span>

    <template #content>
      <!-- 调色画布 -->
      <div :class="cls.e('canvas')" ref="canvasRef" @click="handleClickCanvas">
        <div
          :class="cls.e('canvas-color')"
          :style="{ backgroundImage: canvasBackground }"
        ></div>
        <div :class="cls.e('canvas-gray')"></div>

        <div
          :class="cls.e('canvas-thumb')"
          ref="canvasThumbRef"
          @click.stop
          @mousedown.stop
          :style="{
            transform: `translate(${thumbTransform.x}px, ${thumbTransform.y}px)`
          }"
        ></div>
      </div>

      <!-- 色阶 -->
      <div :class="cls.e('slider')" ref="sliderRef" @click="handleClickSlider">
        <span
          :class="cls.e('slider-thumb')"
          ref="sliderThumbRef"
          @click.stop
          :style="{
            transform: `translate(${thumbOffsetX}px, 0)`
          }"
        ></span>
      </div>

      <!-- 透明度 -->
      <div
        :class="cls.e('alpha-slider')"
        ref="alphaSliderRef"
        @click="handleClickAlphaSlider"
      >
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
          :style="{
            transform: `translate(${alphaThumbOffsetX}px, 0)`
          }"
        ></span>
      </div>

      <div :class="cls.e('color-value')">
        <div :class="cls.e('color-type')" @click="handleToggleColorType">
          {{ colorType }}
        </div>

        <div v-if="colorType === 'RGBA'" :class="cls.e('color-rgba')">
          <u-number-input
            v-for="key of rgbaKeys"
            :clearable="false"
            v-model="sliderColor[key]"
            :min="0"
            :max="255"
          />
        </div>

        <u-input
          v-else-if="colorType === 'HEXA'"
          :model-value="color"
          :clearable="false"
          :class="cls.e('color-hexa')"
          :pattern="/^#[A-Fa-f0-9]{3|4|6|8}$/"
        />
      </div>
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type { PaletteProps } from '@ui/types/components/palette'
import { bem } from '@ui/utils'
import { UTip } from '../tip'
import { UNumberInput } from '../number-input'
import { UInput } from '../input'
import { computed, shallowRef, watch } from 'vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { useSlider } from './use-slider'
import { useCanvasThumb } from './use-canvas-thumb'

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

const { canvasRef, canvasThumbRef, thumbTransform, handleClickCanvas } =
  useCanvasThumb()

const {
  sliderColor,

  sliderRef,
  sliderThumbRef,
  thumbOffsetX,
  handleClickSlider,

  alphaSliderRef,
  alphaSliderThumbRef,
  alphaThumbOffsetX,
  handleClickAlphaSlider
} = useSlider()

const colorTypes = ['RGBA', 'HEXA'] as const

const colorType = shallowRef<(typeof colorTypes)[number]>('RGBA')

function getHEXA() {
  const { r, g, b, a } = sliderColor
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}${a.toString(16)}`.toUpperCase()
}

const colorTypeEffects = {
  HEXA: getHEXA
}

watch([sliderColor, colorType], ([sliderColor, type]) => {
  const { r, g, b, a } = sliderColor
  if (type === 'RGBA') {
    color.value = `rgba(${r}, ${g}, ${b}, ${a})`
  } else if (type === 'HEXA') {
    color.value = getHEXA()
  }
})

function handleToggleColorType() {
  const currentTypeIndex = colorTypes.indexOf(colorType.value)
  colorType.value = colorTypes[currentTypeIndex + 1] ?? colorTypes[0]

  color.value = colorTypeEffects[colorType.value]?.()
}

const rgbaKeys = ['r', 'g', 'b', 'a'] as const

const alphaSliderBG = computed(() => {
  const { r, g, b } = sliderColor
  return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1))`
})

const canvasBackground = computed(() => {
  const { r, g, b } = sliderColor
  return `linear-gradient(to right, rgb(255, 255, 255), rgb(${r}, ${g}, ${b}))`
})
</script>
