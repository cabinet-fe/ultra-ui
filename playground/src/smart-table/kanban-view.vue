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

    <u-kanban
      v-if="groupField"
      :columns="columns"
      class="smart-table__kanban-board"
      @change="onBoardChange"
    >
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

import { cellText, type CellValue, type TableField, type TableRow } from './types'

/** 空分组值行的归置列 key（与真实选项值区分开） */
const UNGROUPED_KEY = '__ungrouped__'

/**
 * 看板视图：按所选单选字段把记录分组为多列卡片，分组字段可切换（缺省取第一个
 * 单选字段）。卡片拖到其它列即编辑该行的分组字段值，经 `update-cell` 交父级
 * 写回同一 doc（网格侧可见）；列内拖拽只调序，不改数据。
 */
const props = defineProps<{ fields: TableField[]; rows: TableRow[] }>()

const emit = defineEmits<{
  updateCell: [payload: { rowId: string; fieldId: string; value: CellValue }]
}>()

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
    grouped.push({ key: UNGROUPED_KEY, title: '未分组', items: ungrouped })
  }
  return grouped
})

/** 拖拽落定：卡片所在列即目标分组值，与当前值不同的卡片逐张写回（列内调序不写） */
function onBoardChange(next: KanbanColumnItem[]): void {
  const field = groupField.value
  if (!field) return
  const rowsById = new Map(props.rows.map((row) => [row.id, row]))
  for (const column of next) {
    const value = column.key === UNGROUPED_KEY ? null : column.key
    for (const card of column.items) {
      const row = rowsById.get(card.id)
      if (row && (row.values[field.id] ?? null) !== value) {
        emit('updateCell', { rowId: card.id, fieldId: field.id, value })
      }
    }
  }
}
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

  /* 同 toolbar：USelect 根元素无 data-v，须 :deep 命中 */
  :deep(.smart-table__kanban-select) {
    width: 180px;
    flex: none;
  }
}

.smart-table__kanban-label {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.smart-table__kanban-hint {
  font-size: 12px;
  color: var(--u-text-color-second);
}

/* 主内容区无确定高度（页面随窗口滚动，同网格 560px 固定高先例）：列撑到同高，
   看板主体不再塌陷、下方不再留大片空白 */
.smart-table__kanban {
  :deep(.smart-table__kanban-board .u-kanban__column) {
    align-self: stretch;
    min-height: 560px;
  }
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
