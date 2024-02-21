<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { ResizeContainerProps } from '@ui/types/components/resize-container'
import { bem } from '@ui/utils'

defineOptions({
  name: 'ResizeContainer'
})

defineProps<ResizeContainerProps>()

const cls = bem('resize-container')
</script>
