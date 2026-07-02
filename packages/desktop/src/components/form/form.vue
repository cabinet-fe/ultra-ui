<template>
  <u-grid
    tag="form"
    ref="grid"
    @submit.prevent
    gap="0 12px"
    :cols="cols || breakpointCols"
    :class="[cls.b, bem.is('readonly', readonly)]"
  >
    <template
      v-for="{ node, isFormItem, formItemProps, field, modelValue } of getSlotsNodes()"
      :key="node.key"
    >
      <u-form-item v-if="!isFormItem && field" v-bind="formItemProps">
        <component
          :is="node"
          :model-value="modelValue ?? o(model ?? {}).get(field)"
          @update:model-value="handleUpdateValue(field, $event)"
        />
      </u-form-item>

      <component v-else :is="node" />
    </template>
  </u-grid>
</template>

<script lang="tsx" setup>
import { o } from '@cat-kit/core'
import { bem } from '@veltra/utils'
import { provideFormContext } from '@veltra/utils'
import { nextTick, toRef, useTemplateRef } from 'vue'

import type { BreakCols, FormProps, _FormExposed, FormEmits } from '../../types'
import { UFormItem } from '../form-item'
import { UGrid } from '../grid'
import { useFormFields } from './use-form-fields'
import { useNodeInterceptor } from './use-node-interceptor'

defineOptions({ name: 'UForm' })

const props = defineProps<FormProps>()

const emit = defineEmits<FormEmits>()

defineSlots<{ default(props?: { data: Record<string, any> | undefined }): any }>()

const cls = bem('form')
const formItemCls = bem('form-item')
const gridRef = useTemplateRef('grid')

const breakpointCols: BreakCols = { xs: 1, md: 2, lg: 3, xl: 4, default: 4 }

const {
  validate: runValidate,
  clearValidate,
  reset,
  registerField,
  unregisterField,
  shouldValidate
} = useFormFields({ props })

async function validate(keys?: string[]) {
  const valid = await runValidate(keys)
  if (!valid) {
    await nextTick()

    gridRef.value?.el
      ?.querySelector(`.${formItemCls.e('error-text')}`)
      ?.scrollIntoView({ block: 'center' })
  }
  return valid
}

function handleFieldChange(field: string, value: any) {
  emit('field:change', field, value)
}

provideFormContext({
  formProps: props,
  registerField,
  unregisterField,
  validateFields: validate,
  shouldValidate,
  handleFieldChange
})

const { getSlotsNodes } = useNodeInterceptor()

function handleUpdateValue(field: string, value: any) {
  if (!props.model) return
  o(props.model).set(field, value)
}

defineExpose<_FormExposed>({ el: toRef(() => gridRef.value?.el), validate, clearValidate, reset })
</script>
