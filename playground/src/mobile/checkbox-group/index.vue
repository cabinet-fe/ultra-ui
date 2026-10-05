<template>
  <div class="demo">
    <section>
      <h3>基础（列表行式）</h3>
      <UCheckboxGroup v-model="checked" :items="items" value-key="id" label-key="name" />
      <p class="tip">当前值：{{ checked }}</p>
    </section>

    <section>
      <h3>行间分隔线</h3>
      <UCheckboxGroup v-model="checked" :items="items" divider value-key="id" label-key="name" />
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

    <section>
      <h3>表单行内</h3>
      <UForm :model="form">
        <UCheckboxGroup label="通知渠道" field="channels" :items="channels" divider />
      </UForm>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UCheckboxGroup, UForm } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/checkbox-group/style'

const items = [
  { name: '苹果', id: 1 },
  { name: '香蕉', id: 2 },
  { name: '樱桃', id: 3 }
]

const channels = [
  { label: '站内信', value: 'inbox' },
  { label: '短信', value: 'sms' },
  { label: '邮件', value: 'email' }
]

const checked = shallowRef<number[]>([1, 3])
const empty = shallowRef<number[]>([])
const form = reactive({ channels: ['inbox'] as string[] })
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
