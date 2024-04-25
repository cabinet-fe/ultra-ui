<template>
  <div>
    <CustomCard title="基本使用">
      <u-date-picker v-model="date" :disabled-date="(d) => d.timestamp <= Date.now()" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'

const date = shallowRef('2024-04-20')
</script>
