<template>
  <u-drawer :model-value="row !== null" title="行详情" @update:model-value="emit('close')">
    <div v-if="row" class="smart-table__detail">
      <div v-for="field in fields" :key="field.id" class="smart-table__detail-row">
        <label class="smart-table__detail-label">{{ field.name }}</label>
        <div class="smart-table__detail-control">
          <u-input
            v-if="field.type === 'text'"
            :model-value="textValue(field.id)"
            @update:model-value="setText(field.id, $event)"
          />
          <u-number-input
            v-else-if="field.type === 'number'"
            :model-value="numberValue(field.id)"
            @update:model-value="setNumber(field.id, $event)"
          />
          <u-select
            v-else-if="field.type === 'select'"
            :model-value="textValue(field.id)"
            :options="optionsOf(field)"
            clearable
            @update:model-value="setText(field.id, $event)"
          />
          <u-multi-select
            v-else-if="field.type === 'multi-select'"
            :model-value="listValue(field.id)"
            :options="optionsOf(field)"
            @update:model-value="setList(field.id, $event)"
          />
          <u-date-picker
            v-else-if="field.type === 'date'"
            :model-value="textValue(field.id)"
            value-format="yyyy-MM-dd"
            @update:model-value="setDate(field.id, $event)"
          />
          <u-checkbox
            v-else-if="field.type === 'checkbox'"
            :model-value="boolValue(field.id)"
            @update:model-value="set(field.id, $event)"
          />
          <u-slider
            v-else-if="field.type === 'progress'"
            :model-value="numberValue(field.id) ?? 0"
            @update:model-value="set(field.id, $event)"
          />
          <u-textarea
            v-else
            :model-value="listValue(field.id).join('\n')"
            :rows="3"
            :placeholder="field.type === 'image' ? '每行一个图片链接' : '每行一个成员名'"
            @update:model-value="setLines(field.id, $event)"
          />
        </div>
      </div>
    </div>
  </u-drawer>
</template>

<script lang="ts" setup>
import type { CellValue, TableField, TableRow } from './types'

/**
 * 行详情侧边栏：展开记录显示全部字段值，按字段类型用 desktop 表单组件编辑；
 * 改动经 update 事件交给宿主写回（writeCell → 网格模型 + doc，防抖持久化），
 * 网格侧同一文档反向可见。
 */
const props = defineProps<{ fields: TableField[]; row: TableRow | null }>()

const emit = defineEmits<{ close: []; update: [fieldId: string, value: CellValue] }>()

function optionsOf(field: TableField): { label: string; value: string }[] {
  return (field.options ?? []).map((option) => ({ label: option, value: option }))
}

function textValue(fieldId: string): string {
  const value = props.row?.values[fieldId]
  return typeof value === 'string' ? value : ''
}

function numberValue(fieldId: string): number | undefined {
  const value = props.row?.values[fieldId]
  return typeof value === 'number' ? value : undefined
}

function listValue(fieldId: string): string[] {
  const value = props.row?.values[fieldId]
  return Array.isArray(value) ? value : []
}

function boolValue(fieldId: string): boolean {
  return props.row?.values[fieldId] === true
}

function set(fieldId: string, value: CellValue): void {
  emit('update', fieldId, value)
}

function setText(fieldId: string, value: string): void {
  set(fieldId, value === '' ? null : value)
}

function setNumber(fieldId: string, value: number | undefined): void {
  set(fieldId, value ?? null)
}

function setDate(fieldId: string, value: string | number | Date | undefined): void {
  set(fieldId, typeof value === 'string' && value !== '' ? value : null)
}

function setList(fieldId: string, value: (string | number)[]): void {
  const items = value.map(String)
  set(fieldId, items.length > 0 ? items : null)
}

/** member/image 无候选列表，按行编辑（每行一个） */
function setLines(fieldId: string, text: string): void {
  setList(
    fieldId,
    text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
  )
}
</script>

<style lang="scss" scoped>
.smart-table__detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.smart-table__detail-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.smart-table__detail-label {
  flex: none;
  width: 76px;
  line-height: 32px;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.smart-table__detail-control {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;

  > :deep(.u-checkbox) {
    margin-bottom: 4px;
  }
}
</style>
