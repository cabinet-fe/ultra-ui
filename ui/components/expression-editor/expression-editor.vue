<template>
  <div :class="className">
    <VariablePicker ref="variable-picker" @select="handleVariableSelect" />

    <div :class="cls.e('tools')">
      <u-icon :size="16" @click="showVariablePicker" ref="variable-picker-btn">
        <Variable />
      </u-icon>
    </div>

    <div :class="cls.e('container')" ref="container" contenteditable></div>
  </div>
</template>

<script lang="ts" setup>
import type { ExpressionEditorProps, VariableItem } from '@ui/types'
import { bem } from '@ui/utils'
import { useTemplateRef, provide, computed } from 'vue'
import { ExpressionEditorDIKey } from './di'
import VariablePicker from './components/variable-picker.vue'
import { UIcon } from '../icon'
import { Variable } from 'icon-ultra'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { useEditor } from './use-editor'
import { cls } from './shared'

defineOptions({
  name: 'ExpressionEditor'
})

const props = withDefaults(defineProps<ExpressionEditorProps>(), {
  placeholder: '请输入表达式，输入@可插入变量'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])

const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('readonly', readonly.value)
  ]
})

const containerRef = useTemplateRef('container')
const variablePickerRef = useTemplateRef('variable-picker')
const variablePickerBtnRef = useTemplateRef('variable-picker-btn')

const editor = useEditor({
  disabled,
  readonly,
  container: containerRef,
  props,
  emit,
  variablePickerRef
})

// 显示变量选择器
function showVariablePicker() {
  if (disabled.value || readonly.value) return

  variablePickerRef.value?.open(variablePickerBtnRef.value?.$el)
}

// 处理变量选择
function handleVariableSelect(variable: VariableItem) {}

provide(ExpressionEditorDIKey, {
  cls,
  editorProps: props
})
</script>
