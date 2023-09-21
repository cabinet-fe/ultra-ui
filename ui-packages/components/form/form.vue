<template>
  <u-grid tag="form">
    <slot />
  </u-grid>
</template>

<script lang="ts" setup generic="Data extends Record<string, any>">
import { FormProps } from '@ui/types/components/form'
import { UGrid } from '../grid'
import { Validator } from '@ui/utils'
import { useFormComponent } from '@ui/compositions'

defineOptions({
  name: 'Form'
})

const props = defineProps<FormProps<Data>>()

const validator = new Validator({
  data: props.data,
  rules: props.rules
})

useFormComponent(true, props)

defineExpose({
  /** 表单校验 */
  validate() {
    return validator.validate()
  }
})
</script>
