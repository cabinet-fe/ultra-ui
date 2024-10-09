<template>
  <div>
    <CustomCard title="基本使用">
      <u-date-picker v-model="d" :disabled-date="disabledDate" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { date } from 'cat-kit/fe'

const d = shallowRef(date().format('yyyy-MM-dd'))

function disabledDate(d) {
  return d.timestamp <= Date.now()
}
</script>
