<template>
  <u-grid tag="form" :cols="{ xs: 1, sm: 2, xl: 3, default: 4 }">
    <slot />
  </u-grid>
</template>

<script lang="ts" setup generic="Data extends Record<string, any>">
import type { FormProps } from '@ui/types/components/form'
import { UGrid } from '../grid'
import { Validator } from '@ui/utils'
import { useFormComponent } from '@ui/compositions'
import { useSlots } from 'vue'

defineOptions({
  name: 'Form'
})

const props = defineProps<FormProps<Data>>()

const validator = new Validator({
  data: props.data,
  rules: props.rules
})

const injected = useFormComponent(true, props)!

const slots = useSlots()

defineExpose({
  /** 表单校验 */
  validate() {
    return validator.validate()
  }
})
</script>
