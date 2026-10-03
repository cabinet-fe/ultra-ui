<template>
  <div class="smart-table__kanban">
    <div class="smart-table__kanban-bar">
      <span class="smart-table__kanban-label">分组字段</span>
      <u-select
        v-if="selectFields.length"
        v-model="groupFieldId"
        :options="groupOptions"
        :clearable="false"
        class="smart-table__kanban-select"
      />
      <span v-else class="smart-table__kanban-hint">
        暂无单选字段：新增一个「单选」类型字段后即可按它分组
      </span>
    </div>

    <u-kanban v-if="groupField" :columns="columns" disabled class="smart-table__kanban-board">
      <template #card="{ card }">
        <div class="smart-table__card">
          <div class="smart-table__card-title">{{ card.title }}</div>
          <div v-for="line in card.lines" :key="line.label" class="smart-table__card-line">
            {{ line.label }}：{{ line.text }}
          </div>
        </div>
      </template>
    </u-kanban>
  </div>
</template>

<script lang="ts" setup>
import type { KanbanColumnItem } from '@veltra/desktop'
import { computed, ref, watch } from 'vue'

import type { CellValue, TableField, TableRow } from './types'

/**
 * 看板视图：按所选单选字段把记录分组为多列卡片（只读分组展示，
 * 拖拽禁用——本阶段不做拖拽改值），分组字段可切换，缺省取第一个单选字段。
 */
const props = defineProps<{ fields: TableField[]; rows: TableRow[] }>()

/** 可作为分组依据的单选字段 */
const selectFields = computed(() => props.fields.filter((f) => f.type === 'select'))

const groupOptions = computed(() => selectFields.value.map((f) => ({ label: f.name, value: f.id })))

/** 当前分组字段；被删除或不再是单选时回退到第一个单选字段 */
const groupFieldId = ref('')
watch(
  selectFields,
  (fields) => {
    if (!fields.some((f) => f.id === groupFieldId.value)) {
      groupFieldId.value = fields[0]?.id ?? ''
    }
  },
  { immediate: true }
)

const groupField = computed(
  () => selectFields.value.find((f) => f.id === groupFieldId.value) ?? null
)

/** 单元格值的卡片文案：空值返回空串（不展示该行） */
function cellText(value: CellValue): string {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (Array.isArray(value)) return value.join('、')
  return String(value)
}

/** 看板卡片：标题（关键字段值）+ 至多 3 行摘要字段 */
interface KanbanCard {
  id: string
  title: string
  lines: { label: string; text: string }[]
}

/** 卡片标题取第一个文本字段的值（缺省回退首字段），正文再展示至多 3 个非空字段 */
const columns = computed<KanbanColumnItem[]>(() => {
  const field = groupField.value
  if (!field) return []
  const titleField =
    props.fields.find((f) => f.type === 'text' && f.id !== field.id) ?? props.fields[0]
  const lineFields = props.fields.filter((f) => f.id !== field.id && f.id !== titleField?.id)

  const grouped: KanbanColumnItem[] = field.options.map((option) => ({
    key: option,
    title: option,
    items: []
  }))
  const ungrouped: KanbanCard[] = []
  for (const row of props.rows) {
    const group = cellText(row.values[field.id] ?? null)
    const card: KanbanCard = {
      id: row.id,
      title: (titleField && cellText(row.values[titleField.id] ?? null)) || row.id,
      lines: lineFields
        .map((f) => ({ label: f.name, text: cellText(row.values[f.id] ?? null) }))
        .filter((line) => line.text !== '')
        .slice(0, 3)
    }
    const column = grouped.find((c) => c.key === group)
    if (column) column.items.push(card)
    else ungrouped.push(card)
  }
  if (ungrouped.length > 0) {
    grouped.push({ key: '__ungrouped__', title: '未分组', items: ungrouped })
  }
  return grouped
})
</script>

<style lang="scss" scoped>
.smart-table__kanban {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.smart-table__kanban-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.smart-table__kanban-label {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.smart-table__kanban-select {
  width: 180px;
}

.smart-table__kanban-hint {
  font-size: 12px;
  color: var(--u-text-color-second);
}

.smart-table__kanban-board {
  flex: 1;
  min-height: 0;
}

.smart-table__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.smart-table__card-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--u-text-color-main);
}

.smart-table__card-line {
  color: var(--u-text-color-second);
}
</style>
