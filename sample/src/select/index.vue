<template>
  <div style="display: flex; justify-content: center">
    <CustomCard width="400px" title="使用">
      <u-checkbox v-model="filterable">过滤</u-checkbox>
      <u-select
        v-model="selected"
        :filterable="filterable"
        :options="options"
      />

      <div style="height: 10vh"></div>
    </CustomCard>

    <CustomCard width="400px" title="函数选项">
      <div>自动启用filter属性</div>

      <u-select v-model="selected" :options="optionsGetter" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { sleep } from 'cat-kit/fe'

const options = Array.from({ length: 200 }).map((_, i) => ({
  label: `选项${i}`,
  value: i
}))

const selected = shallowRef(20)

const filterable = shallowRef(false)

const optionsGetter = async (qs: string) => {
  if (!qs) return []
  await sleep(200)
  return options.filter(o => o.label.includes(qs))
}
</script>
