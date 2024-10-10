<template>
  <div>
    <CustomCard title="基本使用">
      <u-radio-group v-model="type" :items="items">选择类型</u-radio-group>
      <u-date-picker
        v-model="d"
        :type="type"
        style="width: 200px"
        :disabled-date="disabledDate"
      />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { date } from 'cat-kit/fe'

const d = shallowRef(date().format())

function disabledDate(d) {
  return d.timestamp <= Date.now()
}

const type = shallowRef<'date' | 'month' | 'year'>('date')

const items = shallowRef([
  { label: '日期', value: 'date' },
  { label: '月份', value: 'month' },
  { label: '年份', value: 'year' }
])
</script>
