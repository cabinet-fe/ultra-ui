<template>
  <div style="display: flex; justify-content: center">
    <CustomCard width="400px" title="使用">
      <div style="margin-bottom: 8px">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px">
          键盘导航: ↑↓ 选择选项，Enter 确认，Esc 关闭
        </div>
        <u-checkbox v-model="filterable">过滤</u-checkbox>
        <u-checkbox v-model="creatable">允许创建</u-checkbox>
      </div>
      <u-select v-model="selected" :filterable :creatable :options="options" />
      <u-number-input v-model="count" step />
    </CustomCard>

    <CustomCard width="400px" title="函数选项">
      <div>自动启用filter属性</div>

      <u-select v-model="selected" :options="optionsGetter" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, watchEffect } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { sleep } from 'cat-kit/fe'

const options = shallowRef<any[]>([])

const count = shallowRef(80)

watchEffect(() => {
  options.value = Array.from({ length: count.value }).map((_, i) => ({
    label: `选项${i}`,
    value: i + ''
  }))
})

const selected = shallowRef()

setTimeout(() => {
  selected.value = '1'
})

const filterable = shallowRef(true)
const creatable = shallowRef(true)

const optionsGetter = async (qs: string) => {
  if (!qs) return []
  await sleep(200)
  return options.value.filter(o => o.label.includes(qs))
}
</script>
