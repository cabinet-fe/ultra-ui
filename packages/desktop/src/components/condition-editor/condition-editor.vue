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
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import type { ConditionEditorProps, ConditionExpression } from '../../types'
import VariablePicker from '../expression-editor/components/variable-picker.vue'
import ConditionGroup from './components/condition-group.vue'
import type { MentionPayload } from './components/condition-row.vue'
import { createEmptyGroup, evaluate } from './core/evaluator'

defineOptions({ name: 'ConditionEditor' })

const props = withDefaults(defineProps<ConditionEditorProps>(), {
  fields: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: ConditionExpression): void
  (e: 'evaluate', results: ConditionExpression): void
}>()

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
  props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) : createEmptyGroup()
)

function serialize(): ConditionExpression {
  function clean(group: ConditionExpression): ConditionExpression {
    return {
      logic: group.logic,
      conditions: group.conditions.map((c) => {
        const { _result, ...rest } = c
        return rest
      }),
      groups: group.groups.map(clean).filter((g) => g.conditions.length > 0 || g.groups.length > 0)
    }
  }
  return clean(JSON.parse(JSON.stringify(rootGroup.value)))
}

function emitUpdate() {
  emit('update:modelValue', serialize())
}

function runEvaluate() {
  if (!props.data) return
  const cloned = JSON.parse(JSON.stringify(rootGroup.value)) as ConditionExpression
  const result = evaluate(cloned, props.data)
  rootGroup.value = result
  emit('evaluate', serialize())
}

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

function onGroupUpdate(group: ConditionExpression) {
  rootGroup.value = group
  emitUpdate()
  void nextTick(() => runEvaluate())
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    const current = serialize()
    if (JSON.stringify(v) === JSON.stringify(current)) return
    rootGroup.value = JSON.parse(JSON.stringify(v))
  }
)

watch(
  () => props.data,
  () => runEvaluate(),
  { deep: true }
)

function onKeydown(e: KeyboardEvent) {
  if (disabled.value || readonly.value) return
  if (pickerVisible.value) {
    const handled = pickerRef.value?.handleKeydown(e)
    if (handled) {
      e.preventDefault()
      return
    }
  }
}
</script>
