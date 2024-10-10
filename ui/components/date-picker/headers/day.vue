<template>
  <div :class="cls.e('header')">
    <div>
      <u-icon @click="handlePreYear" title="上一年">
        <DArrowLeft />
      </u-icon>
      <u-icon @click="handlePreMonth" title="上个月">
        <ArrowLeft />
      </u-icon>
    </div>

    <div>
      <span :class="cls.e('header-year')" @click="state.panel = 'year'">
        {{ state.panelDate.year }}
      </span>
      <span :class="cls.e('header-month')" @click="state.panel = 'month'">
        {{ state.panelDate.month }}月
      </span>
    </div>

    <div>
      <u-icon @click="handleNextMonth" title="下个月">
        <ArrowRight />
      </u-icon>
      <u-icon @click="handleNextYear" title="下一年">
        <DArrowRight />
      </u-icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@ui/components'
import { useDate } from '../use-date'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'

defineOptions({
  name: 'DatePickerDayHeader'
})

const {
  state,
  cls,
  handlePreYear,
  handlePreMonth,
  handleNextYear,
  handleNextMonth
} = useDate('inject')
</script>
