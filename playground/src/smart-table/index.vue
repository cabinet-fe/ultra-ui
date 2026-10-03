<template>
  <div class="smart-table">
    <!-- 工具栏：标题 + 保存状态 + 视图切换 + 行/字段管理入口 -->
    <div class="smart-table__bar">
      <span class="smart-table__title">智慧表格</span>
      <u-segment v-model="view" :items="viewItems" />
      <span class="smart-table__status" :data-state="saveState">
        <span class="smart-table__status-dot" />
        {{ statusText }}
      </span>
      <u-button class="smart-table__bar-btn" @click="addRow">新增行</u-button>
      <u-button class="smart-table__bar-btn" type="primary" @click="fieldDialogOpen = true">
        新增字段
      </u-button>
    </div>

    <AiPanel :state="aiState" :target-options="aiTargetOptions" @run="runAi" />

    <KanbanView v-if="view === 'kanban'" :fields="doc?.fields ?? []" :rows="doc?.rows ?? []" />

    <div v-else class="smart-table__scroll">
      <table v-if="doc" class="smart-table__grid">
        <thead>
          <tr>
            <th v-for="field in doc.fields" :key="field.id" class="smart-table__head" scope="col">
              <div class="smart-table__head-main">
                <span class="smart-table__head-name" :title="field.name">{{ field.name }}</span>
                <span class="smart-table__head-type">{{ FIELD_TYPE_LABELS[field.type] }}</span>
              </div>
              <u-pop-confirm
                :title="`删除字段「${field.name}」？该列及全部数据将被移除`"
                @confirm="removeField(field.id)"
              >
                <template #reference>
                  <u-button size="small" type="danger" text>删除</u-button>
                </template>
              </u-pop-confirm>
            </th>
            <th class="smart-table__head smart-table__head--ops" scope="col">行操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in doc.rows" :key="row.id">
            <td v-for="field in doc.fields" :key="field.id" class="smart-table__cell">
              <TableCell
                v-model="row.values[field.id]"
                :field="field"
                :active="isActive(row.id, field.id)"
                @edit="activeCell = { rowId: row.id, fieldId: field.id }"
                @exit="exitEdit(row.id, field.id)"
              />
            </td>
            <td class="smart-table__cell smart-table__cell--ops">
              <u-pop-confirm title="删除这一行？" @confirm="removeRow(row.id)">
                <template #reference>
                  <u-button size="small" type="danger" text>删除</u-button>
                </template>
              </u-pop-confirm>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <FieldDialog v-model="fieldDialogOpen" @confirm="addField" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, shallowRef } from 'vue'

import AiPanel from './ai-panel.vue'
import FieldDialog from './field-dialog.vue'
import KanbanView from './kanban-view.vue'
import TableCell from './table-cell.vue'
import { FIELD_TYPE_LABELS } from './types'
import { useSmartAi } from './use-smart-ai'
import { useTableDoc } from './use-table-doc'

/**
 * 智慧表格演示页：7 种类型化字段的行内编辑、行/字段管理、表格 ↔ 看板视图切换、
 * AI 生成 / 整理面板（`useSmartAi`），演示表持久化（`useTableDoc` 内防抖整表 PUT，
 * 刷新后数据保留）。数据结构契约见 `types.ts` 与参考服务 `server/smart-table.ts`。
 */
const { doc, saveState, load, addRow: appendRow, removeRow, addField, removeField } = useTableDoc()

// 顶层解构使 targetOptions（ComputedRef）在模板里自动解包
const { state: aiState, targetOptions: aiTargetOptions, run: runAi } = useSmartAi(doc, addField)

/** 视图切换（本地记忆即可，不持久化） */
type ViewMode = 'table' | 'kanban'
const view = ref<ViewMode>('table')
const viewItems = [
  { label: '表格', value: 'table' },
  { label: '看板', value: 'kanban' }
]

const statusText = computed(
  () =>
    ({ saved: '已保存', dirty: '待保存', saving: '保存中…', error: '保存失败' })[saveState.value]
)

/** 当前处于行内编辑态的单元格（同一时刻至多一个） */
const activeCell = shallowRef<{ rowId: string; fieldId: string } | null>(null)
const fieldDialogOpen = shallowRef(false)

function isActive(rowId: string, fieldId: string): boolean {
  return activeCell.value?.rowId === rowId && activeCell.value.fieldId === fieldId
}

function exitEdit(rowId: string, fieldId: string): void {
  if (isActive(rowId, fieldId)) activeCell.value = null
}

/** 新增空行后直接把首个字段置为编辑态 */
function addRow(): void {
  const row = appendRow()
  const firstField = doc.value?.fields[0]
  if (row && firstField) activeCell.value = { rowId: row.id, fieldId: firstField.id }
}

onMounted(() => void load())
</script>

<style lang="scss" scoped>
.smart-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
}

.smart-table__bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.smart-table__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-main);
}

.smart-table__status {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.smart-table__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--u-color-info);
}

.smart-table__status[data-state='saved'] .smart-table__status-dot {
  background: var(--u-color-success);
}

.smart-table__status[data-state='dirty'] .smart-table__status-dot,
.smart-table__status[data-state='saving'] .smart-table__status-dot {
  background: var(--u-color-warning);
}

.smart-table__status[data-state='error'] .smart-table__status-dot {
  background: var(--u-color-danger, #f04438);
}

.smart-table__bar-btn {
  flex: none;
}

.smart-table__scroll {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 8px;
  background: var(--u-bg-color-top);
}

.smart-table__grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.smart-table__head {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 10px;
  text-align: left;
  white-space: nowrap;
  background: var(--u-bg-color-middle, var(--u-bg-color-top));
  border-bottom: 1px solid var(--u-border-muted-color);
}

.smart-table__head-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.smart-table__head-name {
  font-weight: 600;
  color: var(--u-text-color-title);
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.smart-table__head-type {
  font-size: 11px;
  color: var(--u-text-color-second);
}

.smart-table__cell {
  min-width: 140px;
  max-width: 260px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--u-border-muted-color);
  vertical-align: middle;
}

.smart-table__cell--ops,
.smart-table__head--ops {
  min-width: auto;
  width: 72px;
}
</style>
