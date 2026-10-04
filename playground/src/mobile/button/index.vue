<template>
  <div class="demo">
    <section>
      <h3>类型</h3>
      <div class="row">
        <UButton>默认</UButton>
        <UButton v-for="button of typedButtons" :key="button.type" :type="button.type">
          {{ button.text }}
        </UButton>
      </div>
    </section>

    <section>
      <h3>尺寸</h3>
      <div class="row">
        <UButton type="primary" size="large">大按钮</UButton>
        <UButton type="primary">中按钮</UButton>
        <UButton type="primary" size="small">小按钮</UButton>
      </div>
    </section>

    <section>
      <h3>朴素模式</h3>
      <div class="row">
        <UButton v-for="button of typedButtons" :key="button.type" :type="button.type" plain>
          {{ button.text }}
        </UButton>
      </div>
    </section>

    <section>
      <h3>文本按钮</h3>
      <div class="row">
        <UButton v-for="button of typedButtons" :key="button.type" :type="button.type" text>
          {{ button.text }}
        </UButton>
      </div>
    </section>

    <section>
      <h3>图标</h3>
      <div class="row">
        <UButton type="primary" :icon="Edit">编辑</UButton>
        <UButton type="primary" :icon="ArrowRight" icon-position="right">下一步</UButton>
        <UButton type="primary" circle :icon="Search" aria-label="搜索" />
      </div>
    </section>

    <section>
      <h3>加载与禁用</h3>
      <div class="row">
        <UButton loading type="primary">加载中</UButton>
        <UButton :loading-icon="Refresh" loading type="success">自定义加载图标</UButton>
        <UButton disabled type="warning">禁用</UButton>
      </div>
    </section>

    <section>
      <h3>点击</h3>
      <div class="row">
        <UButton type="primary" @click="count++">点击了 {{ count }} 次</UButton>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ArrowRight, Edit, Refresh, Search } from '@veltra/icons/normal'
import { UButton } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'

const typedButtons = [
  { type: 'primary', text: '主题' },
  { type: 'success', text: '成功' },
  { type: 'warning', text: '警告' },
  { type: 'danger', text: '危险' },
  { type: 'info', text: '信息' }
] as const

const count = shallowRef(0)
</script>

<style lang="scss" scoped>
// 375px 手机视口宽度内呈现，验证移动端密度与触控热区
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
  gap: 8px 12px;
}
</style>
