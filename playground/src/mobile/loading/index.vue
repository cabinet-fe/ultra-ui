<template>
  <div class="demo">
    <section>
      <h3>四种加载动画</h3>
      <div class="grid">
        <div v-for="t in types" :key="t" class="cell" v-loading:[t]="true">
          <span class="label">{{ t }}</span>
        </div>
      </div>
    </section>

    <section>
      <h3>v-loading 指令</h3>
      <div class="row">
        <UButton size="small" v-for="t in types" :key="t" @click="setLoading(t)">
          {{ t }}
        </UButton>
        <UButton size="small" :type="loading ? 'primary' : 'default'" @click="toggle">
          {{ loading ? '停止加载' : '开始加载' }}
        </UButton>
      </div>
      <div class="cell" v-loading:[type]="loading">
        <span class="label">内容区域：加载时整块覆盖，居中呈现</span>
      </div>
    </section>

    <section>
      <h3>组件形态</h3>
      <div class="cell static">
        <ULoading type="dot" />
        <span class="label">ULoading 覆盖父级定位容器</span>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, ULoading, vLoading } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/loading/style'

const types = ['dual-ring', 'dot', 'ring', 'bars'] as const

const type = shallowRef<(typeof types)[number]>('dual-ring')
const loading = shallowRef(false)

function setLoading(t: (typeof types)[number]) {
  type.value = t
  loading.value = true
}

function toggle() {
  loading.value = !loading.value
}
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
  margin-bottom: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.cell {
  position: relative;
  height: 96px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
  border-radius: var(--u-radius-large);
  background: var(--u-bg-color-middle);
}

.label {
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
