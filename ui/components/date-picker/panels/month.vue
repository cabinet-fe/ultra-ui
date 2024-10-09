<template>
  <ul :class="cls.e('months')">
    <li
      v-for="{ key, month, disabled } of months"
      :key="key"
      :class="[
        cls.e('month'),
        bem.is('selected', didMonthSelected(month)),
        bem.is('disabled', disabled === true)
      ]"
      @click="!disabled && handleSelectMonth(month)"
    >
      <span :class="cls.e('month-text')">{{ month }}月</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useDate } from '../use-date'
import { bem } from '@ui/utils'
import { getYearMonths } from '../../calendar/utils'

defineOptions({
  name: 'MonthPanel'
})

const { cls, state, pickerProps } = useDate('inject')

const months = computed(() => {
  return getYearMonths(state.panelDate.timestamp, pickerProps.disabledDate)
})

function handleSelectMonth(month: number) {
  let targetDate = state.date
    ? state.date.setMonth(month)
    : state.panelDate.setMonth(month)

  state.panelDate = targetDate
  state.panel = 'day'
}

function didMonthSelected(month: number) {
  if (!state.date) return false
  console.log(state.date.month, month, state.date.year, state.panelDate.year)
  return state.date.month === month && state.date.year === state.panelDate.year
}
</script>
