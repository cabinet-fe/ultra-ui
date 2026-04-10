<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import { bem } from '@ultra-ui/utils'

import type { GanttChartProps } from '../../types'

defineOptions({
  name: 'GanttChart'
})

defineProps<GanttChartProps>()

const cls = bem('gantt-chart')
</script>
