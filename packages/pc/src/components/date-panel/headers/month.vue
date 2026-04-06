<template>
  <div :class="cls.e('header')">
    <u-icon @click="toPrevYear" title="上一年">
      <ChevronsLeft />
    </u-icon>

    <span :class="cls.e('header-year')" @click="panelType = 'year'">
      {{ panelDate.year }}
    </span>

    <u-icon @click="toNextYear" title="下一年">
      <ChevronsRight />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '../../icon'
import { ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { inject } from 'vue'
import { DatePanelDIKey } from '../di'

defineOptions({
  name: 'DatePanelMonthHeader'
})

const { panelDate, panelType, toPrevYear, toNextYear, cls } =
  inject(DatePanelDIKey)!
</script>
