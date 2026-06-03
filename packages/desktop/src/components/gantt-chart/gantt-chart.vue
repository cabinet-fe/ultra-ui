<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

import type { GanttChartProps } from '../../types'

defineOptions({ name: 'GanttChart' })

defineProps<GanttChartProps>()

const cls = bem('gantt-chart')
</script>
