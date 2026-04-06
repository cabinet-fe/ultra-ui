<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { GanttChartProps } from '@ui/types'
import { bem } from '@ui/utils'

defineOptions({
  name: 'GanttChart'
})

defineProps<GanttChartProps>()

const cls = bem('gantt-chart')
</script>
