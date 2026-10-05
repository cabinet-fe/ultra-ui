<template>
  <div class="demo">
    <section>
      <h3>基础</h3>
      <div class="row">
        <UCheckbox v-model="checked">复选框</UCheckbox>
      </div>
      <p class="tip">当前值：{{ checked }}</p>
    </section>

    <section>
      <h3>中间状态</h3>
      <div class="row">
        <UCheckbox v-model="checked" indeterminate>部分选中</UCheckbox>
      </div>
    </section>

    <section>
      <h3>尺寸</h3>
      <div class="row">
        <UCheckbox v-model="checked" size="small">小</UCheckbox>
        <UCheckbox v-model="checked">默认</UCheckbox>
        <UCheckbox v-model="checked" size="large">大</UCheckbox>
      </div>
    </section>

    <section>
      <h3>禁用 / 只读</h3>
      <div class="row">
        <UCheckbox :model-value="true" disabled>选中禁用</UCheckbox>
        <UCheckbox :model-value="false" disabled>未选禁用</UCheckbox>
        <UCheckbox :model-value="true" readonly>选中只读</UCheckbox>
      </div>
    </section>

    <section>
      <h3>change 事件</h3>
      <div class="row">
        <UCheckbox v-model="eventChecked" @change="changed++">切换 {{ changed }} 次</UCheckbox>
      </div>
    </section>

    <section>
      <h3>表单行内</h3>
      <UForm :model="form">
        <UCheckbox label="记住登录" field="remember">30 天内免登录</UCheckbox>
      </UForm>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UCheckbox, UForm } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/checkbox/style'

const checked = shallowRef(false)
const eventChecked = shallowRef(false)
const changed = shallowRef(0)
const form = reactive({ remember: false })
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

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.tip {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
