<template>
  <div :class="cls.e('header')">
    <u-icon @click="handlePreYear" title="上一年">
      <DArrowLeft />
    </u-icon>

    <span :class="cls.e('header-year')" @click="state.panel = 'year'">
      {{ state.panelDate.year }}
    </span>

    <u-icon @click="handleNextYear" title="下一年">
      <DArrowRight />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@ui/components'
import { useDate } from '../use-date'
import { DArrowLeft, DArrowRight } from 'icon-ultra'

defineOptions({
  name: 'DatePickerMonthHeader'
})

const { state, cls, handlePreYear, handleNextYear } = useDate('inject')
</script>
