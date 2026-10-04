<template>
  <div class="demo">
    <section>
      <h3>水平分割线</h3>
      <p class="poem">春江潮水连海平，海上明月共潮生。</p>
      <UDivider />
      <p class="poem">滟滟随波千万里，何处春江无月明。</p>
    </section>

    <section>
      <h3>带文字</h3>
      <UDivider>默认居中</UDivider>
      <UDivider align="left">左对齐</UDivider>
      <UDivider align="right">右对齐</UDivider>
    </section>

    <section>
      <h3>垂直与虚线</h3>
      <div class="inline-row">
        <span>文本</span>
        <UDivider direction="vertical" />
        <UButton size="small">按钮</UButton>
        <UDivider direction="vertical" dashed />
        <span>链接</span>
      </div>
      <UDivider dashed>虚线分割线</UDivider>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UDivider } from '@veltra/mobile'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/divider/style'
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

.poem {
  margin: 0;
  font-size: 14px;
  color: var(--u-text-color-main);
}

.inline-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
