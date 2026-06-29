<template>
  <div :class="cls.b">
    <ul :class="cls.e('days')">
      <li
        :class="[cls.e('day'), cls.em('day', day.type)]"
        v-for="day of days"
        :key="day.date.timestamp"
      >
        {{ day.date.day }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { CalendarProps } from '../../types'
import { getMonthDays } from './utils'

defineOptions({ name: 'UCalendar' })

defineProps<CalendarProps>()

const model = defineModel<string>()

const cls = bem('calendar')

const days = computed(() => {
  return getMonthDays(model.value ?? new Date())
})
</script>
