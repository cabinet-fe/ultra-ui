<template>
  <div>
    {{ data }}

    <u-form :data="data" :rules="rules" ref="formRef" label-width="200lx">
      <u-input field="aa" label="测试" tips="提示" />
      <u-input field="bb" label="测试" tips="提示" />
      <u-input field="cc" label="测试" tips="提示" />
      <u-input field="dd" label="测试" tips="提示" />
    </u-form>

    <u-button @click="validate">校验</u-button>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import type { FormExposed } from 'ultra-ui'
import { shallowReactive } from 'vue'

defineOptions({
  inheritAttrs: false
})

const data = shallowReactive({
  a: undefined
})

const rules = {
  a: {
    required: true
  }
}

const formRef = shallowRef<FormExposed<(keyof typeof rules)[]>>()

const validate = async () => {
  formRef.value?.validate(['a'])
}
</script>
