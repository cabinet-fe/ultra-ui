<template>
  <div :class="cls.e('header')">
    <u-icon @click="emit('pre-ten-years')" title="上个十年">
      <DArrowLeft />
    </u-icon>

    <span> {{ startYear }} ~ {{ endYear }} </span>

    <u-icon @click="emit('next-ten-years')" title="下个十年">
      <DArrowRight />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@ui/components'
import { DArrowLeft, DArrowRight } from 'icon-ultra'
import { computed } from 'vue'
import type { Dater } from 'cat-kit/fe'
import { cls } from '../shared'

defineOptions({
  name: 'DatePanelYearHeader'
})

const props = defineProps<{
  panelDate: Dater
}>()

const emit = defineEmits(['pre-ten-years', 'next-ten-years'])

const startYear = computed(() => {
  return props.panelDate.year - (props.panelDate.year % 10) + 1
})

const endYear = computed(() => {
  return startYear.value + 9
})
</script>
