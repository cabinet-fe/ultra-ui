<template>
  <u-form :model="model">
    <u-input field="a" label="a"></u-input>
    <u-input field="b" label="b"></u-input>
    <u-input field="nest.a" label="嵌套" readonly></u-input>
  </u-form>

  <u-button @click="changeModelData">变更模型数据</u-button>
</template>

<script lang="ts" setup>
import { FormModel } from '@ui/components'
import { reactive } from 'vue'

const model = new FormModel({
  a: { required: true },
  b: {},
  'nest.a': { required: true, value: '1' }
})

const newModelData = reactive({
  a: '6',
  b: '3',
  nest: { a: '1' }
})

function changeModelData() {
  model.setProxyData(newModelData as any)
}
</script>

<style lang="scss" scoped></style>
