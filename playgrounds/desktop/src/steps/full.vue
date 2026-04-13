<template>
  <div>
    <div style="display: flex; gap: 30px; align-items: center; margin-bottom: 20px">
      <div>
        方向:
        <u-radio-group v-model="config.direction" :items="directions"></u-radio-group>
      </div>

      <div v-if="config.direction === 'horizontal'">
        居中:
        <u-switch v-model="config.alignCenter"></u-switch>
      </div>

      <div>
        当前步骤项颜色类型:
        <u-select
          style="width: 200px"
          v-model="config.currentStepType"
          :options="colorTypes"
        ></u-select>
      </div>

      <div>
        已完成项步骤颜色类型:
        <u-select
          v-model="config.finishedStepType"
          style="width: 200px"
          :options="colorTypes"
        ></u-select>
      </div>
    </div>

    <u-steps :items :current v-bind="config">
      <template #tip="{ item }">
        <div>{{ item.label }}</div>
      </template>
    </u-steps>

    <u-button-group>
      <u-button @click="current--">上一步</u-button>
      <u-button @click="current++">下一步</u-button>
    </u-button-group>
  </div>
</template>

<script setup lang="ts">
import type { ColorType } from '@veltra/desktop'
import { shallowReactive, shallowRef } from 'vue'

const directions = [
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' }
]

const colorTypes = [
  { label: 'primary', value: 'primary' },
  { label: 'info', value: 'info' },
  { label: 'success', value: 'success' },
  { label: 'warning', value: 'warning' },
  { label: 'danger', value: 'danger' }
]

const items = Array.from({ length: 10 }, (_, index) => ({
  label: `步骤${index + 1}`
}))

const current = shallowRef(0)

const config = shallowReactive({
  direction: 'horizontal' as 'horizontal' | 'vertical',
  currentStepType: undefined as ColorType | undefined,
  finishedStepType: 'success' as ColorType,
  alignCenter: false
})
</script>
