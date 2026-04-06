<template>
  <div :class="cls.e('header')">
    <div>
      <u-icon @click="toPrevYear" title="上一年">
        <ChevronsLeft />
      </u-icon>
      <u-icon @click="toPrevMonth" title="上个月">
        <ArrowLeft />
      </u-icon>
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
      <u-icon @click="toNextMonth" title="下个月">
        <ArrowRight />
      </u-icon>
      <u-icon @click="toNextYear" title="下一年">
        <ChevronsRight />
      </u-icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '../../icon'
import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { inject } from 'vue'
import { DatePanelDIKey } from '../di'

defineOptions({
  name: 'DatePanelDayHeader'
})

const {
  panelDate,
  panelType,
  cls,
  toPrevMonth,
  toNextMonth,
  toPrevYear,
  toNextYear
} = inject(DatePanelDIKey)!
</script>
