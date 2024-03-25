<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { SliderProps } from '@ui/types/components/slider'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Slider'
})

defineProps<SliderProps>()

const cls = bem('slider')
</script>
