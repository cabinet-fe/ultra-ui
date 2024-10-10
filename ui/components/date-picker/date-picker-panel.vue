<template>
  <template v-if="state.panel === 'day'">
    <DayHeader />
    <DayPanel />
  </template>

  <template v-if="state.panel === 'year'">
    <YearHeader />
    <YearPanel />
  </template>

  <template v-if="state.panel === 'month'">
    <MonthHeader />
    <MonthPanel />
  </template>
</template>

<script lang="ts" setup>
import DayPanel from './panels/day.vue'
import MonthPanel from './panels/month.vue'
import YearPanel from './panels/year.vue'
import DayHeader from './headers/day.vue'
import MonthHeader from './headers/month.vue'
import YearHeader from './headers/year.vue'
import { useDate } from './use-date'

defineOptions({
  name: 'DatePickerPanel',
  inheritAttrs: false
})

const { state } = useDate('inject')
</script>
