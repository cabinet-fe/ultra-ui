<template>
  <div>
    <CustomCard title="基本使用">
      <u-time-picker
        v-model="t"
        style="width: 200px"
        placeholder="选择时间"
        @change="handleChange"
      />
      <div>modelValue: {{ t }}</div>
      <div>change event: {{ changeVal }}</div>
    </CustomCard>

    <CustomCard title="禁用时段">
      <u-time-picker
        v-model="disabled"
        style="width: 200px"
        :disabled-hours="disabledHours"
        :disabled-minutes="disabledMinutes"
        :disabled-seconds="disabledSeconds"
      />
      <div>禁用小时 0~5 与 18~23；小时为 8 时禁用分钟 0~29；8:30 时禁用秒 0~29</div>
    </CustomCard>

    <CustomCard title="默认值与数据类型">
      <u-time-picker v-model="str" style="width: 200px" />
      <u-time-picker v-model="timestamp" data-type="timestamp" style="width: 200px" />
      <u-time-picker v-model="dateVal" data-type="date" style="width: 200px" />
      <div>字符串: {{ str }} / 时间戳: {{ timestamp }} / Date 对象: {{ dateVal }}</div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { date } from '@cat-kit/core'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const t = shallowRef('')
const changeVal = shallowRef('')

function handleChange(val?: Date) {
  changeVal.value = val ? `Date instance: ${val.toISOString()}` : 'undefined'
}

const disabled = shallowRef('08:30:30')

function disabledHours() {
  return [...Array.from({ length: 6 }, (_, i) => i), ...Array.from({ length: 6 }, (_, i) => i + 18)]
}

function disabledMinutes(hour: number) {
  return hour === 8 ? Array.from({ length: 30 }, (_, i) => i) : []
}

function disabledSeconds(hour: number, minute: number) {
  return hour === 8 && minute === 30 ? Array.from({ length: 30 }, (_, i) => i) : []
}

const str = shallowRef('09:30:00')
const timestamp = shallowRef(date().setHours(9).setMinutes(30).setSeconds(0).timestamp)
const dateVal = shallowRef(new Date(2026, 0, 1, 9, 30, 0))
</script>
