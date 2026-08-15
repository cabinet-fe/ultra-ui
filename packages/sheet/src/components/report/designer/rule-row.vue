<template>
  <div :class="cls.b">
    <span :class="cls.e('handle')" title="拖拽排序">⋮⋮</span>

    <div :class="cls.e('main')">
      <div :class="cls.e('when')">
        <span :class="cls.e('lead')">当</span>
        <u-select
          size="small"
          :class="cls.e('field-select')"
          :model-value="rule.field ?? SELF_FIELD_VALUE"
          :options="fieldOptions"
          @update:model-value="onEvalField"
        />
        <u-select
          size="small"
          :class="cls.e('operator')"
          :model-value="rule.operator"
          :options="operatorOptions"
          @update:model-value="onOperator"
        />
        <div :class="cls.e('value')">
          <template v-if="rule.operator === 'between'">
            <u-number-input
              v-if="numericField"
              size="small"
              :class="cls.e('between-input')"
              :model-value="betweenStart as number"
              @update:model-value="(v) => patchBetween(0, v ?? 0)"
            />
            <u-input
              v-else
              size="small"
              :class="cls.e('between-input')"
              :model-value="String(betweenStart)"
              @update:model-value="(v) => patchBetween(0, String(v ?? ''))"
            />
            <span :class="cls.e('between-sep')">至</span>
            <u-number-input
              v-if="numericField"
              size="small"
              :class="cls.e('between-input')"
              :model-value="betweenEnd as number"
              @update:model-value="(v) => patchBetween(1, v ?? 0)"
            />
            <u-input
              v-else
              size="small"
              :class="cls.e('between-input')"
              :model-value="String(betweenEnd)"
              @update:model-value="(v) => patchBetween(1, String(v ?? ''))"
            />
          </template>

          <u-input
            v-else-if="rule.operator === 'contains' || (!numericField && rule.operator === 'eq')"
            size="small"
            :class="cls.e('scalar-input')"
            :model-value="String(rule.value ?? '')"
            placeholder="比较值"
            @update:model-value="(v) => patchValue(String(v ?? ''))"
          />

          <u-number-input
            v-else
            size="small"
            :class="cls.e('scalar-input')"
            :model-value="scalarNumber"
            @update:model-value="(v) => patchValue(v ?? 0)"
          />
        </div>
        <span :class="cls.e('lead')">时</span>
      </div>

      <div :class="cls.e('then')">
        <span :class="cls.e('lead')">样式</span>
        <span title="背景">
          <u-palette
            size="small"
            :model-value="rule.style.fill?.color ?? ''"
            @update:model-value="patchFillColor"
          />
        </span>
        <span title="文字">
          <u-palette
            size="small"
            :model-value="rule.style.font?.color ?? ''"
            @update:model-value="patchFontColor"
          />
        </span>
        <u-button-group>
          <u-button
            size="small"
            :class="cls.e('toggle')"
            :type="rule.style.font?.bold ? 'primary' : undefined"
            plain
            title="加粗"
            @click="toggleBold"
          >
            B
          </u-button>
          <u-button
            size="small"
            :class="cls.e('toggle')"
            :type="rule.style.font?.italic ? 'primary' : undefined"
            plain
            title="斜体"
            @click="toggleItalic"
          >
            I
          </u-button>
        </u-button-group>
        <u-report-rule-preview :class="cls.e('preview')" :rule="rule" />

        <span :class="cls.e('lead')">应用到</span>
        <u-button-group>
          <u-button
            v-for="option in RULE_SCOPE_OPTIONS"
            :key="option.value"
            size="small"
            plain
            :type="(rule.scope ?? 'cell') === option.value ? 'primary' : undefined"
            :title="
              option.value === 'row' ? '染满物理输出行（交叉表会盖住同行所有列）' : '只改本格'
            "
            @click="onScope(option.value)"
          >
            {{ option.label }}
          </u-button>
        </u-button-group>
      </div>
    </div>

    <u-button size="small" text type="danger" :class="cls.e('remove')" @click="emit('remove')">
      删除
    </u-button>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UButtonGroup, UInput, UNumberInput, UPalette, USelect } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { ConditionalOperator, ConditionalRule, DatasetField } from '../../../report/types'
import {
  coerceValueForOperator,
  isNumericFieldType,
  operatorsForFieldType,
  readBetweenValue,
  resolveEvalFieldType,
  RULE_SCOPE_OPTIONS,
  ruleEvalFieldOptions,
  SELF_FIELD_VALUE,
  writeBetweenValue
} from './conditional-rules/helpers'
import UReportRulePreview from './rule-preview.vue'

defineOptions({ name: 'UReportRuleRow' })

const props = defineProps<{
  rule: ConditionalRule
  bindingField: string
  datasetFields: readonly DatasetField[]
}>()

const emit = defineEmits<{ 'update:rule': [rule: ConditionalRule]; remove: [] }>()

const cls = bem('report-rule-row')

const evalFieldType = computed(() =>
  resolveEvalFieldType(props.rule, props.bindingField, props.datasetFields)
)
const operatorOptions = computed(() => operatorsForFieldType(evalFieldType.value))
const numericField = computed(() => isNumericFieldType(evalFieldType.value))
const fieldOptions = computed(() => ruleEvalFieldOptions(props.bindingField, props.datasetFields))

const betweenStart = computed(() => readBetweenValue(props.rule.value, 0, evalFieldType.value))
const betweenEnd = computed(() => readBetweenValue(props.rule.value, 1, evalFieldType.value))

const scalarNumber = computed((): number => {
  const raw = props.rule.value
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
})

function patchRule(patch: Partial<ConditionalRule>): void {
  emit('update:rule', { ...props.rule, ...patch })
}

function onEvalField(field: string | undefined): void {
  const next: Partial<ConditionalRule> = {}
  if (!field) {
    next.field = undefined
  } else {
    next.field = field
  }
  const nextType = resolveEvalFieldType(
    { ...props.rule, ...next },
    props.bindingField,
    props.datasetFields
  )
  const operator = operatorsForFieldType(nextType)[0]?.value ?? props.rule.operator
  next.operator = operator
  next.value = coerceValueForOperator(operator, nextType, props.rule.value)
  patchRule(next)
}

function onScope(scope: 'cell' | 'row'): void {
  patchRule({ scope: scope === 'cell' ? undefined : scope })
}

function onOperator(operator: ConditionalOperator): void {
  patchRule({
    operator,
    value: coerceValueForOperator(operator, evalFieldType.value, props.rule.value)
  })
}

function patchValue(value: unknown): void {
  patchRule({ value })
}

function patchBetween(index: 0 | 1, next: number | string): void {
  patchRule({ value: writeBetweenValue(props.rule.value, index, next, evalFieldType.value) })
}

function patchFillColor(color: string): void {
  patchRule({ style: { ...props.rule.style, fill: color ? { color } : undefined } })
}

function patchFontColor(color: string): void {
  patchRule({
    style: { ...props.rule.style, font: { ...props.rule.style.font, color: color || undefined } }
  })
}

function toggleBold(): void {
  const bold = !props.rule.style.font?.bold
  patchRule({
    style: { ...props.rule.style, font: { ...props.rule.style.font, bold: bold || undefined } }
  })
}

function toggleItalic(): void {
  const italic = !props.rule.style.font?.italic
  patchRule({
    style: { ...props.rule.style, font: { ...props.rule.style.font, italic: italic || undefined } }
  })
}
</script>
