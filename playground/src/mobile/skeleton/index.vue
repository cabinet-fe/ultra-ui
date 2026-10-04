<template>
  <div class="demo">
    <section>
      <h3>基础形态</h3>
      <USkeleton />
    </section>

    <section>
      <h3>头像与段落</h3>
      <USkeleton avatar :rows="2" />
    </section>

    <section>
      <h3>按钮形态与圆角</h3>
      <div class="row">
        <USkeleton :title="false" :paragraph="false" button round />
        <USkeleton :title="false" :paragraph="false" button />
      </div>
    </section>

    <section>
      <h3>动画与加载切换</h3>
      <div class="row">
        <UButton size="small" :type="loading ? 'primary' : 'default'" @click="loading = !loading">
          {{ loading ? '加载中' : '已加载' }}
        </UButton>
        <UButton
          size="small"
          :type="animated ? 'primary' : 'default'"
          @click="animated = !animated"
        >
          {{ animated ? '开启动画' : '关闭动画' }}
        </UButton>
      </div>
      <USkeleton :loading="loading" :animated="animated" avatar :rows="2">
        <div class="content">
          <h4>春江花月夜</h4>
          <p>春江潮水连海平，海上明月共潮生。</p>
          <p>滟滟随波千万里，何处春江无月明。</p>
        </div>
      </USkeleton>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, USkeleton } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/skeleton/style'

const loading = shallowRef(true)
const animated = shallowRef(true)
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现
.demo {
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
  gap: 8px 12px;
}

.content {
  h4 {
    margin: 0 0 8px;
    font-size: 15px;
  }

  p {
    margin: 0 0 6px;
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>
