<template>
  <u-dialog
    v-model="visible"
    title="数据集配置"
    :modal="true"
    class="dataset-dialog"
    style="width: min(960px, 96vw); max-height: 88vh"
  >
    <div class="dataset-dialog__body">
      <!-- A：本报表选用哪些数据集 -->
      <section class="dataset-dialog__select">
        <h4 class="dataset-dialog__heading">本报表选用的数据集</h4>
        <p class="dataset-dialog__note">
          从目录勾选后，其字段会出现在左侧面板，可组合多个数据集的字段绑定到同一模板。
        </p>
        <div class="dataset-dialog__checks">
          <label
            v-for="item in items"
            :key="item.id"
            class="dataset-dialog__check"
            :class="{ 'is-on': item.selected }"
          >
            <u-checkbox
              :model-value="item.selected"
              @update:model-value="(v) => onToggleSelected(item.id, !!v)"
            />
            <span class="dataset-dialog__check-label">{{ item.label }}</span>
            <span class="dataset-dialog__check-meta"
              >{{ item.rowCount }} 行 · {{ item.fields.length }} 字段</span
            >
          </label>
        </div>
      </section>

      <!-- B：已选用集 → 字段配置 / 数据预览 -->
      <div class="dataset-dialog__detail">
        <aside class="dataset-dialog__nav">
          <p class="dataset-dialog__nav-title">已选用</p>
          <button
            v-for="item in selectedItems"
            :key="item.id"
            type="button"
            class="dataset-dialog__nav-item"
            :class="{ 'is-active': item.id === activeId }"
            @click="activeId = item.id"
          >
            <span class="dataset-dialog__nav-label">{{ item.label }}</span>
            <span class="dataset-dialog__nav-meta">{{ item.fields.length }} 字段</span>
          </button>
          <p v-if="selectedItems.length === 0" class="dataset-dialog__empty">尚未选用任何数据集</p>
        </aside>

        <div v-if="activeItem" class="dataset-dialog__main">
          <div class="dataset-dialog__rename">
            <label class="dataset-dialog__label">数据集显示名</label>
            <u-input
              :model-value="activeItem.label"
              size="small"
              placeholder="显示在字段面板"
              @update:model-value="onRename"
            />
          </div>

          <u-tabs v-model="detailTab" :items="detailTabItems" class="dataset-dialog__tabs">
            <template #schema>
              <div class="dataset-dialog__schema">
                <p class="dataset-dialog__schema-hint">
                  字段来自<strong>数据集 schema 配置</strong>（demo mock），不是运行时猜的。
                  <code>name</code> = 绑定键（写入 Binding，英文标识）； <code>label</code> =
                  中文显示名（字段面板与占位可读名，可编辑）。
                </p>
                <table class="dataset-dialog__field-table">
                  <thead>
                    <tr>
                      <th>字段名（name / key）</th>
                      <th>中文描述（label）</th>
                      <th>类型</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="field in activeItem.fields" :key="field.name">
                      <td>
                        <code class="dataset-dialog__code">{{ field.name }}</code>
                      </td>
                      <td>
                        <u-input
                          :model-value="field.label"
                          size="small"
                          placeholder="中文显示名"
                          @update:model-value="(v) => onFieldLabel(field.name, String(v ?? ''))"
                        />
                      </td>
                      <td>
                        <u-tag size="small" :type="fieldTypeColor(field.type)">{{
                          field.type
                        }}</u-tag>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <template #preview>
              <u-table
                class="dataset-dialog__table"
                :data="activeRows"
                :columns="tableColumns"
                show-index
                border
                text-ellipsis
              />
            </template>
          </u-tabs>
        </div>

        <div v-else class="dataset-dialog__main dataset-dialog__main--empty">
          <p>请先在上方勾选至少一个数据集，再配置字段中文名。</p>
        </div>
      </div>
    </div>

    <template #footer>
      <u-button plain @click="resetConfig">重置配置</u-button>
      <u-button type="primary" @click="visible = false">完成</u-button>
    </template>
  </u-dialog>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import type { ColorType } from '@veltra/utils'
import { computed, ref, watch } from 'vue'

import type { DatasetField, DatasetRecords, ReportDatasetConfig } from './types'

defineOptions({ name: 'SheetReportDatasetDialog' })

const props = defineProps<{
  records: DatasetRecords
  /** 本报表数据集选用与字段配置 */
  items: ReportDatasetConfig[]
}>()

const emit = defineEmits<{ 'update:items': [items: ReportDatasetConfig[]]; reset: [] }>()

const visible = defineModel<boolean>({ default: false })
const detailTab = ref('schema')
const detailTabItems = [
  { key: 'schema', name: '字段配置' },
  { key: 'preview', name: '数据预览' }
]

const selectedItems = computed(() => props.items.filter((item) => item.selected))

const activeId = ref(selectedItems.value[0]?.id ?? '')

watch(
  selectedItems,
  (list) => {
    if (!list.some((item) => item.id === activeId.value)) {
      activeId.value = list[0]?.id ?? ''
    }
  },
  { deep: true }
)

const activeItem = computed(
  () => selectedItems.value.find((item) => item.id === activeId.value) ?? null
)

const activeRows = computed(() => {
  if (!activeItem.value) return []
  return props.records[activeItem.value.id] ?? []
})

const tableColumns = computed(() => {
  const fields = activeItem.value?.fields ?? []
  return defineTableColumns(
    fields.map((field) => ({
      key: field.name,
      name: field.label,
      minWidth: field.type === 'number' ? 88 : 112
    }))
  )
})

function fieldTypeColor(type: DatasetField['type']): ColorType {
  if (type === 'number') return 'success'
  if (type === 'date') return 'warning'
  return 'info'
}

function emitItems(next: ReportDatasetConfig[]): void {
  emit('update:items', next)
}

function onToggleSelected(id: string, selected: boolean): void {
  if (!selected) {
    const selectedCount = props.items.filter((item) => item.selected).length
    if (selectedCount <= 1) return
  }
  emitItems(
    props.items.map((item) => (item.id === id ? Object.assign({}, item, { selected }) : item))
  )
}

function onRename(value: string): void {
  const id = activeId.value
  emitItems(
    props.items.map((item) => (item.id === id ? Object.assign({}, item, { label: value }) : item))
  )
}

function onFieldLabel(fieldName: string, label: string): void {
  const id = activeId.value
  emitItems(
    props.items.map((item) => {
      if (item.id !== id) return item
      return Object.assign({}, item, {
        fields: item.fields.map((field) =>
          field.name === fieldName ? Object.assign({}, field, { label }) : field
        )
      })
    })
  )
}

function resetConfig(): void {
  emit('reset')
}
</script>

<style scoped lang="scss">
.dataset-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 460px;
  max-height: calc(88vh - 140px);
}

.dataset-dialog__select {
  flex-shrink: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--u-fill-color-light, #f8fafc);
  border: 1px solid var(--u-border-color-light, #f1f5f9);
}

.dataset-dialog__heading {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
}

.dataset-dialog__note {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--u-text-color-secondary, #64748b);
}

.dataset-dialog__checks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dataset-dialog__check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  background: var(--u-bg-color, #fff);
  cursor: pointer;
  font-size: 13px;

  &.is-on {
    border-color: var(--u-color-primary-light-5, #93c5fd);
    background: var(--u-color-primary-light-9, #eff6ff);
  }
}

.dataset-dialog__check-label {
  font-weight: 500;
}

.dataset-dialog__check-meta {
  font-size: 11px;
  color: var(--u-text-color-secondary, #64748b);
}

.dataset-dialog__detail {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.dataset-dialog__nav {
  width: 148px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 12px;
  border-right: 1px solid var(--u-border-color-light, #f1f5f9);
  overflow: auto;
}

.dataset-dialog__nav-title {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--u-text-color-secondary, #64748b);
  text-transform: none;
}

.dataset-dialog__nav-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;

  &:hover {
    background: var(--u-fill-color-light, #f8fafc);
  }

  &.is-active {
    background: var(--u-color-primary-light-9, #eff6ff);
    color: var(--u-color-primary, #2563eb);
  }
}

.dataset-dialog__nav-label {
  font-size: 13px;
  font-weight: 600;
}

.dataset-dialog__nav-meta {
  font-size: 11px;
  color: var(--u-text-color-secondary, #64748b);
}

.dataset-dialog__empty {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.dataset-dialog__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.dataset-dialog__main--empty {
  justify-content: center;
  align-items: center;
  color: var(--u-text-color-secondary, #64748b);
  font-size: 13px;
}

.dataset-dialog__rename {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.dataset-dialog__label {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.dataset-dialog__tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dataset-dialog__schema {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 8px;
  max-height: 340px;
  overflow: auto;
}

.dataset-dialog__schema-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--u-text-color-secondary, #64748b);

  code {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    padding: 0 3px;
    border-radius: 3px;
    background: var(--u-fill-color, #f1f5f9);
  }
}

.dataset-dialog__field-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--u-border-color-light, #f1f5f9);
    text-align: left;
    vertical-align: middle;
  }

  th {
    font-size: 12px;
    font-weight: 600;
    color: var(--u-text-color-secondary, #64748b);
    background: var(--u-fill-color-light, #f8fafc);
  }

  td:first-child {
    width: 36%;
  }

  td:last-child {
    width: 88px;
  }
}

.dataset-dialog__code {
  font-family: ui-monospace, monospace;
  font-size: 12px;
}

.dataset-dialog__table {
  margin-top: 8px;
  min-height: 240px;
  height: 300px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
}
</style>
