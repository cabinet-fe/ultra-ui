<template>
  <div class="demo">
    <section>
      <h3>横向滚动形态</h3>
      <USteps v-model:current="current" :items="items" />
      <p class="tip">
        步骤超出屏宽时横向滚动，当前步骤自动滚入视野；点击步骤项切换，按住有按压高亮反馈。
      </p>
    </section>

    <section>
      <h3>纵向形态</h3>
      <USteps v-model:current="current" :items="items" direction="vertical" />
    </section>

    <section>
      <h3>按 currentKey 定位</h3>
      <USteps :items="keyedItems" current-key="key" current="step-c" />
    </section>

    <section>
      <h3>步骤颜色类型</h3>
      <USteps
        :items="items"
        :current="1"
        current-step-type="primary"
        finished-step-type="warning"
      />
    </section>

    <section>
      <h3>自定义图标与内容插槽</h3>
      <USteps :items="items" :current="1">
        <template #icon="{ index }">
          <span class="dot">{{ index + 1 }}</span>
        </template>
        <template #content="{ item }">
          <span class="label">{{ item.label }}</span>
        </template>
      </USteps>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { USteps } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/steps/style'

const current = shallowRef<number | string>(1)

const items = [
  { label: '填写资料' },
  { label: '验证身份' },
  { label: '设置密码' },
  { label: '完成注册' }
]

const keyedItems = [
  { key: 'step-a', label: '提交申请' },
  { key: 'step-b', label: '主管审批' },
  { key: 'step-c', label: '财务复核' },
  { key: 'step-d', label: '归档' }
]
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控热区
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

.tip {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.dot {
  font-size: 13px;
}

.label {
  font-weight: 400;
  color: var(--u-text-color-main);
}
</style>
