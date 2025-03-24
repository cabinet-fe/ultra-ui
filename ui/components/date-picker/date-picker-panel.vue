<template>
  <template v-if="state.panel === 'day'">
    <DayHeader :panel-date="state.panelDate" />
    <DayPanel :panel-date="state.panelDate" />
  </template>

  <template v-if="state.panel === 'year'">
    <YearHeader :panel-date="state.panelDate" />
    <YearPanel :panel-date="state.panelDate" />
  </template>

  <template v-if="state.panel === 'month'">
    <MonthHeader :panel-date="state.panelDate" />
    <MonthPanel :panel-date="state.panelDate" />
  </template>
</template>

<script lang="ts" setup>
// import DayPanel from './panels/day.vue'
// import MonthPanel from './panels/month.vue'
// import YearPanel from './panels/year.vue'
// import DayHeader from './headers/day.vue'
// import MonthHeader from './headers/month.vue'
// import YearHeader from './headers/year.vue'
import DayPanel from '../date-panel/panels/day.vue'
import MonthPanel from '../date-panel/panels/month.vue'
import YearPanel from '../date-panel/panels/year.vue'
import DayHeader from '../date-panel/headers/day.vue'
import MonthHeader from '../date-panel/headers/month.vue'
import YearHeader from '../date-panel/headers/year.vue'
import { useDate } from './use-date'

defineOptions({
  name: 'DatePickerPanel',
  inheritAttrs: false
})

const { state } = useDate('inject')
</script>
