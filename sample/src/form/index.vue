<template>
  <div>
    <u-form :model="model" label-width="100px">
      <u-input field="aa" label="测试a" tips="提示" />
      <u-input field="bb" label="测试b" />
      <u-input field="cc" label="测试c" />
      <u-input field="dd" label="测试d" />
    </u-form>

    <u-button @click="model.validate()">校验</u-button>
    <u-button @click="model.clearValidate()">重置</u-button>

    {{ model.data }}
  </div>
</template>

<script lang="ts" setup>
import { field, FormModel } from 'ultra-ui/components'

const model = new FormModel({
  aa: {
    value: '',
    required: true,
    maxLen: 4
  },

  bb: field<string>({ required: true }),
  cc: { required: true },
  dd: { required: true }
})
</script>
