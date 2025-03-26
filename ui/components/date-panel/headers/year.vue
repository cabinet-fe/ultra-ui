<template>
  <div :class="cls.e('header')">
    <u-icon @click="toPrevTenYears" title="上个十年">
      <DArrowLeft />
    </u-icon>

    <span> {{ startYear }} ~ {{ endYear }} </span>

    <u-icon @click="toNextTenYears" title="下个十年">
      <DArrowRight />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@ui/components'
import { DArrowLeft, DArrowRight } from 'icon-ultra'
import { computed } from 'vue'
import { inject } from 'vue'
import { DatePanelDIKey } from '../di'

defineOptions({
  name: 'DatePanelYearHeader'
})

const { panelDate, toPrevTenYears, toNextTenYears, cls } =
  inject(DatePanelDIKey)!

const startYear = computed(() => {
  return panelDate.value.year - (panelDate.value.year % 10) + 1
})

const endYear = computed(() => {
  return startYear.value + 9
})
</script>
