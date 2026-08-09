<template>
  <u-dialog v-model="visible" title="条件格式" width="420px" @close="onClose">
    <div class="conditional-rules-dialog">
      <p class="conditional-rules-dialog__hint">命中规则后叠加样式；多条规则按顺序合并。</p>

      <ul v-if="draftRules.length" class="conditional-rules-dialog__list">
        <li v-for="(rule, index) in draftRules" :key="index" class="conditional-rules-dialog__item">
          <span>{{ formatRule(rule) }}</span>
          <u-button size="small" type="danger" plain @click="removeRule(index)">删除</u-button>
        </li>
      </ul>
      <p v-else class="conditional-rules-dialog__empty">暂无规则</p>

      <section class="conditional-rules-dialog__form">
        <div class="conditional-rules-dialog__row">
          <span class="conditional-rules-dialog__label">运算符</span>
          <u-select v-model="operator" size="small" :options="operatorOptions" />
        </div>
        <div class="conditional-rules-dialog__row">
          <span class="conditional-rules-dialog__label">比较值</span>
          <u-input v-model="valueInput" size="small" placeholder="如 100" />
        </div>
        <div class="conditional-rules-dialog__row">
          <span class="conditional-rules-dialog__label">背景色</span>
          <u-input v-model="fillColor" size="small" placeholder="#FEE2E2" />
        </div>
        <u-button size="small" plain @click="addRule">添加规则</u-button>
      </section>
    </div>

    <template #footer>
      <u-button size="small" @click="visible = false">取消</u-button>
      <u-button size="small" type="primary" @click="confirm">确定</u-button>
    </template>
  </u-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

import type { ConditionalOperator, ConditionalRule } from '../types'

defineOptions({ name: 'SheetReportConditionalRulesDialog' })

const props = defineProps<{ modelValue: boolean; rules: ConditionalRule[] }>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [rules: ConditionalRule[]]
}>()

const operatorOptions = [
  { value: 'gt' as const, label: '大于' },
  { value: 'gte' as const, label: '大于等于' },
  { value: 'lt' as const, label: '小于' },
  { value: 'lte' as const, label: '小于等于' },
  { value: 'eq' as const, label: '等于' }
]

const operatorLabels: Record<ConditionalOperator, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  eq: '=',
  between: '介于',
  contains: '包含'
}

const draftRules = ref<ConditionalRule[]>([])
const operator = ref<ConditionalOperator>('gt')
const valueInput = ref('100')
const fillColor = ref('#FEE2E2')

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    draftRules.value = cloneRules(props.rules)
  }
)

function formatRule(rule: ConditionalRule): string {
  return `${operatorLabels[rule.operator]} ${String(rule.value)} → 背景 ${rule.style.fill?.color ?? '—'}`
}

function parseValueInput(): number | null {
  const parsed = Number(valueInput.value)
  return Number.isFinite(parsed) ? parsed : null
}

function addRule(): void {
  const value = parseValueInput()
  if (value === null) return
  draftRules.value = [
    ...draftRules.value,
    { operator: operator.value, value, style: { fill: { color: fillColor.value || '#FEE2E2' } } }
  ]
}

function removeRule(index: number): void {
  draftRules.value = draftRules.value.filter((_, i) => i !== index)
}

function cloneRules(rules: ConditionalRule[]): ConditionalRule[] {
  return rules.map((rule) => ({
    operator: rule.operator,
    value: rule.value,
    style: { ...rule.style, fill: rule.style.fill ? { ...rule.style.fill } : undefined }
  }))
}

function confirm(): void {
  emit('save', cloneRules(draftRules.value))
  visible.value = false
}

function onClose(): void {
  visible.value = false
}
</script>

<style scoped lang="scss">
.conditional-rules-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conditional-rules-dialog__hint {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.conditional-rules-dialog__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.conditional-rules-dialog__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--u-fill-color-light, #f8fafc);
  font-size: 12px;
}

.conditional-rules-dialog__empty {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.conditional-rules-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--u-border-color-light, #f1f5f9);
}

.conditional-rules-dialog__row {
  display: grid;
  grid-template-columns: 64px 1fr;
  align-items: center;
  gap: 8px;
}

.conditional-rules-dialog__label {
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}
</style>
