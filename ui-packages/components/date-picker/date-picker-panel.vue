<template>
  <div :class="cls.e('header')">
    <div>
      <u-icon @click="handlePreYear"><DArrowLeft /></u-icon>
      <u-icon @click="handlePreMonth"><ArrowLeft /></u-icon>
    </div>

    <div>
      <span :class="cls.e('header-year')" @click="panelType = 'year'">
        {{ panelDate.year }}
      </span>
      <span :class="cls.e('header-month')" @click="panelType = 'month'">
        {{ panelDate.month }}月
      </span>
    </div>

    <div>
      <u-icon @click="handleNextMonth"><ArrowRight /></u-icon>
      <u-icon @click="handleNextYear"><DArrowRight /></u-icon>
    </div>
  </div>

  <template v-if="panelType === 'day'">
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
          bem.is('disabled', day.disabled),
          bem.is('selected', didDaySelected(day))
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

  <template v-else-if="panelType === 'month'">
    <ul :class="cls.e('months')">
      <li :class="cls.e('month')" v-for="month of months">{{ month }}月</li>
    </ul>
  </template>
  <template v-else-if="panelType === 'year'"> </template>
</template>

<script lang="ts" setup>
import { computed, inject, shallowRef } from 'vue'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { DatePickerDIKey } from './di'
import { date, type Dater } from 'cat-kit/fe'
import { getMonthDays, weekDays } from '../calendar/utils'
import { UIcon } from '../icon'
import type { Day } from '@ui/types/components/calendar'
import { bem } from '@ui/utils'

defineOptions({
  name: 'DatePickerPanel'
})

const props = defineProps<{
  /** 选中的日期 */
  date?: Dater
}>()

const emit = defineEmits<{
  (e: 'update:date', date: Dater): void
}>()

const { cls, datePickerProps } = inject(DatePickerDIKey)!

const panelType = shallowRef<'day' | 'month' | 'year'>('day')

const panelDate = shallowRef(props.date || date())

const days = computed(() => {
  return getMonthDays(panelDate.value.timestamp, datePickerProps.disabledDate)
})
const months = Array.from({ length: 12 }).map((_, i) => i + 1)
const years = shallowRef<number[]>([])

const didDaySelected = (day: Day) => {
  if (!props.date) return false
  const fmt = 'yyyyMMdd'
  return props.date.format(fmt) === day.date.format(fmt)
}

const handlePreYear = () => {
  panelDate.value = panelDate.value.calc(-1, 'years')
}

const handlePreMonth = () => {
  panelDate.value = panelDate.value.calc(-1, 'months')
}

const handleNextYear = () => {
  panelDate.value = panelDate.value.calc(1, 'years')
}

const handleNextMonth = () => {
  panelDate.value = panelDate.value.calc(1, 'months')
}

const handleSelectYear = () => {}

const handleSelectMonth = () => {

  panelType.value = 'day'
}

const handleSelectDate = (day: Day) => {
  if (day.disabled) return
  emit('update:date', day.date)
  if (day.type !== 'current') {
    panelDate.value = day.date
  }
}
</script>
