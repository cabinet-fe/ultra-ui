<template>
  <div class="demo">
    <section>
      <h3>基础卡片</h3>
      <UCard>
        <UText as="main-title">订单概览</UText>
        <UText>今日新增 12 笔，待处理 3 笔，已完成 128 笔。</UText>
        <UDivider />
        <USpace>
          <UButton size="small" type="primary">查看详情</UButton>
          <UButton size="small">忽略</UButton>
        </USpace>
      </UCard>
    </section>

    <section>
      <h3>融合卡片</h3>
      <UCard integrate>
        <UText as="title">integrate 形态</UText>
        <UText>无阴影嵌入页面背景，适合作为分区容器使用。</UText>
      </UCard>
    </section>

    <section>
      <h3>尺寸与宽度</h3>
      <div class="stack">
        <UCard size="small" width="100%">
          <UText as="sub-title">small · width 100%</UText>
          <UText additional>辅助说明文字，展示小尺寸密度。</UText>
        </UCard>
        <UCard size="large">
          <UText as="title">large 密度</UText>
          <UText>更大的内边距与字号，适合首屏内容卡片。</UText>
        </UCard>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UCard, UDivider, USpace, UText } from '@veltra/mobile'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/card/style'
import '@veltra/mobile/components/divider/style'
import '@veltra/mobile/components/space/style'
import '@veltra/mobile/components/text/style'
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度（内边距、圆角走 tokens）
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
  gap: 12px;
}
</style>
