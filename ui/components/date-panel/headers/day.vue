<template>
  <div :class="cls.e('header')">
    <div>
      <u-icon @click="emit('pre-year')" title="上一年">
        <DArrowLeft />
      </u-icon>
      <u-icon @click="emit('pre-month')" title="上个月">
        <ArrowLeft />
      </u-icon>
    </div>

    <div>
      <span :class="cls.e('header-year')" @click="emit('click:year')">
        {{ panelDate.year }}
      </span>
      <span :class="cls.e('header-month')" @click="emit('click:month')">
        {{ panelDate.month }}月
      </span>
    </div>

    <div>
      <u-icon @click="emit('next-month')" title="下个月">
        <ArrowRight />
      </u-icon>
      <u-icon @click="emit('next-year')" title="下一年">
        <DArrowRight />
      </u-icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@ui/components'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { cls } from '../shared'
import type { Dater } from 'cat-kit/fe'

defineOptions({
  name: 'DatePanelDayHeader'
})

defineProps<{
  panelDate: Dater
}>()

const emit = defineEmits([
  'pre-year',
  'pre-month',
  'next-year',
  'next-month',
  'click:year',
  'click:month'
])
</script>
