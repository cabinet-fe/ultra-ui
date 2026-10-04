<template>
  <div>
    <CustomCard title="水平分割线">
      <p>春江潮水连海平，海上明月共潮生。</p>
      <u-divider />
      <p>滟滟随波千万里，何处春江无月明。</p>
    </CustomCard>

    <CustomCard title="带文字">
      <u-divider>默认居中</u-divider>
      <u-divider align="left">左对齐</u-divider>
      <u-divider align="right">右对齐</u-divider>
    </CustomCard>

    <CustomCard title="垂直与虚线">
      <div class="divider-demo__inline">
        <span>文本</span>
        <u-divider direction="vertical" />
        <u-button size="small">按钮</u-button>
        <u-divider direction="vertical" dashed />
        <a>链接</a>
      </div>
      <u-divider dashed>虚线分割线</u-divider>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'
</script>

<style lang="scss" scoped>
.divider-demo__inline {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
</style>
