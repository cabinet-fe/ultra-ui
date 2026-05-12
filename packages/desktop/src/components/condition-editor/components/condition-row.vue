<template>
  <div :class="[cls.e('row'), bem.is('focused', focused)]">
    <!-- 字段选择 -->
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
      @update:model-value="onFieldChange"
    />

    <!-- 运算符选择 -->
    <u-select
      :class="cls.e('operator')"
      :model-value="item.operator"
      :options="operatorOptions"
      value-key="value"
      label-key="label"
      placeholder="运算符"
      :size="size"
      :disabled="disabled || readonly"
      :clearable="false"
      @update:model-value="onOperatorChange"
    />

    <!-- 值输入 -->
    <div :class="cls.e('value')">
      <template v-if="needValue">
        <input
          v-if="item.value.kind === 'constant'"
          ref="valueInputRef"
          :class="cls.e('value-input')"
          :value="item.value.value"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          @input="onValueInput"
          @keydown="onValueKeydown"
          @focus="focused = true"
          @blur="focused = false"
        />
        <span
          v-else
          :class="cls.e('value-chip')"
          tabindex="0"
          @click="onChipClick"
          @keydown.delete="onChipDelete"
        >
          <span :class="cls.e('value-chip-label')">{{ variableLabel }}</span>
          <span :class="cls.e('value-chip-close')" @click.stop="onChipDelete">×</span>
        </span>
      </template>
      <span v-else :class="cls.e('value-empty')">—</span>
    </div>

    <!-- 删除 -->
    <span v-if="!readonly" :class="cls.e('row-delete')" @click="emit('delete')">×</span>

    <!-- 结果指示 -->
    <span
      v-if="hasResult"
      :class="[cls.e('result'), cls.em('result', item._result ? 'pass' : 'fail')]"
    >
      {{ item._result ? '✓' : '✗' }}
    </span>
    <span v-else :class="[cls.e('result'), cls.em('result', 'none')]">—</span>
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, injectFormContext } from '@veltra/utils'
import { computed, ref, useTemplateRef } from 'vue'

import type { ConditionField, ConditionItem, ConditionValue } from '../../../types'
import { USelect } from '../../select'
import { getOperatorsByFieldType, type OperatorDef } from '../core/operators'

defineOptions({ name: 'ConditionRow' })

export interface MentionPayload {
  triggerDom: HTMLElement
  setValue: (val: ConditionValue) => void
}

const props = withDefaults(
  defineProps<{
    item: ConditionItem
    fields?: ConditionField[]
    size?: string
    disabled?: boolean
    readonly?: boolean
  }>(),
  {}
)

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const emit = defineEmits<{
  (e: 'update:item', item: ConditionItem): void
  (e: 'delete'): void
  (e: 'mention', payload: MentionPayload): void
}>()

const cls = bem('condition-editor')

const valueInputRef = useTemplateRef<HTMLInputElement>('valueInputRef')
const focused = ref(false)

const fieldOptions = computed(() =>
  (props.fields ?? []).map((f) => ({ label: f.label, value: f.value }))
)

const currentField = computed(() => props.fields?.find((f) => f.value === props.item.field))

const operatorOptions = computed(() => {
  if (!currentField.value) {
    return props.item.operator ? [{ label: props.item.operator, value: props.item.operator }] : []
  }
  return getOperatorsByFieldType(currentField.value.type)
})

const needValue = computed(() => {
  const ops = operatorOptions.value as OperatorDef[]
  const op = ops.find((o) => o.value === props.item.operator)
  return op?.needValue ?? true
})

const hasResult = computed(() => props.item._result !== undefined)

const placeholder = computed(() => (props.fields?.length ? '输入值或 @ 引用变量' : ''))

const variableLabel = computed(() => {
  if (props.item.value.kind !== 'variable') return ''
  return props.item.value.name
})

function onFieldChange(val: string) {
  const field = props.fields?.find((f) => f.value === val)
  const newItem: ConditionItem = {
    ...props.item,
    field: val,
    operator: field ? getOperatorsByFieldType(field.type)[0]!.value : 'eq',
    value: { kind: 'constant', value: '' }
  }
  emit('update:item', newItem)
}

function onOperatorChange(val: string) {
  const newItem: ConditionItem = {
    ...props.item,
    operator: val,
    value: { kind: 'constant', value: '' }
  }
  emit('update:item', newItem)
}

function onValueInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:item', {
    ...props.item,
    value: { kind: 'constant', value: val }
  })
}

function onValueKeydown(e: KeyboardEvent) {
  if (disabled.value || readonly.value) return
  if (e.key === '@' && valueInputRef.value) {
    e.preventDefault()
    emit('mention', {
      triggerDom: valueInputRef.value,
      setValue: (val: ConditionValue) => {
        emit('update:item', { ...props.item, value: val })
      }
    })
  }
}

function onChipClick() {
  if (disabled.value || readonly.value) return
  if (valueInputRef.value) {
    emit('mention', {
      triggerDom: valueInputRef.value,
      setValue: (val: ConditionValue) => {
        emit('update:item', { ...props.item, value: val })
      }
    })
  }
}

function onChipDelete() {
  emit('update:item', {
    ...props.item,
    value: { kind: 'constant', value: '' }
  })
}
</script>
