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
      :class="[
        cls.e('day'),
        cls.em('day', day.type),
        bem.is('today', day.isToday === true),
        bem.is('disabled', day.disabled === true),
        bem.is('selected', didDaySelect(day.date)),
        bem.is('range', didInRange(day.date)),
        bem.is('range-start', didIsRangeStart(day.date, 'yyyyMMdd')),
        bem.is('range-end', didIsRangeEnd(day.date, 'yyyyMMdd'))
      ]"
      :key="day.date.timestamp"
      @click="handleSelectDate(day)"
      @mouseenter="!day.disabled && handleDateHovered(day.date)"
    >
      <span :class="cls.e('day-text')">
        {{ day.date.day }}
      </span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { bem } from '@ui/utils'
import { getMonthDays, weekDays } from '../../calendar/utils'
import type { Dater } from 'cat-kit/fe'
import type { Day } from '@ui/types'
import { cls } from '../shared'
import { inject } from 'vue'
import { DatePanelDIKey } from '../di'

defineOptions({
  name: 'DatePanelDay',
  inheritAttrs: false
})

const {
  panelDate,
  panelProps,
  panelEmit,
  firstRangeDate,
  secondRangeDate,
  handleDateHovered,
  getRangeDate,
  didInRange,
  didIsRangeStart,
  didIsRangeEnd
} = inject(DatePanelDIKey)!

const days = computed<Day[]>(() => {
  return getMonthDays(panelDate.value.timestamp, panelProps.disabledDate)
})

function didDaySelect(date: Dater) {
  const fmtStr = 'yyyyMMdd  '
  if (panelProps.range || !panelProps.date) return false
  return panelProps.date.format(fmtStr) === date.format(fmtStr)
}

function handleSelectDate(day: Day) {
  if (day.disabled) return

  if (panelProps.range) {
    if (!firstRangeDate.value) {
      firstRangeDate.value = secondRangeDate.value = day.date
    } else {
      const rangeDate = getRangeDate(firstRangeDate.value, day.date)
      if (rangeDate) {
        panelEmit('select:range-date', rangeDate)
        firstRangeDate.value = undefined
      }
    }
  } else {
    panelEmit('select:date', day.date)
  }
}
</script>
