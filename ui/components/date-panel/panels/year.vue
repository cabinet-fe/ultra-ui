<template>
  <ul :class="cls.e('years')">
    <li
      v-for="{ year, disabled, date } of years"
      :key="year"
      :class="[
        cls.e('year'),
        bem.is('selected', didYearSelected(year)),
        bem.is('disabled', disabled === true),
        bem.is('range', didInRange(date)),
        bem.is('range-start', didIsRangeStart(date, 'yyyy')),
        bem.is('range-end', didIsRangeEnd(date, 'yyyy'))
      ]"
      @click="!disabled && handleSelectYear(year)"
      @mouseenter="!disabled && handleDateHovered(date)"
    >
      <span :class="cls.e('year-text')">{{ year }}</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import { getTenYears } from '../../calendar/utils'
import { computed } from 'vue'
import { cls } from '../shared'
import { inject } from 'vue'
import { DatePanelDIKey } from '../di'

defineOptions({
  name: 'DatePanelYear'
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

const years = computed(() => {
  return getTenYears(panelDate.value.timestamp, panelProps.disabledDate)
})

function didYearSelected(year: number) {
  if (!panelProps.date) return false
  return panelProps.date.year === year
}

function handleSelectYear(year: number) {
  const d = panelDate.value.setYear(year)
  panelDate.value = d
  showNextPanel()

  if (panelProps.type !== 'year') return

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
</script>
