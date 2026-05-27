<template>
  <div :class="cls.e('row')">
    <u-select
      :class="cls.e('field')"
      :model-value="item.field"
      :options="fieldOptions"
      value-key="value"
      label-key="label"
      placeholder="字段"
      :size="size"
      :disabled="disabled || readonly"
      :clearable="false"
      filterable
      @update:model-value="onFieldChange"
    />

    <u-select
      :class="cls.e('operator')"
      :model-value="item.operator"
      :options="operatorOptions"
      value-key="value"
      label-key="label"
      placeholder="运算符"
      :size="size"
      :disabled="disabled || readonly || !currentField"
      :clearable="false"
      @update:model-value="onOperatorChange"
    />

    <div :class="cls.e('value')">
      <template v-if="!needValue">
        <span :class="cls.e('value-empty')">—</span>
      </template>

      <template v-else-if="enumValueOptions">
        <u-select
          :model-value="constantValue"
          :options="enumValueOptions"
          value-key="value"
          label-key="label"
          placeholder="选择值"
          :size="size"
          :disabled="disabled || readonly"
          :clearable="false"
          @update:model-value="onConstantChange"
        />
      </template>

      <template v-else-if="booleanValueOptions">
        <u-select
          :model-value="constantValue"
          :options="booleanValueOptions"
          value-key="value"
          label-key="label"
          placeholder="选择值"
          :size="size"
          :disabled="disabled || readonly"
          :clearable="false"
          @update:model-value="onConstantChange"
        />
      </template>

      <template v-else-if="item.value.kind === 'variable'">
        <span
          ref="chipRef"
          :class="cls.e('value-chip')"
          tabindex="0"
          :title="`变量：${item.value.name}`"
          @click="onChipClick"
          @keydown.delete="onChipDelete"
        >
          <span :class="cls.e('value-chip-label')">{{ item.value.name }}</span>
          <span :class="cls.e('value-chip-close')" @click.stop="onChipDelete">
            <u-icon><Close /></u-icon>
          </span>
        </span>
      </template>

      <template v-else>
        <input
          ref="valueInputRef"
          :class="cls.e('value-input')"
          :type="inputType"
          :value="constantValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          @input="onValueInput"
          @keydown="onValueKeydown"
        />
      </template>
    </div>

    <button
      v-if="!readonly"
      type="button"
      :class="cls.e('row-delete')"
      :disabled="disabled"
      title="删除条件"
      @click="emit('delete')"
    >
      <u-icon><Delete /></u-icon>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { Close, Delete } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, useTemplateRef } from 'vue'

import type { ConditionField, ConditionLeaf, ConditionValue } from '../../../types'
import { UIcon } from '../../icon'
import { USelect } from '../../select'
import { getOperatorsByFieldType, type OperatorDef } from '../core/operators'

defineOptions({ name: 'ConditionRow' })

export interface MentionPayload {
  triggerDom: HTMLElement
  setValue: (val: ConditionValue) => void
}

const props = withDefaults(
  defineProps<{
    item: ConditionLeaf
    fields?: ConditionField[]
    size?: 'small' | 'default' | 'large'
    disabled?: boolean
    readonly?: boolean
  }>(),
  { size: 'default' }
)

const emit = defineEmits<{
  (e: 'update:item', item: ConditionLeaf): void
  (e: 'delete'): void
  (e: 'mention', payload: MentionPayload): void
}>()

const cls = bem('condition-editor')

const valueInputRef = useTemplateRef<HTMLInputElement>('valueInputRef')
const chipRef = useTemplateRef<HTMLElement>('chipRef')

const fieldOptions = computed(() =>
  (props.fields ?? []).map((f) => ({ label: f.label, value: f.value }))
)

const currentField = computed(() => props.fields?.find((f) => f.value === props.item.field))

const operatorOptions = computed<OperatorDef[]>(() => {
  if (!currentField.value) {
    return props.item.operator
      ? [{ label: props.item.operator, value: props.item.operator, needValue: true }]
      : []
  }
  return getOperatorsByFieldType(currentField.value.type)
})

const currentOperator = computed(() =>
  operatorOptions.value.find((o) => o.value === props.item.operator)
)

const needValue = computed(() => currentOperator.value?.needValue ?? true)

const constantValue = computed(() =>
  props.item.value.kind === 'constant' ? props.item.value.value : ''
)

/** 枚举字段的可选值（仅在非 `in` 等多值运算符下展开为下拉） */
const enumValueOptions = computed(() => {
  if (!currentField.value || currentField.value.type !== 'enum') return null
  if (props.item.operator === 'in') return null
  return currentField.value.enumOptions ?? []
})

const booleanValueOptions = computed(() => {
  if (!currentField.value || currentField.value.type !== 'boolean') return null
  if (!needValue.value) return null
  return [
    { label: '是', value: 'true' },
    { label: '否', value: 'false' }
  ]
})

const inputType = computed(() => {
  const type = currentField.value?.type
  if (type === 'number') return 'number'
  if (type === 'date') return 'date'
  return 'text'
})

const placeholder = computed(() => {
  if (props.item.operator === 'in') return '多个值用逗号分隔'
  if (!props.fields?.length) return ''
  return '输入值或 @ 引用变量'
})

function emitUpdate(patch: Partial<ConditionLeaf>) {
  emit('update:item', { ...props.item, ...patch })
}

function onFieldChange(val: string) {
  const field = props.fields?.find((f) => f.value === val)
  const nextOps = field ? getOperatorsByFieldType(field.type) : []
  const nextOp = nextOps[0]?.value ?? 'eq'
  emit('update:item', {
    ...props.item,
    field: val,
    operator: nextOp,
    value: { kind: 'constant', value: '' }
  })
}

function onOperatorChange(val: string) {
  emitUpdate({
    operator: val,
    value: { kind: 'constant', value: '' }
  })
}

function onValueInput(e: Event) {
  emitUpdate({ value: { kind: 'constant', value: (e.target as HTMLInputElement).value } })
}

function onConstantChange(val: string) {
  emitUpdate({ value: { kind: 'constant', value: val } })
}

function onValueKeydown(e: KeyboardEvent) {
  if (props.disabled || props.readonly) return
  if (e.key === '@' && valueInputRef.value) {
    e.preventDefault()
    emit('mention', {
      triggerDom: valueInputRef.value,
      setValue: (val) => emitUpdate({ value: val })
    })
  }
}

function onChipClick() {
  if (props.disabled || props.readonly) return
  const dom = chipRef.value
  if (!dom) return
  emit('mention', {
    triggerDom: dom,
    setValue: (val) => emitUpdate({ value: val })
  })
}

function onChipDelete() {
  if (props.disabled || props.readonly) return
  emitUpdate({ value: { kind: 'constant', value: '' } })
}
</script>
