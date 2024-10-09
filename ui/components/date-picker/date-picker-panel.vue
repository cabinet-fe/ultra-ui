<template>
  <div :class="cls.e('header')">
    <div>
      <u-icon @click="handlePreYear" title="上一年"><DArrowLeft /></u-icon>
      <u-icon
        @click="handlePreMonth"
        title="上个月"
        v-if="state.panel === 'day'"
      >
        <ArrowLeft />
      </u-icon>
    </div>

    <div>
      <span :class="cls.e('header-year')" @click="state.panel = 'year'">
        {{ state.panelDate.year }}
      </span>
      <span
        :class="cls.e('header-month')"
        @click="handleSwitchToMonth"
        v-if="state.panel === 'day'"
      >
        {{ state.panelDate.month }}月
      </span>
    </div>

    <div>
      <u-icon
        @click="handleNextMonth"
        title="下个月"
        v-if="state.panel === 'day'"
      >
        <ArrowRight />
      </u-icon>
      <u-icon @click="handleNextYear" title="下一年"><DArrowRight /></u-icon>
    </div>
  </div>

  <DayPanel v-if="state.panel === 'day'" />
  <MonthPanel v-if="state.panel === 'month'" />
  <YearPanel v-if="state.panel === 'year'" />
</template>

<script lang="ts" setup>
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { UIcon } from '../icon'
import DayPanel from './panels/day.vue'
import MonthPanel from './panels/month.vue'
import YearPanel from './panels/year.vue'
import { useDate } from './use-date'

defineOptions({
  name: 'DatePickerPanel',
  inheritAttrs: false
})

const { cls, state } = useDate('inject')

function handlePreYear() {
  state.panelDate = state.panelDate.calc(-1, 'years')
}

function handlePreMonth() {
  state.panelDate = state.panelDate.calc(-1, 'months')
}

function handleNextYear() {
  state.panelDate = state.panelDate.calc(1, 'years')
}

function handleNextMonth() {
  state.panelDate = state.panelDate.calc(1, 'months')
}

function handleSwitchToMonth() {
  state.panel = 'month'
  state.panelDate = state.panelDate.setDay(1)
}
</script>
