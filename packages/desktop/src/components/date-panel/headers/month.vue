<template>
  <div :class="cls.e('header')">
    <u-icon @click="toPrevYear" title="上一年">
      <DArrowLeft />
    </u-icon>

    <span :class="cls.e('header-year')" @click="panelType = 'year'">
      {{ panelDate.year }}
    </span>

    <u-icon @click="toNextYear" title="下一年">
      <DArrowRight />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@ultra-ui/desktop/components'
import { DArrowLeft, DArrowRight } from '@ultra/icon'
import { inject } from 'vue'
import { DatePanelDIKey } from '../di'

defineOptions({
  name: 'DatePanelMonthHeader'
})

const { panelDate, panelType, toPrevYear, toNextYear, cls } =
  inject(DatePanelDIKey)!
</script>
