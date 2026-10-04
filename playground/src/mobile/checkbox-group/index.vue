<template>
  <div class="demo">
    <section>
      <h3>基础</h3>
      <UCheckboxGroup v-model="checked" :items="items" value-key="id" label-key="name" />
      <p class="tip">当前值：{{ checked }}</p>
    </section>

    <section>
      <h3>block 整行铺开</h3>
      <UCheckboxGroup v-model="checked" :items="items" block value-key="id" label-key="name" />
    </section>

    <section>
      <h3>禁用</h3>
      <UCheckboxGroup v-model="checked" :items="items" disabled value-key="id" label-key="name" />
    </section>

    <section>
      <h3>只读（标签展示）</h3>
      <UCheckboxGroup v-model="checked" :items="items" readonly value-key="id" label-key="name" />
    </section>

    <section>
      <h3>只读（空值）</h3>
      <UCheckboxGroup v-model="empty" :items="items" readonly value-key="id" label-key="name" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UCheckboxGroup } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/checkbox-group/style'

const items = [
  { name: '苹果', id: 1 },
  { name: '香蕉', id: 2 },
  { name: '樱桃', id: 3 }
]

const checked = shallowRef<number[]>([1, 3])
const empty = shallowRef<number[]>([])
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

.tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
