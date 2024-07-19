<template>
  <div class="progressDemo">
    <CustomCard title="配置">
      <div>
        <span>进度： </span>
        <u-number-input
          v-model="config.percentage"
          :max="100"
          style="width: 100px"
          :min="0"
          :step="10"
        />
      </div>
      <div>
        <span>样式： </span>

        <u-radio-group :items="types" v-model="config.type"></u-radio-group>
      </div>

      <div>
        <span>环形进度条尺寸 </span>

        <u-number-input
          v-model="config.size"
          style="width: 100px"
          :min="0"
          :step="10"
        />
      </div>
    </CustomCard>

    <CustomCard title="条形进度条">
      <u-progress v-bind="config" />
    </CustomCard>

    <CustomCard title="圆形进度条">
      <u-progress v-bind="config" circle />
    </CustomCard>

    <CustomCard title="动态状态">
      <u-progress :percentage="config.percentage" :type="getType">
        <template #default="{ percentage }">
          {{ percentage }}%
          <span v-if="percentage < 70"></span>
          <span v-else-if="percentage < 90">内存所剩不多 </span>
          <span v-else>
            内存严重不足 <u-icon><WarnTriangleFilled /></u-icon>
          </span>
        </template>
      </u-progress>
      <u-progress
        :percentage="config.percentage"
        :size="config.size"
        circle
        :type="getType"
        v-slot="{ percentage, type }"
      >
        <div :style="`color: var(--color-${type})`">{{ percentage }}%</div>
      </u-progress>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowReactive } from 'vue'
import CustomCard from '../card/custom-card.vue'
import type { ColorType } from '@ui/types'
import { WarnTriangleFilled } from 'icon-ultra'

const config = shallowReactive({
  percentage: 0,
  type: 'primary' as ColorType,
  size: 100
})

const types = ['primary', 'info', 'success', 'warning', 'danger'].map(t => {
  return {
    label: t,
    value: t
  }
})

const getType = (percentage: number) => {
  if (percentage < 70) {
    return 'success'
  }
  if (percentage < 90) {
    return 'warning'
  }
  return 'danger'
}
</script>
