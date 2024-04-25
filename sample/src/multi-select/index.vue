<template>
  <div>
    <CustomCard title="使用">


      <u-multi-select :max="3" :visibility-limit="20" filterable v-model="checked" :options="options" />

      {{ checked }}
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

const checked = shallowRef([1, 2, 3])
</script>

<style lang="scss" scoped></style>
