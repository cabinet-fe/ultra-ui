<template>
  <div class="demo">
    <section>
      <h3>间距档位</h3>
      <div class="stack">
        <USpace size="small">
          <UButton size="small">小间距</UButton>
          <UButton size="small">按钮</UButton>
          <UButton size="small">按钮</UButton>
        </USpace>
        <USpace>
          <UButton>默认间距</UButton>
          <UButton>按钮</UButton>
        </USpace>
        <USpace size="large">
          <UButton size="large">大间距</UButton>
        </USpace>
        <USpace :size="16">
          <span class="chip">自定义 16px</span>
          <span class="chip">标签</span>
        </USpace>
      </div>
    </section>

    <section>
      <h3>垂直与对齐</h3>
      <div class="stack">
        <USpace direction="vertical" align="start">
          <UText as="title">垂直排列</UText>
          <UText>交叉轴起始对齐（align=start）。</UText>
          <UButton size="small">按钮</UButton>
        </USpace>
        <USpace align="baseline">
          <span class="big">大字</span>
          <span class="chip">基线对齐</span>
        </USpace>
      </div>
    </section>

    <section>
      <h3>自动换行</h3>
      <USpace wrap>
        <span v-for="i in 10" :key="i" class="chip">标签 {{ i }}</span>
      </USpace>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, USpace, UText } from '@veltra/mobile'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/space/style'
import '@veltra/mobile/components/text/style'
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证 wrap 不横向溢出
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

.stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.chip {
  padding: 2px 10px;
  border-radius: var(--u-radius-default);
  border: 1px solid var(--u-border-color);
  font-size: 13px;
  color: var(--u-text-color-main);
}

.big {
  font-size: 24px;
  color: var(--u-text-color-main);
}
</style>
