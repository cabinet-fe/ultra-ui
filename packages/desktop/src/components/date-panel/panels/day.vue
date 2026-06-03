<template>
  <ul :class="cls.e('week')">
    <li :class="cls.e('week-day')" v-for="weekDay of weekDays">
      {{ weekDay }}
    </li>
  </ul>

  <ul :class="cls.e('days')">
    <li
      v-for="day of days"
      :title="day.isToday ? '今天' : ''"
      :class="getDayCls(day)"
      :key="day.date.timestamp"
      @click="!day.disabled && handleDateSelect(day.date)"
      @mouseenter="!day.disabled && handleDateRangeHover(day.date)"
    >
      <span :class="cls.e('cell-value')">
        {{ day.date.day }}
      </span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { Dater } from '@cat-kit/core'
import { bem } from '@veltra/utils'
import { computed } from 'vue'
import { inject } from 'vue'

import type { CalendarDay } from '../../../types'
import { getMonthDays, weekDays } from '../../calendar/utils'
import { DatePanelDIKey } from '../di'

defineOptions({ name: 'DatePanelDay', inheritAttrs: false })

const { panelDate, rangeDate, panelProps, cls, handleDateSelect, handleDateRangeHover } =
  inject(DatePanelDIKey)!

const days = computed<CalendarDay[]>(() => {
  return getMonthDays(panelDate.value.timestamp, panelProps.disabledDate)
})

function getRangeCls(day: CalendarDay) {
  return [
    bem.is('in-range', didInRange(day.date)),
    bem.is('range-start', isRangeStart(day.date)),
    bem.is('range-end', isRangeEnd(day.date))
  ]
}

function getSingleCls(day: CalendarDay) {
  return [bem.is('selected', didSelected(day.date))]
}
function getDayCls(day: CalendarDay) {
  const ret = [
    cls.e('cell'),
    bem.is(day.type),
    bem.is('today', day.isToday === true),
    bem.is('disabled', day.disabled === true)
  ]
  if (panelProps.range) {
    return [...ret, ...getRangeCls(day)]
  }
  return [...ret, ...getSingleCls(day)]
}

const fmtStr = 'yyyyMMdd'

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
