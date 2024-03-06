<template>
  <u-grid tag="form" :cols="{ xs: 1, sm: 2, xl: 3, default: 4 }">
    <slot />
  </u-grid>
</template>

<script lang="ts" setup generic="Rules extends Record<string, ValidateRule>">
import type { FormProps } from '@ui/types/components/form'
import type { ValidateRule } from '@ui/types/utils/form/validate'
import { UGrid } from '../grid'
import { Validator } from '@ui/utils'
import { useFormComponent } from '@ui/compositions'
import {  computed, inject } from 'vue'

defineOptions({
  name: 'Form'
})

const props = defineProps<FormProps<Rules>>()

const validator = computed(() => {
  return props.rules ? new Validator(props.rules) : undefined
})

const injected = useFormComponent(true, props)!

if (props.use) {
  // 注入useForm组合式方法中提供的表单方法和数据
  const formInjected = inject(props.use!)
}

defineExpose({
  /** 表单校验 */
  async validate(fields?: keyof Rules | (keyof Rules)[]) {
    const errors = await validator.value?.validate(props.data, fields)

    for (const _ in errors) {
      return false
    }
    return true
  }
})
</script>
