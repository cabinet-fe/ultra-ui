<template>
  <div class="demo">
    <section>
      <h3>基础</h3>
      <div class="row">
        <URadio v-model="picked" :value="1" label="选项一" />
        <URadio v-model="picked" :value="2" label="选项二" />
      </div>
      <p class="tip">当前值：{{ picked }}</p>
    </section>

    <section>
      <h3>插槽内容</h3>
      <div class="row">
        <URadio v-model="slotPicked" :value="'a'">插槽 A</URadio>
        <URadio v-model="slotPicked" :value="'b'">插槽 B</URadio>
      </div>
    </section>

    <section>
      <h3>尺寸</h3>
      <div class="row">
        <URadio v-model="picked" :value="1" size="small">小</URadio>
        <URadio v-model="picked" :value="1">默认</URadio>
        <URadio v-model="picked" :value="1" size="large">大</URadio>
      </div>
    </section>

    <section>
      <h3>禁用</h3>
      <div class="row">
        <URadio v-model="picked" :value="1" disabled>选中禁用</URadio>
        <URadio v-model="picked" :value="2" disabled>未选禁用</URadio>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { URadio } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio/style'

const picked = shallowRef<number>(1)
const slotPicked = shallowRef<string>('a')
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
