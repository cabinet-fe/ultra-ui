<template>
  <div>
    <CustomCard title="基本使用">
      <u-radio-group v-model="type" :items="items">选择类型</u-radio-group>
      <u-radio-group v-model="dataType" :items="dataTypeItems">数据类型 (dataType)</u-radio-group>
      <u-date-picker
        v-model="d"
        :type="type"
        :data-type="dataType"
        style="width: 200px"
        :disabled-date="disabledDate"
        @change="handleChange"
      />
      <div>modelValue: {{ d }} ({{ typeof d }})</div>
      <div>change event: {{ changeVal }}</div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { date } from '@cat-kit/core'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const d = shallowRef<any>(date().format('yyyy-MM-dd HH:mm:ss'))
const changeVal = shallowRef<string>('')

function handleChange(val?: Date) {
  changeVal.value = val ? `Date instance: ${val.toISOString()}` : 'undefined'
}

function disabledDate(d: any) {
  return d.timestamp <= Date.now()
}

const type = shallowRef<'date' | 'month' | 'year'>('date')

const items = shallowRef([
  { label: '日期', value: 'date' },
  { label: '月份', value: 'month' },
  { label: '年份', value: 'year' }
])

const dataType = shallowRef<'string' | 'date' | 'timestamp'>('string')

const dataTypeItems = shallowRef([
  { label: '字符串 (string)', value: 'string' },
  { label: '日期对象 (date)', value: 'date' },
  { label: '时间戳 (timestamp)', value: 'timestamp' }
])
</script>
