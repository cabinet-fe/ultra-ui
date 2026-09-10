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
      v-for="{ node, isFormItem, formItemProps, field, modelValue, renderKey } of getSlotsNodes()"
      :key="renderKey"
    >
      <u-form-item v-if="!isFormItem && field" v-bind="formItemProps">
        <component
          :is="node"
          :model-value="modelValue ?? o(model ?? {}).get(field)"
          @update:model-value="handleUpdateValue(field, $event)"
        />
        <div v-if="shouldShowModified(field)" :class="cls.e('data-before')">
          <span :class="cls.e('changed-tag')">{{ modifiedLabel }}</span>
          <component :is="createModifiedPreview(node, field)" />
        </div>
      </u-form-item>

      <component v-else :is="node" />
    </template>
  </u-grid>
</template>

<script lang="tsx" setup>
import { o } from '@cat-kit/core'
import { bem } from '@veltra/utils'
import { provideFormContext } from '@veltra/utils'
import { nextTick, toRef, useTemplateRef, type VNode } from 'vue'

import type { BreakCols, FormProps, _FormExposed, FormEmits } from '../../types'
import { UFormItem } from '../form-item'
import { UGrid } from '../grid'
import { isFieldModified } from './is-field-modified'
import { useFormFields } from './use-form-fields'
import { forkUnmountedVNode, useNodeInterceptor } from './use-node-interceptor'

defineOptions({ name: 'UForm' })

const props = withDefaults(defineProps<FormProps>(), { modifiedLabel: '变更前：' })

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
  shouldValidate,
  getBaselineModel
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

function handleFieldUpdate(field: string, value: any) {
  emit('field:update', field, value)
}

provideFormContext({
  formProps: props,
  registerField,
  unregisterField,
  validateFields: validate,
  shouldValidate,
  handleFieldUpdate
})

const { getSlotsNodes } = useNodeInterceptor()

function handleUpdateValue(field: string, value: any) {
  if (!props.model) return
  o(props.model).set(field, value)
}

function getBaselineFieldValue(field: string) {
  return o(getBaselineModel() ?? {}).get(field)
}

function createModifiedPreview(node: VNode, field: string) {
  return forkUnmountedVNode(node, { readonly: true, modelValue: getBaselineFieldValue(field) })
}

function shouldShowModified(field: string) {
  if (!props.showModified) return false
  const baseline = getBaselineModel()
  if (!baseline || !props.model) return false
  const current = o(props.model).get(field)
  const initial = o(baseline).get(field)
  return isFieldModified(current, initial)
}

defineExpose<_FormExposed>({ el: toRef(() => gridRef.value?.el), validate, clearValidate, reset })
</script>
