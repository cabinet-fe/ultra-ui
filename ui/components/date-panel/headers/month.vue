<template>
  <div :class="cls.e('header')">
    <u-icon @click="handlePreYear" title="上一年">
      <DArrowLeft />
    </u-icon>

    <span :class="cls.e('header-year')" @click="panelType = 'year'">
      {{ panelDate.year }}
    </span>

    <u-icon @click="handleNextYear" title="下一年">
      <DArrowRight />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@ui/components'
import { DArrowLeft, DArrowRight } from 'icon-ultra'
import { cls } from '../shared'
import { inject } from 'vue'
import { DatePanelDIKey } from '../di'

defineOptions({
  name: 'DatePanelMonthHeader'
})

const { panelDate, panelType, handlePreYear, handleNextYear } =
  inject(DatePanelDIKey)!
</script>
