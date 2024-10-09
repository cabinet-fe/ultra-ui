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
        bem.is('selected', didDaySelect(day.date))
      ]"
      :key="day.date.timestamp"
      @click="handleSelectDate(day)"
    >
      <span :class="cls.e('day-text')">
        {{ day.date.day }}
      </span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useDate } from '../use-date'
import { bem } from '@ui/utils'
import { getMonthDays, weekDays } from '../../calendar/utils'
import type { Dater } from 'cat-kit/fe'
import type { Day } from '@ui/types'

defineOptions({
  name: 'DayPanel',
  inheritAttrs: false
})

const { cls, pickerProps, state, pickerEmit, closeDropdown } = useDate('inject')

const days = computed(() => {
  return getMonthDays(state.panelDate.timestamp, pickerProps.disabledDate)
})

function didDaySelect(date: Dater) {
  if (!state.date) return false
  return (
    state.date.year === date.year &&
    state.date.month === date.month &&
    state.date.day === date.day
  )
}

function handleSelectDate(day: Day) {
  if (day.disabled) return
  pickerEmit('update:modelValue', day.date.format(pickerProps.valueFormat))
  state.date = day.date
  closeDropdown()
}
</script>
