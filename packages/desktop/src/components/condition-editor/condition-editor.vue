<template>
  <div :class="className" @keydown="onKeydown">
    <ConditionGroup
      :group="rootGroup"
      :fields="props.fields"
      :size="size"
      :disabled="disabled"
      :readonly="readonly"
      @update:group="onGroupUpdate"
      @mention="onMention"
    />

    <VariablePicker
      ref="pickerRef"
      :visible="pickerVisible"
      :trigger-dom="pickerTriggerDom"
      :variables="props.variables"
      :filter="pickerFilter"
      :selectable-levels="'leaf'"
      @select="onPickerSelect"
      @dismiss="onPickerDismiss"
      @update:visible="onPickerVisibleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, injectFormContext } from '@veltra/utils'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'

import type { ConditionEditorProps, ConditionExpression } from '../../types'
import VariablePicker from '../expression-editor/components/variable-picker.vue'
import ConditionGroup from './components/condition-group.vue'
import type { MentionPayload } from './components/condition-row.vue'
import { createEmptyGroup } from './core/evaluator'

defineOptions({ name: 'UConditionEditor' })

const props = withDefaults(defineProps<ConditionEditorProps>(), { fields: () => [] })

const emit = defineEmits<{ (e: 'update:modelValue', value: ConditionExpression): void }>()

const cls = bem('condition-editor')
const { formProps } = injectFormContext()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const className = computed(() => [
  cls.b,
  cls.m(size.value),
  bem.is('disabled', disabled.value),
  bem.is('readonly', readonly.value)
])

const rootGroup = shallowRef<ConditionExpression>(
  props.modelValue ? clone(props.modelValue) : createEmptyGroup()
)

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function onGroupUpdate(group: ConditionExpression) {
  rootGroup.value = group
  emit('update:modelValue', clone(group))
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) {
      rootGroup.value = createEmptyGroup()
      return
    }
    if (JSON.stringify(v) === JSON.stringify(rootGroup.value)) return
    rootGroup.value = clone(v)
  }
)

// ── VariablePicker ──

const pickerRef = useTemplateRef<{ handleKeydown: (e: KeyboardEvent) => boolean }>('pickerRef')
const pickerVisible = shallowRef(false)
const pickerTriggerDom = shallowRef<HTMLElement | undefined>(undefined)
const pickerFilter = shallowRef('')
const mentionTarget = shallowRef<MentionPayload | null>(null)

function onMention(payload: MentionPayload) {
  if (disabled.value || readonly.value) return
  mentionTarget.value = payload
  pickerTriggerDom.value = payload.triggerDom
  pickerFilter.value = ''
  pickerVisible.value = true
}

function onPickerSelect(item: { label: string; value: string }) {
  mentionTarget.value?.setValue({ kind: 'variable', name: item.value })
  pickerVisible.value = false
  mentionTarget.value = null
}

function onPickerDismiss() {
  pickerVisible.value = false
  mentionTarget.value = null
}

function onPickerVisibleChange(v: boolean) {
  if (!v) {
    pickerVisible.value = false
    mentionTarget.value = null
  }
}

function onKeydown(e: KeyboardEvent) {
  if (disabled.value || readonly.value) return
  if (pickerVisible.value) {
    const handled = pickerRef.value?.handleKeydown(e)
    if (handled) {
      e.preventDefault()
    }
  }
}
</script>
