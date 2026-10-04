<template>
  <div class="demo">
    <section>
      <h3>基础</h3>
      <URadioGroup v-model="picked" :items="items" />
      <p class="tip">当前值：{{ picked }}</p>
    </section>

    <section>
      <h3>自定义 key</h3>
      <URadioGroup v-model="city" :items="cities" value-key="id" label-key="name" />
    </section>

    <section>
      <h3>block 整行铺开</h3>
      <URadioGroup v-model="picked" :items="items" block />
    </section>

    <section>
      <h3>禁用选项</h3>
      <URadioGroup v-model="picked" :items="items" :disabled-item="(item) => item.value === 'b'" />
    </section>

    <section>
      <h3>整体禁用</h3>
      <URadioGroup v-model="picked" :items="items" disabled />
    </section>

    <section>
      <h3>只读</h3>
      <URadioGroup v-model="picked" :items="items" readonly />
    </section>

    <section>
      <h3>change 事件</h3>
      <URadioGroup v-model="eventPicked" :items="items" @change="lastItem = $event" />
      <p class="tip">最近选择：{{ lastItem?.label ?? '无' }}</p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { URadioGroup } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio-group/style'

const items = [
  { label: '快递', value: 'a' },
  { label: '自提', value: 'b' },
  { label: '配送', value: 'c' }
]

const cities = [
  { name: '北京', id: 1 },
  { name: '上海', id: 2 },
  { name: '深圳', id: 3 }
]

const picked = shallowRef('a')
const city = shallowRef<number>(2)
const eventPicked = shallowRef('a')
const lastItem = shallowRef<{ label: string }>()
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
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
