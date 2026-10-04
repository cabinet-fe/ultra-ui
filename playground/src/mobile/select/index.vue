<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <USelect v-model="base" :options="options" @change="onChange" />
      <p class="tip">当前值：{{ base ?? '未选择' }}</p>
    </section>

    <section>
      <h3>禁用 / 只读 / text 兜底</h3>
      <USelect v-model="base" :options="options" disabled />
      <USelect v-model="base" :options="options" readonly />
      <USelect v-model="missing" :options="options" text="选项已被删除" />
    </section>

    <section>
      <h3>不可清除</h3>
      <USelect v-model="base" :options="options" :clearable="false" />
    </section>

    <section>
      <h3>自定义字段与插槽</h3>
      <USelect v-model="custom" :options="customOptions" label-key="name" value-key="id">
        <template #default="{ option }">
          <span class="custom-option">#{{ option.id }} {{ option.name }}</span>
        </template>
      </USelect>
    </section>

    <section>
      <h3>可搜索</h3>
      <USelect v-model="filtered" :options="options" filterable placeholder="搜索城市" />
    </section>

    <section>
      <h3>可创建</h3>
      <USelect v-model="created" :options="options" filterable creatable placeholder="输入并创建" />
      <p class="tip">当前值：{{ created ?? '未创建' }}</p>
    </section>

    <section>
      <h3>远程搜索</h3>
      <USelect v-model="remote" :options="remoteOptions" placeholder="远程搜索（带 300ms 延迟）" />
      <p class="tip">当前值：{{ remote ?? '未选择' }}</p>
    </section>

    <section>
      <h3>网格布局</h3>
      <USelect v-model="grid" :options="options" :grid="{ cols: 3 }" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { USelect } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/select/style'

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

const customOptions = [
  { id: 1, name: '苹果' },
  { id: 2, name: '香蕉' },
  { id: 3, name: '樱桃' }
]

const base = shallowRef('beijing')
const missing = shallowRef('removed')
const custom = shallowRef<number>()
const filtered = shallowRef()
const created = shallowRef()
const remote = shallowRef()
const grid = shallowRef('shenzhen')

/** 模拟远程接口：按查询串过滤并延迟返回 */
function remoteOptions(qs: string) {
  return new Promise<Record<string, any>[]>((resolve) => {
    setTimeout(() => resolve(options.filter((o) => o.label.includes(qs || ''))), 300)
  })
}

function onChange(option?: Record<string, any>) {
  console.log('change', option)
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

.custom-option {
  font-size: 13px;
}
</style>
