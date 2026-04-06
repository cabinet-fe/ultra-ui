<template>
  <ul :class="cls.e('months')">
    <li
      v-for="month of months"
      :key="month.key"
      :class="getMonthCls(month)"
      @click="!month.disabled && handleDateSelect(month.date)"
      @mouseenter="!month.disabled && handleDateRangeHover(month.date)"
    >
      <span :class="cls.e('cell-value')">{{ month.month }}月</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { bem } from '@ultra-ui/core'
import { getYearMonths } from '../../calendar/utils'
import { inject } from 'vue'
import { DatePanelDIKey } from '../di'
import type { CalendarMonth } from '@ultra-ui/pc/types'
import type { Dater } from '@cat-kit/core'

defineOptions({
  name: 'DatePanelMonth'
})

const {
  cls,
  panelDate,
  rangeDate,
  panelProps,
  handleDateSelect,
  handleDateRangeHover
} = inject(DatePanelDIKey)!

const months = computed(() => {
  return getYearMonths(panelDate.value.timestamp, panelProps.disabledDate)
})

function getRangeCls(month: CalendarMonth) {
  return [
    bem.is('in-range', didInRange(month.date)),
    bem.is('range-start', isRangeStart(month.date)),
    bem.is('range-end', isRangeEnd(month.date))
  ]
}

function getSingleCls(month: CalendarMonth) {
  return [bem.is('selected', didSelected(month.date))]
}

function getMonthCls(month: CalendarMonth) {
  const ret = [cls.e('cell'), bem.is('disabled', month.disabled === true)]
  if (panelProps.range) {
    return [...ret, ...getRangeCls(month)]
  }
  return [...ret, ...getSingleCls(month)]
}

const fmtStr = 'yyyyMM'

function didSelected(date: Dater) {
  if (!panelProps.date) return false
  return date.format(fmtStr) === panelProps.date.format(fmtStr)
}

function didInRange(date: Dater) {
  if (!rangeDate.value) return false
  const [start, end] = rangeDate.value
  return date.timestamp >= start.timestamp && date.timestamp <= end.timestamp
}

function isRangeStart(date: Dater) {
  if (!rangeDate.value) return false
  const [start] = rangeDate.value
  return date.format(fmtStr) === start.format(fmtStr)
}

function isRangeEnd(date: Dater) {
  if (!rangeDate.value) return false
  const [, end] = rangeDate.value
  return date.format(fmtStr) === end.format(fmtStr)
}
</script>
