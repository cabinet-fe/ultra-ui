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

    <CustomCard width="480px" title="同步冗余文案（@update:text）">
      <div style="font-size: 12px; color: #666; margin-bottom: 8px">
        v-model 绑定 code；展示文案由 options 推导，经 @update:text 写入冗余 text（勿再
        v-model:text）。预设 code 会在回显时把旧文案同步为最新 label。
      </div>
      <u-select
        v-model="dictForm.code"
        :options="dictOptions"
        clearable
        @update:text="dictForm.text = $event"
      />
      <div style="margin-top: 12px; display: flex; gap: 24px; font-size: 13px">
        <div>code：{{ dictForm.code ?? '—' }}</div>
        <div>text：{{ dictForm.text ?? '—' }}</div>
      </div>
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
import { sleep } from '@cat-kit/core'
import { reactive, shallowRef, watchEffect } from 'vue'

import CustomCard from '../card/custom-card.vue'

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

/** 字典回显：code 已匹配 options，text 初始为旧文案，组件会 @update:text 同步最新 label */
const dictForm = reactive<{ code?: string; text?: string }>({ code: 'beijing', text: '旧文案' })

const dictOptions = [
  { label: '北京（最新）', value: 'beijing' },
  { label: '上海（最新）', value: 'shanghai' },
  { label: '广州（最新）', value: 'guangzhou' }
]

const optionsGetter = async (qs: string) => {
  if (!qs) return []
  await sleep(200)
  return options.value.filter((o) => o.label.includes(qs))
}
</script>
