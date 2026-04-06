<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { GanttChartProps } from '@ultra-ui/pc/types'
import { bem } from '@ultra-ui/core'

defineOptions({
  name: 'GanttChart'
})

defineProps<GanttChartProps>()

const cls = bem('gantt-chart')
</script>
