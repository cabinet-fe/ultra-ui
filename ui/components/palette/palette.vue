<template>
  <u-tip>
    <template #trigger> </template>

    <div :class="cls.b"></div>
  </u-tip>
</template>

<script lang="ts" setup>
import type { PaletteProps } from '@ui/types/components/palette'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Palette'
})

defineProps<PaletteProps>()

const cls = bem('palette')
</script>
