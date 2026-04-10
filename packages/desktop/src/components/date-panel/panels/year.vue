<template>
  <ul :class="cls.e('years')">
    <li
      v-for="year of years"
      :key="year.year"
      :class="getYearCls(year)"
      @click="!year.disabled && handleDateSelect(year.date)"
      @mouseenter="!year.disabled && handleDateRangeHover(year.date)"
    >
      <span :class="cls.e('cell-value')">{{ year.year }}</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { Dater } from '@cat-kit/core'
import { bem } from '@ultra-ui/utils'
import { computed } from 'vue'
import { inject } from 'vue'

import type { CalendarYear } from '../../../types'
import { getTenYears } from '../../calendar/utils'
import { DatePanelDIKey } from '../di'

defineOptions({
  name: 'DatePanelYear'
})

const { panelDate, rangeDate, panelProps, cls, handleDateSelect, handleDateRangeHover } =
  inject(DatePanelDIKey)!

const years = computed(() => {
  return getTenYears(panelDate.value.timestamp, panelProps.disabledDate)
})

function getRangeCls(year: CalendarYear) {
  return [
    bem.is('range', didInRange(year.date)),
    bem.is('range-start', isRangeStart(year.date)),
    bem.is('range-end', isRangeEnd(year.date))
  ]
}

function getSingleCls(year: CalendarYear) {
  return [bem.is('selected', didSelected(year.date))]
}

function getYearCls(year: CalendarYear) {
  const ret = [cls.e('cell'), bem.is('disabled', year.disabled === true)]
  if (panelProps.range) {
    return [...ret, ...getRangeCls(year)]
  }
  return [...ret, ...getSingleCls(year)]
}

function didSelected(date: Dater) {
  if (!panelProps.date) return false
  return date.year === panelProps.date.year
}

function didInRange(date: Dater) {
  if (!rangeDate.value) return false
  const [start, end] = rangeDate.value
  return date.timestamp >= start.timestamp && date.timestamp <= end.timestamp
}

function isRangeStart(date: Dater) {
  if (!rangeDate.value) return false
  const [start] = rangeDate.value
  return date.year === start.year
}

function isRangeEnd(date: Dater) {
  if (!rangeDate.value) return false
  const [, end] = rangeDate.value
  return date.year === end.year
}
</script>
