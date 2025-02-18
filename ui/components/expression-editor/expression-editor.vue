<template>
  <div :class="className">
    <VariablePicker ref="variable-picker" />

    <div :class="cls.e('tools')">
      <u-icon :size="16"><Variable /></u-icon>
    </div>

    <div :class="cls.e('container')" ref="editorRef" contenteditable></div>
  </div>
</template>

<script lang="ts" setup>
import type { ExpressionEditorProps } from '@ui/types'
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

const props = defineProps<ExpressionEditorProps>()

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

const editorRef = useTemplateRef('editorRef')
// const variablePickerRef = useTemplateRef('variable-picker')

useEditor({
  disabled,
  readonly,
  container: editorRef,
  props,
  emit
})

provide(ExpressionEditorDIKey, {
  cls,
  editorProps: props
})
</script>

<style lang="scss">
.variable-tag {
  display: inline-block;
  background-color: var(--u-primary-color-1);
  color: var(--u-primary-color);
  padding: 0 4px;
  border-radius: 4px;
  margin: 0 2px;
  user-select: none;
  cursor: default;
}

.ultra-expression-editor {
  position: relative;
  border: 1px solid var(--u-border-color);
  border-radius: 4px;
  padding: 4px;
  min-height: 32px;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.3s;

  &:focus-within {
    border-color: var(--u-primary-color);
    box-shadow: 0 0 0 2px var(--u-primary-color-1);
  }

  &.is-disabled {
    background-color: var(--u-disabled-bg);
    cursor: not-allowed;
  }

  &.is-readonly {
    background-color: var(--u-disabled-bg);
    cursor: default;
  }

  &__tools {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 8px;
    color: var(--u-text-color-secondary);

    .u-icon {
      cursor: pointer;

      &:hover {
        color: var(--u-primary-color);
      }
    }
  }

  &__container {
    outline: none;
    min-height: 24px;
    padding-right: 32px;
  }
}
</style>
