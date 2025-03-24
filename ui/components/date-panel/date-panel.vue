<template>
  <div :class="cls.b">
    <template v-if="state.visiblePanel === 'day'">
      <DayHeader :panel-date="state.panelDate" />
      <DayPanel :panel-date="state.panelDate" />
    </template>

    <template v-else-if="state.visiblePanel === 'year'">
      <YearHeader :panel-date="state.panelDate" />
      <YearPanel :panel-date="state.panelDate" />
    </template>

    <template v-else-if="state.visiblePanel === 'month'">
      <MonthHeader :panel-date="state.panelDate" />
      <MonthPanel :panel-date="state.panelDate" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { DatePanelProps } from '@ui/types'
import { bem } from '@ui/utils'
import DayPanel from './panels/day.vue'
import MonthPanel from './panels/month.vue'
import YearPanel from './panels/year.vue'
import DayHeader from './headers/day.vue'
import MonthHeader from './headers/month.vue'
import YearHeader from './headers/year.vue'
import { usePanel } from './use-panel'

defineOptions({
  name: 'DatePanel'
})

const props = defineProps<DatePanelProps>()

const cls = bem('date-panel')

const { state } = usePanel({
  props
})
</script>
