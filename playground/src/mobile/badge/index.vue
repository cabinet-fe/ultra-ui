<template>
  <div class="demo">
    <section>
      <h3>基本用法</h3>
      <div class="row">
        <UBadge :value="5">
          <UButton size="small">消息</UButton>
        </UBadge>
        <UBadge :value="12">
          <UButton size="small" circle :icon="Bell" aria-label="通知" />
        </UBadge>
      </div>
    </section>

    <section>
      <h3>类型与封顶</h3>
      <div class="row">
        <UBadge :value="10" type="primary">
          <UButton size="small">primary</UButton>
        </UBadge>
        <UBadge :value="15" type="warning">
          <UButton size="small">warning</UButton>
        </UBadge>
        <UBadge :value="200">
          <UButton size="small">max 99+</UButton>
        </UBadge>
      </div>
    </section>

    <section>
      <h3>自定义颜色</h3>
      <div class="row">
        <UBadge :value="8" color="var(--u-color-success)">
          <UButton size="small">color</UButton>
        </UBadge>
        <UBadge :value="8" color="var(--u-color-info)">
          <UButton size="small">info</UButton>
        </UBadge>
      </div>
    </section>

    <section>
      <h3>圆点与隐藏</h3>
      <div class="row">
        <UBadge dot>
          <UButton size="small" circle :icon="Message" aria-label="未读" />
        </UBadge>
        <UBadge dot>
          <span class="dot-text">未读消息</span>
        </UBadge>
        <UBadge :value="9" :hidden="hidden">
          <UButton size="small" @click="hidden = !hidden">{{ hidden ? '显示' : '隐藏' }}</UButton>
        </UBadge>
      </div>
    </section>

    <section>
      <h3>尺寸</h3>
      <div class="row">
        <UBadge v-for="size in sizes" :key="size" :value="36" :size="size">
          <UButton size="small">{{ size }}</UButton>
        </UBadge>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { Bell, Message } from '@veltra/icons/normal'
import { UBadge, UButton } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/badge/style'
import '@veltra/mobile/components/button/style'

const sizes = ['small', 'default', 'large'] as const

const hidden = shallowRef(false)
</script>

<style lang="scss" scoped>
// 375px 手机视口宽度内呈现
.demo {
  max-width: 375px;
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

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
}

.dot-text {
  font-size: 14px;
  color: var(--u-text-color-main);
}
</style>
