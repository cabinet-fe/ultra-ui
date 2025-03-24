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
import { getTenYears } from '../../calendar/utils'
import { computed } from 'vue'
import { cls } from '../shared'
import type { DatePanelYearProps, DatePanelYearEmits } from '@ui/types'

defineOptions({
  name: 'DatePanelYear'
})

const props = defineProps<DatePanelYearProps>()
const emit = defineEmits<DatePanelYearEmits>()

const years = computed(() => {
  return getTenYears(props.panelDate.timestamp, props.disabledDate)
})

function didYearSelected(year: number) {
  if (!props.date) return false
  return props.date.year === year
}

function handleSelectYear(year: number) {
  const d = props.panelDate.setYear(year)
  emit('select', d)
}
</script>
