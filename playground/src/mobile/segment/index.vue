<template>
  <div class="demo">
    <section>
      <h3>基础分段选择</h3>
      <p class="tip">当前选中：{{ segmentValue }}；按住分段项有按压反馈</p>
      <USegment :items="items" v-model="segmentValue" block />
    </section>

    <section>
      <h3>不同尺寸（small / default / large）</h3>
      <div class="col">
        <USegment :items="compactItems" v-model="segmentValue" size="small" />
        <USegment :items="compactItems" v-model="segmentValue" />
        <USegment :items="compactItems" v-model="segmentValue" size="large" />
      </div>
    </section>

    <section>
      <h3>禁用状态</h3>
      <USegment
        :items="items"
        v-model="segmentValue"
        block
        :disabled-item="(item) => item.value === 'monthly'"
      />
      <USegment :items="items" v-model="segmentValue" block disabled />
    </section>

    <section>
      <h3>只读状态</h3>
      <USegment :items="items" v-model="segmentValue" readonly />
    </section>

    <section>
      <h3>自定义标签插槽</h3>
      <USegment :items="items" v-model="segmentValue" block>
        <template #item="{ item, active }">
          <span :class="{ 'item-active': active }">{{ item.label }} ✓</span>
        </template>
      </USegment>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { USegment } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/segment/style'

const segmentValue = shallowRef('daily')

const items = [
  { label: '按日', value: 'daily' },
  { label: '按周', value: 'weekly' },
  { label: '按月', value: 'monthly' },
  { label: '按年', value: 'yearly' }
]

const compactItems = [
  { label: '日', value: 'daily' },
  { label: '周', value: 'weekly' },
  { label: '月', value: 'monthly' }
]
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证触控热区 ≥44×44
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.tip {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.col {
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
