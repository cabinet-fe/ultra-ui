<template>
  <ul :class="cls.e('years')">
    <li
      v-for="{ year, disabled } of years"
      :key="year"
      :class="[
        cls.e('year'),
        bem.is('selected', didYearSelected(year)),
        bem.is('disabled', disabled === true)
      ]"
      @click="!disabled && handleSelectYear(year)"
    >
      <span :class="cls.e('year-text')">{{ year }}</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import { useDate } from '../use-date'
import { getTenYears } from '../../calendar/utils'
import { computed } from 'vue'
import { date } from 'cat-kit/fe'

defineOptions({
  name: 'YearPanel'
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

const years = computed(() => {
  return getTenYears(state.panelDate.timestamp, pickerProps.disabledDate)
})

function didYearSelected(year: number) {
  if (!state.date) return false
  return state.date.year === year
}

function handleSelectYear(year: number) {
  state.panelDate = state.panelDate.setYear(year)
  showNextPanel()
  if (pickerProps.type === 'year') {
    const dateStr = state.panelDate.format('yyyy')
    state.date = date(dateStr)
    pickerEmit('update:modelValue', state.date.format(formatStr.value))
    closeDropdown()
  }
}
</script>
