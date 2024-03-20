<template>
  <div>
    <u-form size="large" readonly disabled :model="model" label-width="100px">
      <u-input field="name" label="姓名" tips="四个字以内" />
      <u-number-input field="age" label="年龄" />
      <u-input field="phone" label="手机" />
      <u-input field="email" label="邮箱" />
    </u-form>

    <u-button @click="model.validate()">校验</u-button>
    <u-button @click="model.clearValidate()">重置</u-button>

    {{ model.data }}
  </div>
</template>

<script lang="ts" setup>
import { field, FormModel } from 'ultra-ui/components'
import { shallowRef } from 'vue'

const model = new FormModel({
  name: { maxLen: 4, required: true },
  age: field<string>({ required: '年龄是必填的' }),
  aa: { required: true },
  phone: {
    validator(value) {
      if (!value) return ''
      if (/^1[1-9]{10}$/.test(value)) return ''
      return '你得输入一个手机号'
    }
  },
  email: {
    match: [
      /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/,
      '这个时候你得输入一个邮箱'
    ]
  }
})
</script>
