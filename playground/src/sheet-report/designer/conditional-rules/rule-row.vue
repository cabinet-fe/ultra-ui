<template>
  <div class="conditional-rule-row">
    <span class="conditional-rule-row__handle" title="拖拽排序">≡</span>

    <div class="conditional-rule-row__main">
      <div class="conditional-rule-row__condition">
        <u-select
          size="small"
          class="conditional-rule-row__operator"
          :model-value="rule.operator"
          :options="operatorOptions"
          @update:model-value="onOperator"
        />

        <div class="conditional-rule-row__value">
          <template v-if="rule.operator === 'between'">
            <u-number-input
              v-if="numericField"
              size="small"
              class="conditional-rule-row__between-input"
              :model-value="betweenStart as number"
              @update:model-value="(v) => patchBetween(0, v ?? 0)"
            />
            <u-input
              v-else
              size="small"
              class="conditional-rule-row__between-input"
              :model-value="String(betweenStart)"
              @update:model-value="(v) => patchBetween(0, String(v ?? ''))"
            />
            <span class="conditional-rule-row__between-sep">至</span>
            <u-number-input
              v-if="numericField"
              size="small"
              class="conditional-rule-row__between-input"
              :model-value="betweenEnd as number"
              @update:model-value="(v) => patchBetween(1, v ?? 0)"
            />
            <u-input
              v-else
              size="small"
              class="conditional-rule-row__between-input"
              :model-value="String(betweenEnd)"
              @update:model-value="(v) => patchBetween(1, String(v ?? ''))"
            />
          </template>

          <u-input
            v-else-if="rule.operator === 'contains' || (!numericField && rule.operator === 'eq')"
            size="small"
            :model-value="String(rule.value ?? '')"
            placeholder="比较值"
            @update:model-value="(v) => patchValue(String(v ?? ''))"
          />

          <u-number-input
            v-else
            size="small"
            :model-value="scalarNumber"
            @update:model-value="(v) => patchValue(v ?? 0)"
          />
        </div>
      </div>

      <div class="conditional-rule-row__style">
        <span class="conditional-rule-row__style-label">背景</span>
        <u-palette
          size="small"
          :model-value="rule.style.fill?.color ?? ''"
          @update:model-value="patchFillColor"
        />
        <span class="conditional-rule-row__style-label">字体</span>
        <u-palette
          size="small"
          :model-value="rule.style.font?.color ?? ''"
          @update:model-value="patchFontColor"
        />
        <u-button
          size="small"
          class="conditional-rule-row__toggle"
          :type="rule.style.font?.bold ? 'primary' : undefined"
          plain
          @click="toggleBold"
        >
          B
        </u-button>
        <u-button
          size="small"
          class="conditional-rule-row__toggle"
          :type="rule.style.font?.italic ? 'primary' : undefined"
          plain
          @click="toggleItalic"
        >
          I
        </u-button>
      </div>
    </div>

    <div class="conditional-rule-row__actions">
      <u-button size="small" text :disabled="index === 0" @click="emit('move-up')">↑</u-button>
      <u-button size="small" text :disabled="index >= total - 1" @click="emit('move-down')">
        ↓
      </u-button>
      <u-button size="small" text type="danger" @click="emit('remove')">删除</u-button>
    </div>

    <conditional-rule-preview class="conditional-rule-row__preview" :rule="rule" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import type { ConditionalOperator, ConditionalRule, DatasetField } from '../../types'
import {
  coerceValueForOperator,
  operatorsForFieldType,
  readBetweenValue,
  writeBetweenValue,
  isNumericFieldType
} from './helpers'
import ConditionalRulePreview from './rule-preview.vue'

defineOptions({ name: 'SheetReportConditionalRuleRow' })

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

<style scoped lang="scss">
.conditional-rule-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--u-border-color-light, #f1f5f9);
  border-radius: 8px;
  background: var(--u-bg-color, #fff);
}

.conditional-rule-row__handle {
  flex: none;
  width: 20px;
  margin-top: 4px;
  color: var(--u-text-color-secondary, #94a3b8);
  font-size: 16px;
  line-height: 1;
  cursor: grab;
  user-select: none;
  text-align: center;

  &:active {
    cursor: grabbing;
  }
}

.conditional-rule-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conditional-rule-row__condition {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.conditional-rule-row__operator {
  width: 108px;
  flex: none;
}

.conditional-rule-row__value {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 120px;
}

.conditional-rule-row__between-input {
  width: 88px;
  flex: none;
}

.conditional-rule-row__between-sep {
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.conditional-rule-row__style {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.conditional-rule-row__style-label {
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.conditional-rule-row__toggle {
  min-width: 28px;
  padding-inline: 6px;
}

.conditional-rule-row__preview {
  flex: none;
  margin-top: 2px;
}

.conditional-rule-row__actions {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
