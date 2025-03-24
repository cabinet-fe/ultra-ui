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
import { bem } from '@ui/utils'
import { getMonthDays, weekDays } from '../../calendar/utils'
import type { Dater } from 'cat-kit/fe'
import type { DatePanelDayEmits, DatePanelDayProps, Day } from '@ui/types'
import { cls } from '../shared'

defineOptions({
  name: 'DatePanelDay',
  inheritAttrs: false
})

const props = defineProps<DatePanelDayProps>()

const emit = defineEmits<DatePanelDayEmits>()

const days = computed<Day[]>(() => {
  return getMonthDays(props.panelDate.timestamp, props.disabledDate)
})

function didDaySelect(date: Dater) {
  if (!props.date) return false

  const fmtStr = 'yyyyMMdd  '
  return props.date.format(fmtStr) === date.format(fmtStr)
}

function handleSelectDate(day: Day) {
  if (day.disabled) return
  emit('select', day.date)
}
</script>
