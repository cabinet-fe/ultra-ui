<template>
  <div>
    <CustomCard title="基本用法">
      <u-rate v-model="value" />
      <span class="rate-value">当前分值：{{ value }}</span>
    </CustomCard>

    <CustomCard title="半星">
      <u-rate v-model="halfValue" allow-half />
      <span class="rate-value">当前分值：{{ halfValue }}</span>
    </CustomCard>

    <CustomCard title="只读与禁用">
      <u-rate :model-value="4" readonly />
      <u-rate :model-value="2" disabled />
    </CustomCard>

    <CustomCard title="字符与颜色定制">
      <u-rate v-model="charValue" character="好" />
      <u-rate v-model="colorValue" color="#e63946" :count="6" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const value = shallowRef(3)
const halfValue = shallowRef(2.5)
const charValue = shallowRef(4)
const colorValue = shallowRef(5)
</script>

<style lang="scss" scoped>
.rate-value {
  margin-left: 12px;
  vertical-align: middle;
}
</style>
