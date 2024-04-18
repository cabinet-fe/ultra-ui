<template>
  <u-dropdown
    :class="className"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    width="auto"
  >
    <template #trigger>
      <u-input :size="size" :placeholder="placeholder">
        <template #suffix>
          <u-icon :class="cls.e('icon')"><Calendar /></u-icon>
        </template>
      </u-input>
    </template>

    <template #content>
      <div :class="cls.e('header')">
        <div>
          <u-icon><DArrowLeft /></u-icon>
          <u-icon><ArrowLeft /></u-icon>
        </div>

        <div>{{ today.year }} {{ today.month }}月</div>

        <div>
          <u-icon><ArrowRight /></u-icon>
          <u-icon><DArrowRight /></u-icon>
        </div>
      </div>
      <ul :class="cls.e('week')">
        <li :class="cls.e('week-day')" v-for="weekDay of weekDays">
          {{ weekDay }}
        </li>
      </ul>
      <ul :class="cls.e('days')">
        <li
          v-for="day of days"
          :class="[
            cls.e('day'),
            cls.em('day', day.type),
            bem.is('today', day.isToday === true)
          ]"
          :key="day.date.timestamp"
        >
          <span :class="cls.e('day-text')">
            {{ day.date.day }}
          </span>
        </li>
      </ul>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup>
import type { DatePickerProps } from '@ui/types/components/date-picker'
import { bem } from '@ui/utils'
import { UDropdown } from '../dropdown'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { computed, shallowRef } from 'vue'
import {
  Calendar,
  ArrowLeft,
  ArrowRight,
  DArrowLeft,
  DArrowRight
} from 'icon-ultra'
import { getMonthDays, weekDays } from '../calendar/utils'
import { date } from 'cat-kit/fe'

defineOptions({
  name: 'DatePicker'
})

const props = withDefaults(defineProps<DatePickerProps>(), {
  placeholder: '选择日期'
})

const today = date()
const model = defineModel<string>()

const cls = bem('date-picker')

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default'
})

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

const days = computed(() => {
  return getMonthDays(model.value ?? new Date())
})
</script>
