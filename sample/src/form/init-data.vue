<template>
  <u-form :model="model" show-initial-data>
    <u-input label="姓名" field="name" />
    <u-select label="年级" field="grade" :options="gradeList" />
    <u-checkbox label="是否在校" field="isInSchool" />
  </u-form>
</template>

<script lang="ts" setup>
import { FormModel } from '@ui/components'

const model = new FormModel({
  name: {},
  grade: {},
  isInSchool: {}
})

const gradeList = [
  { label: '一年级', value: '1' },
  { label: '二年级', value: '2' },
  { label: '三年级', value: '3' },
  { label: '四年级', value: '4' },
  { label: '五年级', value: '5' },
  { label: '六年级', value: '6' }
]

setTimeout(() => {
  const data = {
    name: '张三',
    grade: '1',
    isInSchool: true
  }
  model.setData(data)
}, 1000)
</script>
