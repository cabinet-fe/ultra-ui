<template>
  <u-grid tag="form">
    <slot />
  </u-grid>
</template>

<script lang="ts" setup generic="Data extends Record<string, any>">
import { FormProps } from './form.type'
import { UGrid } from '../grid'
import { Validator } from '@ui/utils'

defineOptions({
  name: 'Form'
})

const props = defineProps<FormProps<Data>>()

// const validate = new Validator({
//   data: props.data,
//   rules: props.rules
// })

defineExpose({
  /** 表单校验 */
  // validate
})
</script>
