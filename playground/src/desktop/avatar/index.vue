<template>
  <div>
    <CustomCard title="基础用法（图片、文字回退、形状与尺寸）">
      <div class="avatar-demo__row">
        <u-avatar :src="imgSrc" alt="默认头像图">图</u-avatar>
        <u-avatar src="/not-exists.png">坏</u-avatar>
        <u-avatar>吴</u-avatar>
        <u-avatar>Veltra</u-avatar>
      </div>

      <div class="avatar-demo__row">
        <u-avatar>圆</u-avatar>
        <u-avatar shape="round">圆角</u-avatar>
        <u-avatar size="small">小</u-avatar>
        <u-avatar size="default">中</u-avatar>
        <u-avatar size="large">大</u-avatar>
      </div>

      <p class="avatar-demo__tip">
        未传 src 或图片加载失败时自动回退展示插槽文字；shape 支持 circle（默认）与 round。
      </p>
    </CustomCard>

    <CustomCard title="头像组（重叠展示与 max 溢出）">
      <div class="avatar-demo__row">
        <u-avatar-group>
          <u-avatar>吴</u-avatar>
          <u-avatar>李</u-avatar>
          <u-avatar>张</u-avatar>
          <u-avatar>王</u-avatar>
          <u-avatar>赵</u-avatar>
        </u-avatar-group>
      </div>

      <div class="avatar-demo__row">
        <u-avatar-group :max="3">
          <u-avatar>吴</u-avatar>
          <u-avatar>李</u-avatar>
          <u-avatar>张</u-avatar>
          <u-avatar>王</u-avatar>
          <u-avatar>赵</u-avatar>
          <u-avatar>钱</u-avatar>
        </u-avatar-group>
      </div>

      <p class="avatar-demo__tip">设置 max 后超出部分收起为 +N。</p>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import CustomCard from '../card/custom-card.vue'

// 内联 SVG 头像图，避免演示页依赖外部图片地址
const imgSrc = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#409eff"/><circle cx="32" cy="24" r="10" fill="#fff"/><path d="M12 58c2-12 10-17 20-17s18 5 20 17z" fill="#fff"/></svg>'
)}`
</script>

<style scoped>
.avatar-demo__row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar-demo__tip {
  margin: 8px 0 0;
  font-size: 13px;
}
</style>
