<template>
  <div>
    <CustomCard width="400px" title="使用">
      <div style="margin-bottom: 8px">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px">
          键盘导航: ↑↓ 选择选项，Enter 确认，Esc 关闭
        </div>
        <u-checkbox v-model="filterable">过滤</u-checkbox>
        <u-checkbox v-model="creatable">允许创建</u-checkbox>
      </div>
      <u-select v-model="selected" :filterable :creatable :options="options" />
    </CustomCard>

    <!-- <CustomCard width="400px" title="函数选项">
      <div>自动启用filter属性</div>

      <u-select v-model="selected" :options="optionsGetter" />
    </CustomCard>

    <CustomCard width="400px" title="网格布局">
      <u-select v-model="selected" :options="options" filterable value-key="value" :grid="{ cols: 4, gap: 10 }"
        v-slot="{ option }">
        <div style="height: 80px; text-align: center">
          <div>
            <u-icon :size="30">
              <Monitor />
            </u-icon>
          </div>
          {{ option?.label }}
        </div>
      </u-select>
    </CustomCard>

    <u-form :model="model">
      <u-input label="选项" field="options"></u-input>
      <u-select label="选择" field="select" value-key="value" :clearable="false" :options="options1" />
    </u-form> -->
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, watchEffect } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { sleep } from 'cat-kit/fe'
import { Monitor } from '@ultra/icon'
import { FormModel } from 'ultra-ui'

const options = shallowRef<any[]>([])

const count = shallowRef(80)

watchEffect(() => {
  options.value = Array.from({ length: count.value }).map((_, i) => ({
    label: `选项${i}`,
    value: i + ''
  }))
})

const model = new FormModel({
  select: { value: 12 },
  options: {
    value: '40,100',
    validator(value, data) {
      if (value.includes('，')) {
        return '请使用英文标点分隔'
      }
      return ''
    }
  }
})

const options1 = shallowRef(
  model.data.options
    ?.split(',')
    .map(i => {
      const n = +i
      return { label: i, value: n }
    })
    .filter(i => !isNaN(i.value))
)

model.onChange((field, val) => {
  field === 'select' && console.log(field, val)
})

setTimeout(() => {
  model.setData({ options: '10', select: 10 })
  options1.value = [{ value: 10, label: '10' }]
}, 500)

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
