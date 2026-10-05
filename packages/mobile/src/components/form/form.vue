<template>
  <form ref="formRef" :class="[cls.b, bem.is('readonly', readonly)]" @submit.prevent>
    <div v-if="props.title || $slots.header" :class="cls.e('title')">
      <slot name="header">{{ props.title }}</slot>
    </div>

    <template
      v-for="{ node, isFormItem, formItemProps, field, modelValue, renderKey } of getSlotsNodes()"
      :key="renderKey"
    >
      <UFormItem v-if="!isFormItem && field" v-bind="formItemProps">
        <component
          :is="node"
          :model-value="modelValue ?? o(model ?? {}).get(field)"
          @update:model-value="handleUpdateValue(field, $event)"
        />
        <div v-if="shouldShowModified(field)" :class="cls.e('data-before')">
          <span :class="cls.e('changed-tag')">{{ modifiedLabel }}</span>
          {{ formatModifiedValue(getBaselineFieldValue(field)) }}
        </div>
      </UFormItem>

      <component v-else :is="node" />
    </template>
  </form>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { FORM_EMPTY_CONTENT, provideFormContext } from '@veltra/utils'
import { nextTick, toRef, useTemplateRef } from 'vue'

import { bem } from '../../shared/bem'
import type { FormEmits, FormProps, _FormExposed } from '../../types/form'
import { UFormItem } from '../form-item'
import { isFieldModified } from './is-field-modified'
import { useFormFields } from './use-form-fields'
import { useNodeInterceptor } from './use-node-interceptor'

defineOptions({ name: 'UForm' })

const props = withDefaults(defineProps<FormProps>(), { modifiedLabel: '变更前：' })

const emit = defineEmits<FormEmits>()

defineSlots<{
  /** 分组标题插槽，优先于 title prop */
  header?: () => any
  default?: () => any
}>()

const cls = bem('form')
const formItemCls = bem('form-item')
const formRef = useTemplateRef<HTMLFormElement>('formRef')

const {
  validate: runValidate,
  clearValidate,
  reset,
  registerField,
  unregisterField,
  shouldValidate,
  getBaselineModel
} = useFormFields({ props })

/** 校验失败后滚动到第一条错误提示，保证小屏上错误可见 */
async function validate(keys?: string[]) {
  const valid = await runValidate(keys)
  if (!valid) {
    await nextTick()

    formRef.value
      ?.querySelector(`.${formItemCls.e('error-text')}`)
      ?.scrollIntoView({ block: 'center' })
  }
  return valid
}

provideFormContext({
  formProps: props,
  registerField,
  unregisterField,
  validateFields: validate,
  shouldValidate,
  handleFieldUpdate(field: string, value: any) {
    emit('field:update', field, value)
  }
})

const { getSlotsNodes } = useNodeInterceptor()

function handleUpdateValue(field: string, value: any) {
  if (!props.model) return
  o(props.model).set(field, value)
}

function getBaselineFieldValue(field: string) {
  return o(getBaselineModel() ?? {}).get(field)
}

function shouldShowModified(field: string) {
  if (!props.showModified) return false
  const baseline = getBaselineModel()
  if (!baseline || !props.model) return false
  const current = o(props.model).get(field)
  const initial = o(baseline).get(field)
  return isFieldModified(current, initial)
}

/** 变更前值按纯文本呈现（移动端密度），不克隆只读控件 */
function formatModifiedValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return FORM_EMPTY_CONTENT
  if (Array.isArray(value)) return value.join('、')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

defineExpose<_FormExposed>({ el: toRef(() => formRef.value), validate, clearValidate, reset })
</script>
