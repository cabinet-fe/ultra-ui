<template>
  <u-grid tag="form" :cols="{ xs: 1, sm: 2, xl: 3, default: 4 }">
    <slot />
  </u-grid>
</template>

<script lang="ts" setup generic="Rules extends Record<string, ValidateRule>">
import type { FormProps } from '@ui/types/components/form'
import type { ValidateRule, Data } from '@ui/types/utils/form/validate'
import { UGrid } from '../grid'
import { Validator } from '@ui/utils'
import { useFormComponent } from '@ui/compositions'
import { useSlots } from 'vue'
import { computed } from '@vue/runtime-core'

defineOptions({
  name: 'Form'
})

const props = defineProps<FormProps<Rules>>()

const validator = computed(() => {
  return props.rules ? new Validator(props.rules) : undefined
})

const injected = useFormComponent(true, props)!

const slots = useSlots()

defineExpose({
  /** 表单校验 */
  validate(fields?: keyof Rules | keyof Rules[]) {
    return validator.value?.validate(props.data, fields)
  }
})
</script>
