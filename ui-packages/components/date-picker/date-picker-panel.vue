<template>
  <div :class="cls.e('header')" key="day" v-if="panelType === 'day'">
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

  <div :class="cls.e('header')" v-else-if="panelType === 'month'">
    <div>
      <u-icon @click="handlePreYear"><DArrowLeft /></u-icon>
    </div>

    <div>
      <span :class="cls.e('header-year')">
        {{ panelDate.year }}
      </span>
    </div>

    <div>
      <u-icon @click="handleNextYear"><DArrowRight /></u-icon>
    </div>
  </div>

  <div :class="cls.e('header')" v-else-if="panelType === 'year'">
    <div>
      <u-icon @click="handlePreTenYears"><DArrowLeft /></u-icon>
    </div>

    <div>
      <span :class="cls.e('header-year')" @click="panelType = 'year'">
        {{ years[0]!.year }} - {{ years[9]!.year }}
      </span>
    </div>

    <div>
      <u-icon @click="handleNextTenYears"><DArrowRight /></u-icon>
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
          bem.is('selected', didDateSelected(day.date))
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
      <li
        v-for="{ key, month, disabled } of months"
        :key="key"
        :class="[
          cls.e('month'),
          bem.is('selected', didMonthSelected(month)),
          bem.is('disabled', disabled)
        ]"
        @click="!disabled && handleSelectMonth(month)"
      >
        <span :class="cls.e('month-text')">{{ month }}月</span>
      </li>
    </ul>
  </template>
  <template v-else-if="panelType === 'year'">
    <ul :class="cls.e('years')">
      <li
        v-for="{ year, disabled } of years"
        :key="year"
        :class="[
          cls.e('year'),
          bem.is('selected', didYearSelected(year)),
          bem.is('disabled', disabled)
        ]"
        @click="!disabled && handleSelectYear(year)"
      >
        <span :class="cls.e('year-text')">{{ year }}</span>
      </li>
    </ul>
  </template>
</template>

<script lang="ts" setup>
import { computed, inject, shallowRef } from 'vue'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { DatePickerDIKey } from './di'
import { date, type Dater } from 'cat-kit/fe'
import {
  getMonthDays,
  weekDays,
  getTenYears,
  getYearMonths
} from '../calendar/utils'
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
  (e: 'close-dropdown'): void
}>()

const { cls, datePickerProps } = inject(DatePickerDIKey)!

const panelType = shallowRef<'day' | 'month' | 'year'>('day')

const panelDate = shallowRef(props.date || date())

const days = computed(() => {
  return getMonthDays(panelDate.value.timestamp, datePickerProps.disabledDate)
})
const months = computed(() => {
  return getYearMonths(panelDate.value.timestamp, datePickerProps.disabledDate)
})

const years = computed(() => {
  return getTenYears(panelDate.value.timestamp, datePickerProps.disabledDate)
})

function didDateSelected(date: Dater) {
  if (!props.date) return false
  const fmt = 'yyyyMMdd'
  return props.date.format(fmt) === date.format(fmt)
}

function didYearSelected(year: number) {
  if (!props.date) return false
  return props.date.year === year
}
function didMonthSelected(month: number) {
  if (!props.date) return false
  return props.date.month === month
}

function handlePreYear() {
  panelDate.value = panelDate.value.calc(-1, 'years')
}

function handlePreMonth() {
  panelDate.value = panelDate.value.calc(-1, 'months')
}

function handleNextYear() {
  panelDate.value = panelDate.value.calc(1, 'years')
}

function handleNextMonth() {
  panelDate.value = panelDate.value.calc(1, 'months')
}

function handleSelectYear(year: number) {
  let targetDate = props.date ? date(props.date.raw).setYear(year) : date()

  emit('update:date', targetDate)

  panelDate.value = targetDate
  panelType.value = 'day'
}

function handleSelectMonth(month: number) {
  let targetDate = props.date ? date(props.date.raw).setMonth(month) : date()

  emit('update:date', targetDate)
  panelType.value = 'day'
}

function handleSelectDate(day: Day) {
  if (day.disabled) return
  emit('update:date', day.date)
  emit('close-dropdown')
  if (day.type !== 'current') {
    panelDate.value = day.date
  }
}

function handlePreTenYears() {
  panelDate.value = panelDate.value.calc(-10, 'years')
}

function handleNextTenYears() {
  panelDate.value = panelDate.value.calc(10, 'years')
}
</script>
