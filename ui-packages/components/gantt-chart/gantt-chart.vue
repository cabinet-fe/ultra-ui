<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { GanttChartProps } from '@ui/types/components/gantt-chart'
import { bem } from '@ui/utils'

defineOptions({
  name: 'GanttChart'
})

defineProps<GanttChartProps>()

const cls = bem('gantt-chart')
</script>
