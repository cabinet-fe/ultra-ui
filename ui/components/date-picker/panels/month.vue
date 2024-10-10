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
import { date } from 'cat-kit/fe'

defineOptions({
  name: 'MonthPanel'
})

const {
  cls,
  state,
  pickerProps,
  pickerEmit,
  showNextPanel,
  closeDropdown,
  formatStr
} = useDate('inject')

const months = computed(() => {
  return getYearMonths(state.panelDate.timestamp, pickerProps.disabledDate)
})

function handleSelectMonth(month: number) {
  state.panelDate = state.panelDate.setMonth(month)
  showNextPanel()
  if (pickerProps.type === 'month') {
    state.date = date(state.panelDate.format('yyyy-MM'))
    pickerEmit('update:modelValue', state.date.format(formatStr.value))
    closeDropdown()
  }
}

function didMonthSelected(month: number) {
  if (!state.date) return false
  return state.date.month === month && state.date.year === state.panelDate.year
}
</script>
