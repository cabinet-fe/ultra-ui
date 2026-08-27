<template>
  <div class="box">
    <CustomCard title="基础分段选择">
      <div class="demo-section">
        <div class="demo-desc">当前选中: {{ segmentValue }}</div>
        <u-segment :items="items" v-model="segmentValue" />
      </div>
    </CustomCard>

    <CustomCard title="不同尺寸 (small / default / large)">
      <div class="demo-col">
        <u-segment :items="items" v-model="segmentValue" size="small" />
        <u-segment :items="items" v-model="segmentValue" size="default" />
        <u-segment :items="items" v-model="segmentValue" size="large" />
      </div>
    </CustomCard>

    <CustomCard title="撑满容器 (block)">
      <u-segment :items="items" v-model="segmentValue" block style="max-width: 480px" />
    </CustomCard>

    <CustomCard title="禁用状态">
      <div class="demo-section">
        <div class="demo-desc">某项禁用</div>
        <u-segment
          :items="items"
          v-model="segmentValue"
          :disabled-item="(item) => item.value === '2'"
        />
      </div>

      <div class="demo-section">
        <div class="demo-desc">整组禁用</div>
        <u-segment :items="items" v-model="segmentValue" disabled />
      </div>
    </CustomCard>

    <CustomCard title="只读状态">
      <u-segment :items="items" v-model="segmentValue" readonly />
    </CustomCard>

    <CustomCard title="自定义标签插槽">
      <u-segment :items="items" v-model="segmentValue">
        <template #item="{ item, active }">
          <span :class="{ 'item-active': active }">{{ item.label }} ✓</span>
        </template>
      </u-segment>
    </CustomCard>

    <CustomCard title="在表单中使用">
      <u-form :model="formData">
        <u-segment field="period" label="统计周期" :items="periodItems" />
      </u-form>
      <div class="demo-desc" style="margin-top: 12px">表单数据: {{ formData }}</div>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const segmentValue = shallowRef('daily')

const items = [
  { label: '按日', value: 'daily' },
  { label: '按周', value: 'weekly' },
  { label: '按月', value: 'monthly' },
  { label: '按年', value: 'yearly' }
]

const formData = reactive({ period: 'monthly' })

const periodItems = [
  { label: '日', value: 'daily' },
  { label: '月', value: 'monthly' },
  { label: '年', value: 'yearly' }
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

.demo-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.item-active {
  color: var(--u-color-primary);
  font-weight: 600;
}
</style>
