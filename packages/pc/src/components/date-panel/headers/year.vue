<template>
  <div :class="cls.e('header')">
    <u-icon @click="toPrevTenYears" title="上个十年">
      <ChevronsLeft />
    </u-icon>

    <span> {{ startYear }} ~ {{ endYear }} </span>

    <u-icon @click="toNextTenYears" title="下个十年">
      <ChevronsRight />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '../../icon'
import { ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
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
