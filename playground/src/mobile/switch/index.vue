<template>
  <div class="demo">
    <section>
      <h3>基础</h3>
      <div class="row">
        <USwitch v-model="on" />
      </div>
      <p class="tip">当前值：{{ on }}</p>
    </section>

    <section>
      <h3>带文字</h3>
      <div class="row">
        <USwitch v-model="textOn" active-text="开启" inactive-text="关闭" />
      </div>
    </section>

    <section>
      <h3>尺寸</h3>
      <div class="row">
        <USwitch v-model="on" size="small" />
        <USwitch v-model="on" />
        <USwitch v-model="on" size="large" />
      </div>
    </section>

    <section>
      <h3>禁用</h3>
      <div class="row">
        <USwitch :model-value="false" disabled />
        <USwitch :model-value="true" disabled />
      </div>
    </section>

    <section>
      <h3>只读</h3>
      <div class="row">
        <USwitch v-model="on" readonly />
      </div>
    </section>

    <section>
      <h3>change 事件</h3>
      <div class="row">
        <USwitch v-model="eventOn" @change="changed++" />
        <span>切换 {{ changed }} 次</span>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { USwitch } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/switch/style'

const on = shallowRef(true)
const textOn = shallowRef(false)
const eventOn = shallowRef(false)
const changed = shallowRef(0)
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
