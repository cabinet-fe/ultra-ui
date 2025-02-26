<template>
  <div>
    <CustomCard title="完全演示">
      {{ propsModel.data }}
      <u-form style="display: flex; gap: 12px" :model="propsModel">
        <u-checkbox label="多选" field="multiple" @change="value = undefined" />
        <u-checkbox label="严格模式" field="strict" />
        <u-checkbox label="过滤" field="filterable" />
        <u-checkbox label="只读" field="readonly" />
        <u-checkbox label="禁用" field="disabled" />
        <u-input
          label="分隔符"
          field="separator"
          style="width: 200px"
          @native:input="value = undefined"
        />
      </u-form>

      <u-cascade
        v-model="value"
        v-bind="propsModel.data"
        :data="data"
        label-key="name"
        value-key="code"
      />

      <div>值：{{ value }}</div>

      <u-button type="primary" @click="handleClick">获取默认值</u-button>
    </CustomCard>
  </div>
</template>
<script lang="ts" setup>
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { area } from './area.js'
import { FormModel } from '@ui/components'

const value = shallowRef()

const propsModel = new FormModel({
  multiple: { value: false },
  strict: { value: false },
  filterable: { value: false },
  separator: { value: '/' },
  readonly: { value: false },
  disabled: { value: false }
})

const data = shallowRef<any[]>([])

const disabledNode = data => {
  return data.code % 2 === 0
}

// 模拟回显
setTimeout(() => {}, 300)

setTimeout(() => {
  data.value = area
}, 500)

function handleClick() {
  if (propsModel.data.multiple) {
    value.value = [
      '11',
      '1101',
      '110101',
      '110102',
      '110105',
      '110106',
      '110107',
      '110108',
      '110109',
      '110111',
      '110112',
      '110113',
      '110114',
      '110115',
      '110116',
      '110117',
      '110118',
      '110119',
      '110120',
      '110156',
      '130203',
      '130204',
      '120102',
      '120103',
      '120104',
      '120105'
    ]
  } else {
    value.value = '11/1101/110105'
  }
}
</script>
