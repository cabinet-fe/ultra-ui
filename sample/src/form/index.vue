<template>
  <u-form :data="data" :rules="rules" ref="formRef">
    <u-input field="aa" label="测试" tips="提示" />
  </u-form>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import type { FormExposed } from 'ultra-ui'

const data = {
  a: undefined
}

const rules = {
  a: {
    required: true
  }
}

const formRef = shallowRef<FormExposed>()

const validate = async () => {
  formRef?.value?.validate()
}

validate()
</script>
