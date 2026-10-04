<template>
  <div>
    <CustomCard title="基础形态">
      <u-skeleton style="max-width: 360px" />
    </CustomCard>

    <CustomCard title="头像与段落">
      <u-skeleton avatar :rows="2" style="max-width: 360px" />
    </CustomCard>

    <CustomCard title="按钮形态与圆角">
      <u-skeleton :title="false" :paragraph="false" button round style="max-width: 120px" />
      <u-skeleton :title="false" :paragraph="false" button style="max-width: 120px" />
    </CustomCard>

    <CustomCard title="动画开关与加载切换">
      <u-space style="margin-bottom: 16px">
        <u-switch v-model="loading" />
        <u-switch v-model="animated" />
        <span>{{ loading ? '加载中' : '已加载' }} / {{ animated ? '开启动画' : '关闭动画' }}</span>
      </u-space>
      <div class="skeleton-demo__toggle">
        <u-skeleton :loading="loading" :animated="animated" avatar :rows="2">
          <div class="skeleton-demo__content">
            <h3>春江花月夜</h3>
            <p>春江潮水连海平，海上明月共潮生。</p>
            <p>滟滟随波千万里，何处春江无月明。</p>
          </div>
        </u-skeleton>
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const loading = shallowRef(true)
const animated = shallowRef(true)
</script>

<style lang="scss" scoped>
.skeleton-demo__toggle,
.skeleton-demo__content {
  max-width: 360px;
}
</style>
