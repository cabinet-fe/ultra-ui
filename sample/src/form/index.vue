<template>
  <div>
    <u-form :data="data" :rules="rules" ref="formRef" label-width="200lx">
      <u-input field="aa" label="测试" tips="提示" />
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

const formRef = shallowRef<FormExposed>()

const validate = async () => {
  formRef.value?.validate()
}
</script>
