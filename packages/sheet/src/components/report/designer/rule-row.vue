<template>
  <div :class="cls.b">
    <span :class="cls.e('handle')" title="拖拽排序">≡</span>

    <div :class="cls.e('main')">
      <div :class="cls.e('condition')">
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

        <u-report-rule-preview :class="cls.e('preview')" :rule="rule" />
      </div>

      <div :class="cls.e('style')">
        <span :class="cls.e('style-label')">背景</span>
        <u-palette
          size="small"
          :model-value="rule.style.fill?.color ?? ''"
          @update:model-value="patchFillColor"
        />
        <span :class="cls.e('style-label')">字体</span>
        <u-palette
          size="small"
          :model-value="rule.style.font?.color ?? ''"
          @update:model-value="patchFontColor"
        />
        <u-button
          size="small"
          :class="cls.e('toggle')"
          :type="rule.style.font?.bold ? 'primary' : undefined"
          plain
          @click="toggleBold"
        >
          B
        </u-button>
        <u-button
          size="small"
          :class="cls.e('toggle')"
          :type="rule.style.font?.italic ? 'primary' : undefined"
          plain
          @click="toggleItalic"
        >
          I
        </u-button>
      </div>
    </div>

    <div :class="cls.e('actions')">
      <u-button size="small" text :disabled="index === 0" @click="emit('move-up')">↑</u-button>
      <u-button size="small" text :disabled="index >= total - 1" @click="emit('move-down')">
        ↓
      </u-button>
      <u-button size="small" text type="danger" @click="emit('remove')">删除</u-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UInput, UNumberInput, UPalette, USelect } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { ConditionalOperator, ConditionalRule, DatasetField } from '../../../report/types'
import {
  coerceValueForOperator,
  operatorsForFieldType,
  readBetweenValue,
  writeBetweenValue,
  isNumericFieldType
} from './conditional-rules/helpers'
import UReportRulePreview from './rule-preview.vue'

defineOptions({ name: 'UReportRuleRow' })

const props = defineProps<{
  rule: ConditionalRule
  fieldType: DatasetField['type']
  index: number
  total: number
}>()

const emit = defineEmits<{
  'update:rule': [rule: ConditionalRule]
  remove: []
  'move-up': []
  'move-down': []
}>()

const cls = bem('report-rule-row')

const operatorOptions = computed(() => operatorsForFieldType(props.fieldType))
const numericField = computed(() => isNumericFieldType(props.fieldType))

const betweenStart = computed(() => readBetweenValue(props.rule.value, 0, props.fieldType))
const betweenEnd = computed(() => readBetweenValue(props.rule.value, 1, props.fieldType))

const scalarNumber = computed((): number => {
  const raw = props.rule.value
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
})

function patchRule(patch: Partial<ConditionalRule>): void {
  emit('update:rule', { ...props.rule, ...patch })
}

function onOperator(operator: ConditionalOperator): void {
  patchRule({
    operator,
    value: coerceValueForOperator(operator, props.fieldType, props.rule.value)
  })
}

function patchValue(value: unknown): void {
  patchRule({ value })
}

function patchBetween(index: 0 | 1, next: number | string): void {
  patchRule({ value: writeBetweenValue(props.rule.value, index, next, props.fieldType) })
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
