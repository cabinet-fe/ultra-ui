<template>
  <div class="demo">
    <section>
      <h3>基础用法（确定/取消）</h3>
      <UMultiSelect v-model="base" :options="options" @change="onChange" />
      <p class="tip">当前值：{{ base.length ? base.join('、') : '未选择' }}</p>
    </section>

    <section>
      <h3>限制展示数量</h3>
      <UMultiSelect v-model="base" :options="options" :visibility-limit="1" />
    </section>

    <section>
      <h3>最多选 3 项</h3>
      <UMultiSelect v-model="limited" :options="options" :max="3" />
    </section>

    <section>
      <h3>可搜索</h3>
      <UMultiSelect v-model="searched" :options="options" filterable placeholder="搜索城市" />
    </section>

    <section>
      <h3>可创建</h3>
      <UMultiSelect v-model="created" :options="options" filterable creatable />
      <p class="tip">当前值：{{ created.length ? created.join('、') : '未创建' }}</p>
    </section>

    <section>
      <h3>禁用 / 只读</h3>
      <UMultiSelect v-model="base" :options="options" disabled />
      <UMultiSelect v-model="base" :options="options" readonly />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UMultiSelect } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/multi-select/style'

const options = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
  { label: '深圳', value: 'shenzhen' },
  { label: '杭州', value: 'hangzhou' },
  { label: '成都', value: 'chengdu' },
  { label: '武汉', value: 'wuhan' },
  { label: '南京', value: 'nanjing' }
]

const base = shallowRef<string[]>(['beijing', 'shanghai'])
const limited = shallowRef<string[]>([])
const searched = shallowRef<string[]>([])
const created = shallowRef<string[]>([])

function onChange(selected: Record<string, any>[]) {
  console.log('change', selected)
}
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

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.tip {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
