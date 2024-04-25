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
import type { CalendarProps } from '@ui/types/components/calendar'
import { bem } from '@ui/utils'
import { computed } from 'vue'
import { getMonthDays } from './utils'

defineOptions({
  name: 'Calendar'
})

defineProps<CalendarProps>()

const model = defineModel<string>()

const cls = bem('calendar')

const days = computed(() => {
  return getMonthDays(model.value ?? new Date())
})
</script>
