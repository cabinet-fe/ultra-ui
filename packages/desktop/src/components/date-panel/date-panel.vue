<template>
  <div :class="[cls.b, cls.m(props.size)]">
    <template v-if="panelType === 'day'">
      <DayHeader />
      <DayPanel />
    </template>

    <template v-else-if="panelType === 'year'">
      <YearHeader />
      <YearPanel />
    </template>

    <template v-else-if="panelType === 'month'">
      <MonthHeader />
      <MonthPanel />
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { DatePanelEmits, DatePanelProps } from '../../types'
import DayHeader from './headers/day.vue'
import MonthHeader from './headers/month.vue'
import YearHeader from './headers/year.vue'
import DayPanel from './panels/day.vue'
import MonthPanel from './panels/month.vue'
import YearPanel from './panels/year.vue'
import { usePanel } from './use-panel'

defineOptions({ name: 'DatePanel' })

const props = withDefaults(defineProps<DatePanelProps>(), { size: 'default', type: 'date' })

const emit = defineEmits<DatePanelEmits>()

const { cls, panelType } = usePanel({ props, emit })
</script>
