<template>
  <div :class="cls.e('color-switch')">
    <div :class="cls.e('color-type')" @click="handleToggleColorType">
      {{ modelValue }}(A)
    </div>

    <!-- RGB(A) -->
    <div v-if="modelValue === 'RGB'" :class="cls.e('color-rgba')">
      <u-number-input
        v-for="key of rgbKeys"
        :key="key"
        :clearable="false"
        :placeholder="key.toUpperCase()"
        v-model="RGB[key]"
        :min="0"
        :max="255"
      />
      <u-number-input
        v-model="alpha"
        :min="0"
        :max="1"
        :max-precision="2"
        :clearable="false"
        placeholder="A"
      />
    </div>

    <!-- HEX(A) -->
    <u-input
      v-else-if="modelValue === 'HEX'"
      :model-value="hexColor"
      :clearable="false"
      :class="cls.e('color-hexa')"
      :pattern="HEX_RE"
    />
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { PaletteDIKey } from './di'
import { UNumberInput } from '../number-input'
import { UInput } from '../input'
import type { PaletteColorType } from '@ui/types'

const { modelValue = 'HEX' } = defineProps<{
  modelValue?: PaletteColorType
  hexColor?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const colorTypes = ['HEX', 'RGB'] as const

const { cls, RGB, alpha } = inject(PaletteDIKey)!

const rgbKeys = ['r', 'g', 'b'] as const

const HEX_RE =
  /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/

function handleToggleColorType() {
  const currentTypeIndex = colorTypes.indexOf(modelValue)
  emit('update:modelValue', colorTypes[currentTypeIndex + 1] ?? colorTypes[0])
}
</script>
