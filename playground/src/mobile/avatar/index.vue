<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <div class="row">
        <UAvatar :src="imgSrc" alt="默认头像图">图</UAvatar>
        <UAvatar src="/not-exists.png">坏图回退</UAvatar>
        <UAvatar>吴</UAvatar>
        <UAvatar>Veltra</UAvatar>
      </div>
    </section>

    <section>
      <h3>形状与尺寸</h3>
      <div class="row">
        <UAvatar shape="circle">圆</UAvatar>
        <UAvatar shape="round">圆角</UAvatar>
        <UAvatar size="small">小</UAvatar>
        <UAvatar size="default">中</UAvatar>
        <UAvatar size="large">大</UAvatar>
      </div>
      <div class="row">
        <UAvatar :src="imgSrc" shape="round" size="large">图</UAvatar>
        <UAvatar :src="imgSrc" size="small">图</UAvatar>
        <UAvatar :src="imgSrc" alt="头像图">默认</UAvatar>
      </div>
    </section>

    <section>
      <h3>加载失败</h3>
      <div class="row">
        <UAvatar src="/not-exists.png" @error="failed = true">吴</UAvatar>
        <span class="tip">{{ failed ? '图片加载失败，已回退插槽文字' : '正常展示插槽文字' }}</span>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UAvatar } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/avatar/style'

// 内联 SVG 头像图，避免演示页依赖外部图片地址
const imgSrc = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="royalblue"/><circle cx="32" cy="24" r="10" fill="white"/><path d="M12 58c2-12 10-17 20-17s18 5 20 17z" fill="white"/></svg>'
)}`

const failed = shallowRef(false)
</script>

<style lang="scss" scoped>
// 375px 手机视口宽度内呈现，验证移动端密度
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

  & + .row {
    margin-top: 12px;
  }
}

.tip {
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
