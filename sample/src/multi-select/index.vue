<template>
 <div>
  <CustomCard title="使用">
    <u-multi-select v-model="checked" :options="options" />
  </CustomCard>
 </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'
import { shallowRef } from 'vue'

const options = Array.from({ length: 100 }).map((_, i) => ({
  label: `选项${i}`,
  value: i
}))

const checked = shallowRef([])

</script>

<style lang="scss" scoped>

</style>