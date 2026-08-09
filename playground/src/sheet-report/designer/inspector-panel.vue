<template>
  <aside class="inspector-panel">
    <header class="inspector-panel__header">
      <h3 class="inspector-panel__title">绑定检查器</h3>
      <p v-if="cell" class="inspector-panel__addr">{{ formatCellAddress(cell) }}</p>
    </header>

    <template v-if="binding && cell">
      <p class="inspector-panel__placeholder">
        {{ formatBindingPlaceholder(binding, resolveFieldLabel) }}
      </p>

      <section class="inspector-panel__section">
        <div class="inspector-panel__label">语义角色</div>
        <u-radio-group
          size="small"
          :items="roleOptions"
          :model-value="currentRole"
          @update:model-value="onRole"
        />
      </section>

      <section class="inspector-panel__section">
        <div class="inspector-panel__label">聚合方式</div>
        <u-radio-group
          size="small"
          :items="aggregateOptions"
          :model-value="binding.aggregate"
          @update:model-value="onAggregate"
        />
      </section>

      <section class="inspector-panel__section">
        <div class="inspector-panel__label">排序</div>
        <u-radio-group
          size="small"
          :items="sortOptions"
          :model-value="binding.sort ?? 'none'"
          @update:model-value="onSort"
        />
      </section>

      <section class="inspector-panel__section">
        <div class="inspector-panel__label">条件格式</div>
        <ul v-if="binding.conditionalRules?.length" class="inspector-panel__rules">
          <li v-for="(rule, index) in binding.conditionalRules" :key="index">
            {{ formatRule(rule) }}
          </li>
        </ul>
        <p v-else class="inspector-panel__hint">未配置</p>
        <u-button size="small" plain @click="emit('open-rules')">编辑规则</u-button>
      </section>

      <section class="inspector-panel__section">
        <div class="inspector-panel__label">父分组</div>
        <p class="inspector-panel__hint">解析结果：{{ resolvedLeftParentLabel }}</p>
      </section>

      <footer class="inspector-panel__footer">
        <u-button size="small" type="danger" plain @click="emit('remove')">删除绑定</u-button>
      </footer>
    </template>

    <p v-else class="inspector-panel__empty">选中已绑定单元格以查看与编辑报表语义。</p>
  </aside>
</template>

<script lang="ts" setup>
import type { CellAddress } from '@veltra/sheet-core'
import { computed } from 'vue'

import {
  aggregateDefaultExpand,
  formatBindingPlaceholder,
  formatCellAddress,
  resolveReportRole
} from '../binding'
import type {
  ConditionalRule,
  ReportAggregate,
  ReportBinding,
  ReportRole,
  ReportSort
} from '../types'
import { REPORT_ROLE_OPTIONS, roleBindingDefaults } from './role'

defineOptions({ name: 'SheetReportInspectorPanel' })

const props = defineProps<{
  cell: CellAddress | null
  binding: ReportBinding | null
  resolvedLeftParentLabel: string
  resolveFieldLabel?: (datasetId: string, fieldName: string) => string
}>()

const emit = defineEmits<{ patch: [patch: Partial<ReportBinding>]; remove: []; 'open-rules': [] }>()

const roleOptions = REPORT_ROLE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))

const aggregateOptions = [
  { value: 'select' as const, label: '明细' },
  { value: 'group' as const, label: '分组' },
  { value: 'sum' as const, label: '求和' },
  { value: 'avg' as const, label: '平均' },
  { value: 'count' as const, label: '计数' }
]

const sortOptions = [
  { value: 'none' as const, label: '无' },
  { value: 'asc' as const, label: '升序' },
  { value: 'desc' as const, label: '降序' }
]

const operatorLabels: Record<string, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  eq: '=',
  between: '介于',
  contains: '包含'
}

const currentRole = computed((): ReportRole => {
  if (!props.binding) return 'detail'
  return resolveReportRole(props.binding)
})

function formatRule(rule: ConditionalRule): string {
  return `${operatorLabels[rule.operator] ?? rule.operator} ${String(rule.value)}`
}

function onRole(role: ReportRole): void {
  emit('patch', roleBindingDefaults(role))
}

function onAggregate(value: ReportAggregate): void {
  emit('patch', { aggregate: value, expand: aggregateDefaultExpand(value) })
}

function onSort(value: ReportSort): void {
  emit('patch', { sort: value })
}
</script>

<style scoped lang="scss">
.inspector-panel {
  display: flex;
  flex-direction: column;
  width: 260px;
  min-width: 260px;
  padding: 12px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 10px;
  background: var(--u-bg-color, #fff);
  box-sizing: border-box;
  overflow: auto;
}

.inspector-panel__header {
  margin-bottom: 8px;
}

.inspector-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.inspector-panel__addr {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.inspector-panel__placeholder {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--u-color-primary, #2563eb);
  word-break: break-all;
}

.inspector-panel__section {
  margin-bottom: 12px;
}

.inspector-panel__label {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--u-text-color-secondary, #64748b);
}

.inspector-panel__hint {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.inspector-panel__rules {
  margin: 0 0 6px;
  padding-left: 16px;
  font-size: 12px;
  color: var(--u-text-color-regular, #334155);
}

.inspector-panel__footer {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--u-border-color-light, #f1f5f9);
  display: flex;
  justify-content: flex-end;
}

.inspector-panel__empty {
  margin: 0;
  font-size: 13px;
  color: var(--u-text-color-secondary, #64748b);
  line-height: 1.5;
}
</style>
