<template>
  <div class="demo">
    <section>
      <h3>进度控制</h3>
      <div class="row">
        <UButton size="small" @click="percentage = Math.max(0, percentage - 10)">-10</UButton>
        <UButton size="small" type="primary" @click="percentage = Math.min(100, percentage + 10)">
          +10
        </UButton>
      </div>
      <UProgress type="primary" :percentage="percentage" />
    </section>

    <section>
      <h3>颜色类型</h3>
      <UProgress v-for="t in types" :key="t" :type="t" :percentage="70" />
    </section>

    <section>
      <h3>环形进度条</h3>
      <UProgress circle :size="120" :percentage="percentage" />
      <div class="row">
        <UProgress v-for="t in types" :key="t" circle :size="72" :type="t" :percentage="60" />
      </div>
    </section>

    <section>
      <h3>动态状态</h3>
      <UProgress :percentage="percentage" :type="getType">
        <template #default="{ percentage: p }">
          {{ p }}%
          <span v-if="p >= 90">内存严重不足</span>
          <span v-else-if="p >= 70">内存所剩不多</span>
        </template>
      </UProgress>
      <UProgress :percentage="percentage" :size="100" circle :type="getType">
        <template #default="{ percentage: p, type: t }">
          <span :style="{ color: `var(--u-color-${t})` }">{{ p }}%</span>
        </template>
      </UProgress>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UProgress } from '@veltra/mobile'
import type { ColorType } from '@veltra/utils'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/progress/style'

const percentage = shallowRef(40)

const types = ['primary', 'success', 'warning', 'danger', 'info'] as const

const getType = (p: number): ColorType => {
  if (p < 70) return 'success'
  if (p < 90) return 'warning'
  return 'danger'
}
</script>

<style lang="scss" scoped>
// 375px 手机视口宽度内呈现
.demo {
  max-width: 375px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
</style>
