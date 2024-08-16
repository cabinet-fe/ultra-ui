<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { ColorPickerProps } from '@ui/types/components/color-picker'
import { bem } from '@ui/utils'

defineOptions({
  name: 'ColorPicker'
})

defineProps<ColorPickerProps>()

const cls = bem('color-picker')
</script>
