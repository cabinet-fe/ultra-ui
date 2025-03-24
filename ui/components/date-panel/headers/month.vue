<template>
  <div :class="cls.e('header')">
    <u-icon @click="emit('pre-year')" title="上一年">
      <DArrowLeft />
    </u-icon>

    <span :class="cls.e('header-year')" @click="emit('click:year')">
      {{ panelDate.year }}
    </span>

    <u-icon @click="emit('next-year')" title="下一年">
      <DArrowRight />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@ui/components'
import { DArrowLeft, DArrowRight } from 'icon-ultra'
import { cls } from '../shared'
import type { Dater } from 'cat-kit/fe'

defineOptions({
  name: 'DatePanelMonthHeader'
})

defineProps<{
  panelDate: Dater
}>()

const emit = defineEmits(['pre-year', 'next-year', 'click:year'])
</script>
