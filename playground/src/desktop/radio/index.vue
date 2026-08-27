<template>
  <div class="box">
    <CustomCard title="基础单选框">
      <div class="demo-row">
        <u-radio
          v-for="{ label, value } of items"
          :key="value"
          v-model="radio1"
          :value="value"
          :disabled="value === '3'"
        >
          {{ label }}
        </u-radio>
      </div>
    </CustomCard>

    <CustomCard title="单选框组（默认样式）">
      <div class="demo-section">
        <div class="demo-desc">基础横向</div>
        <u-radio-group :items="items" v-model="radio1" />
      </div>

      <div class="demo-section">
        <div class="demo-desc">某项禁用</div>
        <u-radio-group
          :items="items"
          v-model="radio1"
          :disabled-item="(item) => item.value === '1'"
        />
      </div>

      <div class="demo-section">
        <div class="demo-desc">纵向排布 (block)</div>
        <u-radio-group :items="items" v-model="radio1" block />
      </div>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const radio1 = shallowRef('1')

const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]
</script>

<style scoped lang="scss">
.demo-section {
  & + & {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--u-border-color);
  }
}

.demo-desc {
  font-size: 13px;
  color: var(--u-text-color-second);
  margin-bottom: 10px;
}

.demo-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
