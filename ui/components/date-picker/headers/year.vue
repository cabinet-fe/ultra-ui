<template>
  <div :class="cls.e('header')">
    <u-icon @click="handlePreTenYears" title="上个十年">
      <DArrowLeft />
    </u-icon>

    <span> {{ startYear }} ~ {{ endYear }} </span>

    <u-icon @click="handleNextTenYears" title="下个十年">
      <DArrowRight />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@ui/components'
import { useDate } from '../use-date'
import { DArrowLeft, DArrowRight } from 'icon-ultra'
import { computed } from 'vue'

defineOptions({
  name: 'DatePickerMonthHeader'
})

const { state, cls, handlePreTenYears, handleNextTenYears } = useDate('inject')

const startYear = computed(() => {
  return state.panelDate.year - (state.panelDate.year % 10) + 1
})

const endYear = computed(() => {
  return startYear.value + 9
})
</script>
