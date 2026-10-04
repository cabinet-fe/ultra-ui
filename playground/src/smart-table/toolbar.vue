<template>
  <div class="smart-table__toolbar">
    <u-input v-model="state.keyword" placeholder="搜索关键字" class="smart-table__toolbar-search" />

    <!-- 筛选：多条件组合，改动即时生效 -->
    <u-dropdown trigger="click" width="400px">
      <template #trigger>
        <u-button size="small">
          筛选{{ state.filters.length > 0 ? `（${state.filters.length}）` : '' }}
        </u-button>
      </template>
      <template #content>
        <div class="smart-table__filter">
          <div v-if="state.filters.length === 0" class="smart-table__filter-empty">
            尚无筛选条件，点击「添加条件」按字段过滤行
          </div>
          <div v-for="(cond, i) in state.filters" :key="i" class="smart-table__filter-row">
            <u-select
              :model-value="cond.fieldId"
              :options="fieldOptions"
              placeholder="字段"
              @update:model-value="onCondField(cond, $event)"
            />
            <u-select
              :model-value="cond.op"
              :options="condOpOptions(cond)"
              :clearable="false"
              @update:model-value="onCondOp(cond, $event)"
            />
            <u-select
              v-if="condValueIsOption(cond)"
              :model-value="cond.value"
              :options="condValueOptions(cond)"
              placeholder="选项值"
              @update:model-value="cond.value = $event ?? ''"
            />
            <u-input
              v-else-if="condValueIsInput(cond)"
              v-model="cond.value"
              :placeholder="condValuePlaceholder(cond)"
            />
            <u-button size="small" @click="state.filters.splice(i, 1)">删除</u-button>
          </div>
          <div class="smart-table__filter-actions">
            <u-button size="small" :disabled="fields.length === 0" @click="addCondition">
              添加条件
            </u-button>
            <u-button
              size="small"
              :disabled="state.filters.length === 0"
              @click="state.filters.splice(0)"
            >
              清空
            </u-button>
          </div>
        </div>
      </template>
    </u-dropdown>

    <!-- 排序：字段 + 升/降序 -->
    <span class="smart-table__toolbar-label">排序</span>
    <u-select
      :model-value="state.sort?.fieldId"
      :options="fieldOptions"
      placeholder="不排序"
      class="smart-table__toolbar-picker"
      @update:model-value="onSortField"
    />
    <u-segment
      v-if="state.sort"
      :model-value="state.sort.dir"
      :items="dirItems"
      @update:model-value="onSortDir"
    />

    <!-- 分组：按字段分段显示 -->
    <span class="smart-table__toolbar-label">分组</span>
    <u-select
      :model-value="state.groupFieldId"
      :options="groupOptions"
      :clearable="false"
      class="smart-table__toolbar-picker"
      @update:model-value="state.groupFieldId = $event ?? ''"
    />

    <!-- 字段隐藏：列显隐切换（至少保留一列） -->
    <u-dropdown trigger="click" width="200px">
      <template #trigger>
        <u-button size="small">字段</u-button>
      </template>
      <template #content>
        <div class="smart-table__fields">
          <label v-for="field in fields" :key="field.id" class="smart-table__fields-item">
            <u-checkbox
              :model-value="!state.hiddenFieldIds.includes(field.id)"
              :disabled="isLastVisible(field)"
              @update:model-value="toggleField(field.id, $event === true)"
            />
            <span class="smart-table__fields-name">{{ field.name }}</span>
          </label>
        </div>
      </template>
    </u-dropdown>
  </div>
</template>

<script lang="ts">
import type { FieldType } from './types'

/** 筛选操作符：匹配语义见 index.vue 的视图管线 */
export type FilterOp =
  | 'contains'
  | 'notContains'
  | 'eq'
  | 'ne'
  | 'gt'
  | 'lt'
  | 'empty'
  | 'notEmpty'
  | 'checked'
  | 'unchecked'

/** 单条筛选条件（值统一存字符串，按字段类型解析比较） */
export interface FilterCondition {
  fieldId: string
  op: FilterOp
  value: string
}

/** 排序态：按字段升/降序；null 为不排序 */
export interface SortState {
  fieldId: string
  dir: 'asc' | 'desc'
}

/** 工具栏五能力状态（搜索/筛选/排序/分组/字段隐藏），父级持有、就地修改 */
export interface ToolbarState {
  keyword: string
  filters: FilterCondition[]
  sort: SortState | null
  groupFieldId: string
  hiddenFieldIds: string[]
}

/** 各字段类型可用的筛选操作符（顺序即下拉顺序） */
const OPS_BY_TYPE: Record<FieldType, FilterOp[]> = {
  text: ['contains', 'notContains', 'empty', 'notEmpty'],
  number: ['gt', 'lt', 'eq', 'empty', 'notEmpty'],
  select: ['eq', 'ne', 'empty', 'notEmpty'],
  'multi-select': ['contains', 'notContains', 'empty', 'notEmpty'],
  date: ['eq', 'lt', 'gt', 'empty', 'notEmpty'],
  checkbox: ['checked', 'unchecked'],
  progress: ['gt', 'lt', 'eq', 'empty', 'notEmpty'],
  member: ['contains', 'notContains', 'empty', 'notEmpty'],
  image: ['contains', 'notContains', 'empty', 'notEmpty']
}

const OP_LABELS: Record<FilterOp, string> = {
  contains: '包含',
  notContains: '不包含',
  eq: '等于',
  ne: '不等于',
  gt: '大于',
  lt: '小于',
  empty: '为空',
  notEmpty: '不为空',
  checked: '已勾选',
  unchecked: '未勾选'
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

import type { TableField } from './types'

/**
 * 网格工具栏：搜索（关键字过滤行）、筛选（按字段条件过滤）、排序（按字段升/降序）、
 * 分组（按字段分段显示）、字段隐藏（列显隐切换）五项能力的 UI 与状态。状态对象由
 * 父级持有并传入（同一引用就地修改），视图管线（过滤/排序/分组后的行集与列集）在
 * index.vue 消费本状态计算。
 */
const props = defineProps<{ fields: TableField[]; state: ToolbarState }>()

const fieldOptions = computed(() => props.fields.map((f) => ({ label: f.name, value: f.id })))

const groupOptions = computed(() => [{ label: '不分组', value: '' }, ...fieldOptions.value])

const dirItems = [
  { label: '升序', value: 'asc' },
  { label: '降序', value: 'desc' }
]

// ─── 筛选 ────────────────────────────────────────────────

function fieldOf(cond: FilterCondition): TableField | undefined {
  return props.fields.find((f) => f.id === cond.fieldId)
}

function condOpOptions(cond: FilterCondition) {
  const ops = OPS_BY_TYPE[fieldOf(cond)?.type ?? 'text']!
  return ops.map((op) => ({ label: OP_LABELS[op], value: op }))
}

/** 单选字段的条件值用选项下拉，其余用文本输入 */
function condValueIsOption(cond: FilterCondition): boolean {
  return fieldOf(cond)?.type === 'select'
}

/** 需要值输入的操作符（为空/勾选类无值） */
function condValueIsInput(cond: FilterCondition): boolean {
  return !['empty', 'notEmpty', 'checked', 'unchecked'].includes(cond.op)
}

function condValueOptions(cond: FilterCondition) {
  return (fieldOf(cond)?.options ?? []).map((option) => ({ label: option, value: option }))
}

function condValuePlaceholder(cond: FilterCondition): string {
  const type = fieldOf(cond)?.type
  if (type === 'number' || type === 'progress') return '输入数值'
  if (type === 'date') return 'YYYY-MM-DD'
  return '输入关键字'
}

/** 换字段：操作符重置为该类型第一个，值清空 */
function onCondField(cond: FilterCondition, fieldId?: string): void {
  cond.fieldId = fieldId ?? ''
  const type = fieldOf(cond)?.type ?? 'text'
  cond.op = OPS_BY_TYPE[type]![0]!
  cond.value = ''
}

function onCondOp(cond: FilterCondition, op: unknown): void {
  cond.op = op as FilterOp
}

function addCondition(): void {
  const field = props.fields[0]
  if (!field) return
  props.state.filters.push({ fieldId: field.id, op: OPS_BY_TYPE[field.type]![0]!, value: '' })
}

// ─── 排序 ────────────────────────────────────────────────

function onSortField(fieldId?: string): void {
  props.state.sort = fieldId ? { fieldId, dir: props.state.sort?.dir ?? 'asc' } : null
}

function onSortDir(dir: unknown): void {
  if (props.state.sort) props.state.sort.dir = dir === 'desc' ? 'desc' : 'asc'
}

// ─── 字段隐藏 ────────────────────────────────────────────

function toggleField(fieldId: string, visible: boolean): void {
  const hidden = props.state.hiddenFieldIds
  if (visible) {
    const i = hidden.indexOf(fieldId)
    if (i >= 0) hidden.splice(i, 1)
  } else {
    hidden.push(fieldId)
  }
}

/** 唯一可见字段不可再隐藏（网格至少保留一列） */
function isLastVisible(field: TableField): boolean {
  const visibleCount = props.fields.filter((f) => !props.state.hiddenFieldIds.includes(f.id)).length
  return visibleCount <= 1 && !props.state.hiddenFieldIds.includes(field.id)
}
</script>

<style lang="scss" scoped>
.smart-table__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.smart-table__toolbar-search {
  width: 200px;
}

.smart-table__toolbar-label {
  font-size: 12px;
  color: var(--u-text-color-second);
}

.smart-table__toolbar-picker {
  width: 130px;
}

.smart-table__filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}

.smart-table__filter-empty {
  font-size: 12px;
  color: var(--u-text-color-second);
}

.smart-table__filter-row {
  display: flex;
  align-items: center;
  gap: 6px;

  > :deep(.u-select) {
    width: 96px;
    flex: none;
  }

  > :deep(.u-input) {
    flex: 1;
    min-width: 0;
  }
}

.smart-table__filter-actions {
  display: flex;
  gap: 8px;
}

.smart-table__fields {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  max-height: 280px;
  overflow: auto;
}

.smart-table__fields-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px;
  cursor: pointer;
}

.smart-table__fields-name {
  font-size: 13px;
  color: var(--u-text-color-main);
}
</style>
