<template>
  <ul :class="cls.e('months')">
    <li
      v-for="{ key, month, disabled, date } of months"
      :key="key"
      :class="[
        cls.e('month'),
        bem.is('selected', didMonthSelected(month)),
        bem.is('disabled', disabled === true),
        bem.is('range', didInRange(date)),
        bem.is('range-start', didIsRangeStart(date, 'yyyyMM')),
        bem.is('range-end', didIsRangeEnd(date, 'yyyyMM'))
      ]"
      @click="!disabled && handleSelectMonth(month)"
      @mouseenter="!disabled && handleDateHovered(date)"
    >
      <span :class="cls.e('month-text')">{{ month }}月</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { bem } from '@ui/utils'
import { getYearMonths } from '../../calendar/utils'
import { cls } from '../shared'
import { inject } from 'vue'
import { DatePanelDIKey } from '../di'

defineOptions({
  name: 'DatePanelMonth'
})

const {
  panelDate,
  panelProps,
  panelEmit,
  showNextPanel,
  handleDateHovered,
  didInRange,
  didIsRangeStart,
  didIsRangeEnd
} = inject(DatePanelDIKey)!

const months = computed(() => {
  return getYearMonths(panelDate.value.timestamp, panelProps.disabledDate)
})

function handleSelectMonth(month: number) {
  const d = panelDate.value.setMonth(month)
  console.log(d === panelDate.value)
  panelDate.value = d
  showNextPanel()

  if (panelProps.type !== 'month') return

  if (panelProps.range) {
    if (!panelDate.value) {
      panelDate.value = d
    } else {
      panelEmit('select:range-date', [panelDate.value, d])
    }
  } else {
    panelEmit('select:date', d)
  }
}

function didMonthSelected(month: number) {
  if (!panelProps.date) return false
  return (
    panelProps.date.month === month &&
    panelProps.date.year === panelDate.value.year
  )
}
</script>
