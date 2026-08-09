<template>
  <section v-if="dataset" class="dataset-editor">
    <div class="dataset-editor__head">
      <div class="dataset-editor__rename">
        <span class="dataset-editor__label">数据集名称</span>
        <u-input
          :model-value="dataset.label"
          size="small"
          @update:model-value="(v) => patchDataset({ label: String(v ?? '') })"
        />
      </div>
      <u-pop-confirm title="确定删除该数据集？" @confirm="emit('remove')">
        <template #reference>
          <u-button size="small" type="danger" plain>删除数据集</u-button>
        </template>
      </u-pop-confirm>
    </div>

    <div class="dataset-editor__sql">
      <p class="dataset-editor__section-title">SQL 查询</p>
      <u-code-editor
        v-model="sqlDraft"
        lang="sql"
        :langs="['sql']"
        :default-lines="6"
        @change="onSqlChange"
      />
      <p v-if="describeError" class="dataset-editor__sql-error">{{ describeError }}</p>
    </div>

    <div v-if="paramRows.length" class="dataset-editor__params">
      <p class="dataset-editor__section-title">查询参数（从 SQL 自动提取）</p>
      <u-table
        class="dataset-editor__param-table"
        :data="paramRows"
        :columns="paramColumns"
        border
        text-ellipsis
      >
        <template #column:label="{ row }">
          <u-input
            :model-value="row.label"
            size="small"
            @update:model-value="(v) => patchParam(row.id, { label: String(v ?? '') })"
          />
        </template>
        <template #column:type="{ row }">
          <u-select
            :model-value="row.type"
            size="small"
            :options="paramTypeOptions"
            @update:model-value="(v) => patchParam(row.id, { type: v as QueryParamType })"
          />
        </template>
        <template #column:defaultValue="{ row }">
          <u-input
            v-if="row.type === 'number'"
            :model-value="String(row.defaultValue ?? '')"
            size="small"
            type="number"
            @update:model-value="(v) => patchParam(row.id, { defaultValue: Number(v) })"
          />
          <u-input
            v-else-if="row.type === 'date'"
            :model-value="String(row.defaultValue ?? '')"
            size="small"
            type="date"
            @update:model-value="(v) => patchParam(row.id, { defaultValue: v })"
          />
          <u-select
            v-else-if="row.type === 'select'"
            :model-value="String(row.defaultValue ?? '')"
            size="small"
            :options="row.options ?? []"
            @update:model-value="(v) => patchParam(row.id, { defaultValue: v })"
          />
          <u-input
            v-else
            :model-value="formatDefaultValue(row.defaultValue)"
            size="small"
            @update:model-value="(v) => patchParam(row.id, { defaultValue: v })"
          />
        </template>
        <template #column:options="{ row }">
          <u-input
            v-if="row.type === 'select'"
            :model-value="formatOptions(row.options)"
            size="small"
            placeholder="华东|华东,华南|华南"
            @update:model-value="
              (v) => patchParam(row.id, { options: parseOptions(String(v ?? '')) })
            "
          />
          <span v-else class="dataset-editor__muted">—</span>
        </template>
      </u-table>
    </div>

    <u-tabs v-model="detailTab" :items="detailTabItems" class="dataset-editor__tabs">
      <template #schema>
        <u-table
          class="dataset-editor__schema-table"
          :data="schemaRows"
          :columns="schemaColumns"
          border
          text-ellipsis
        >
          <template #column:label="{ row }">
            <u-input
              :model-value="row.label"
              size="small"
              placeholder="中文显示名"
              @update:model-value="(v) => patchFieldLabel(row.name, String(v ?? ''))"
            />
          </template>
          <template #column:type="{ row }">
            <u-tag size="small" :type="fieldTypeColor(row.type)">{{ row.type }}</u-tag>
          </template>
        </u-table>
      </template>
      <template #preview>
        <u-table
          class="dataset-editor__preview-table"
          :data="previewRows"
          :columns="previewColumns"
          show-index
          border
          text-ellipsis
        />
        <p v-if="previewError" class="dataset-editor__preview-error">{{ previewError }}</p>
      </template>
    </u-tabs>
  </section>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import type { ColorType } from '@veltra/utils'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import type { DataHub, DatasetDef, QueryParamDef, QueryParamType } from '../dataset-hub'
import type { DatasetField } from '../types'

defineOptions({ name: 'SheetReportDatasetEditor' })

const props = defineProps<{
  hub: DataHub
  datasetId: string
  revision: number
  paramValues: Record<string, unknown>
}>()

const emit = defineEmits<{ remove: [] }>()

const detailTab = ref('schema')
const detailTabItems = [
  { key: 'schema', name: '字段 Schema' },
  { key: 'preview', name: '数据预览' }
]

const paramTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '日期', value: 'date' },
  { label: '日期范围', value: 'date-range' },
  { label: '下拉', value: 'select' }
]

const sqlDraft = ref('')
let sqlTimer: ReturnType<typeof setTimeout> | undefined

const dataset = computed((): DatasetDef | undefined => {
  props.revision
  return props.hub.getDataset(props.datasetId)
})

watch(
  () => [props.datasetId, props.revision] as const,
  () => {
    const current = props.hub.getDataset(props.datasetId)
    sqlDraft.value = current?.sql ?? ''
  },
  { immediate: true }
)

const described = computed(() => {
  props.revision
  const current = dataset.value
  if (!current) return { fields: [], params: [], error: '数据集不存在' }
  return props.hub.describe(current.sql, current.paramOverrides, current.fieldOverrides)
})

const describeError = computed(() => described.value.error ?? '')

const paramRows = computed(() => described.value.params)

const schemaRows = computed(() => described.value.fields)

const previewState = computed(() => {
  props.revision
  return props.hub.query(props.datasetId, props.paramValues)
})

const previewRows = computed(() => {
  const result = previewState.value
  if ('error' in result) return []
  return result
})

const previewError = computed(() => {
  const result = previewState.value
  return 'error' in result ? result.error : ''
})

const paramColumns = defineTableColumns([
  { key: 'id', name: '参数名', minWidth: 100 },
  { key: 'label', name: '显示名', minWidth: 120 },
  { key: 'type', name: '类型', width: 120 },
  { key: 'defaultValue', name: '默认值', minWidth: 140 },
  { key: 'options', name: '选项（select）', minWidth: 160 }
])

const schemaColumns = defineTableColumns([
  { key: 'name', name: '字段名（name）', minWidth: 140 },
  { key: 'label', name: '中文描述（label）', minWidth: 160 },
  { key: 'type', name: '类型', width: 88 }
])

const previewColumns = computed(() => {
  const fields = schemaRows.value
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

function formatDefaultValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  return String(value ?? '')
}

function formatOptions(options?: { label: string; value: string }[]): string {
  if (!options?.length) return ''
  return options.map((item) => `${item.label}|${item.value}`).join(',')
}

function parseOptions(raw: string): { label: string; value: string }[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [label, value] = part.split('|')
      const text = (label ?? '').trim()
      const val = (value ?? text).trim()
      return { label: text, value: val }
    })
}

function patchDataset(patch: Partial<DatasetDef>): void {
  props.hub.updateDataset(props.datasetId, patch)
}

function patchParam(paramId: string, patch: Partial<Omit<QueryParamDef, 'id'>>): void {
  const current = dataset.value
  if (!current) return
  const nextOverrides = {
    ...current.paramOverrides,
    [paramId]: { ...current.paramOverrides?.[paramId], ...patch }
  }
  patchDataset({ paramOverrides: nextOverrides })
}

function patchFieldLabel(fieldName: string, label: string): void {
  const current = dataset.value
  if (!current) return
  const nextOverrides = {
    ...current.fieldOverrides,
    [fieldName]: { ...current.fieldOverrides?.[fieldName], label }
  }
  patchDataset({ fieldOverrides: nextOverrides })
}

function onSqlChange(value: string): void {
  sqlDraft.value = value
  if (sqlTimer) clearTimeout(sqlTimer)
  sqlTimer = setTimeout(() => {
    patchDataset({ sql: value })
  }, 280)
}

onBeforeUnmount(() => {
  if (sqlTimer) clearTimeout(sqlTimer)
})
</script>

<style scoped lang="scss">
.dataset-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.dataset-editor__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.dataset-editor__rename {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.dataset-editor__label,
.dataset-editor__section-title {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
  flex-shrink: 0;
}

.dataset-editor__section-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.dataset-editor__sql {
  flex-shrink: 0;
}

.dataset-editor__sql-error,
.dataset-editor__preview-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--u-color-danger, #dc2626);
}

.dataset-editor__params {
  flex-shrink: 0;
}

.dataset-editor__param-table {
  max-height: 180px;
}

.dataset-editor__tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dataset-editor__schema-table,
.dataset-editor__preview-table {
  min-height: 220px;
  height: 280px;
}

.dataset-editor__muted {
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}
</style>
