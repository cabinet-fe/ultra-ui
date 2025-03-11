<template>
  <div :class="cls.e('color-switch')">
    <div :class="cls.e('color-type')" @click="handleToggleColorType">
      {{ colorType }}(A)
    </div>

    <!-- RGB(A) -->
    <div v-if="colorType === 'RGB'" :class="cls.e('color-rgba')">
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
      v-else-if="colorType === 'HEX'"
      :model-value="hexColor"
      @update:model-value="hexColor = $event.toUpperCase()"
      :clearable="false"
      :class="cls.e('color-hexa')"
      :pattern="HEX_RE"
    />
  </div>
</template>

<script lang="ts" setup>
import { inject, shallowRef } from 'vue'
import { PaletteDIKey } from './di'
import { UNumberInput } from '../number-input'
import { UInput } from '../input'

const colorTypes = ['RGB', 'HEX'] as const

const colorType = shallowRef<(typeof colorTypes)[number]>(colorTypes[0])

const { cls, RGB, alpha } = inject(PaletteDIKey)!

const rgbKeys = ['r', 'g', 'b'] as const

const HEX_RE =
  /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/

const hexColor = shallowRef('')

const colorTypeEffects = {
  HEX: () => {
    const hexKeys = ['r', 'g', 'b']
    if (alpha.value < 1) {
      hexKeys.push('a')
    }

    const hexStr = hexKeys
      .map(key => RGB[key].toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()

    hexColor.value = `#${hexStr}`

    console.log(hexColor.value)
  }
}

function handleToggleColorType() {
  const currentTypeIndex = colorTypes.indexOf(colorType.value)
  colorType.value = colorTypes[currentTypeIndex + 1] ?? colorTypes[0]
  colorTypeEffects[colorType.value]?.()
}
</script>
