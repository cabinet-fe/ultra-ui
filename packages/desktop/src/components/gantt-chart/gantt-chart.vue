<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { GanttChartProps } from '../../types'
import { bem } from '@ultra-ui/utils'

defineOptions({
  name: 'GanttChart'
})

defineProps<GanttChartProps>()

const cls = bem('gantt-chart')
</script>
