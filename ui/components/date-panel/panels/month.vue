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
import { bem } from '@ui/utils'
import { getYearMonths } from '../../calendar/utils'
import type { DatePanelMonthEmits, DatePanelMonthProps } from '@ui/types'
import { cls } from '../shared'

defineOptions({
  name: 'DatePanelMonth'
})

const props = defineProps<DatePanelMonthProps>()
const emit = defineEmits<DatePanelMonthEmits>()

const months = computed(() => {
  return getYearMonths(props.panelDate.timestamp, props.disabledDate)
})

function handleSelectMonth(month: number) {
  const { panelDate } = props
  const d = panelDate.setMonth(month)
  emit('select', d)
}

function didMonthSelected(month: number) {
  const { date, panelDate } = props
  if (!date) return false
  return date.month === month && date.year === panelDate.year
}
</script>
