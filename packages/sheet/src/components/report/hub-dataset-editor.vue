<template>
  <section v-if="dataset" :class="cls.b">
    <div :class="cls.e('head')">
      <div :class="cls.e('rename')">
        <span :class="cls.e('label')">数据集名称</span>
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

    <div :class="cls.e('sql')">
      <p :class="cls.e('section-title')">SQL 查询</p>
      <u-code-editor
        v-model="sqlDraft"
        lang="sql"
        :langs="['sql']"
        :default-lines="6"
        @change="onSqlChange"
      />
      <p v-if="describeError" :class="cls.e('sql-error')" role="alert">{{ describeError }}</p>
    </div>

    <div v-if="paramRows.length" :class="cls.e('params')">
      <p :class="cls.e('section-title')">查询参数（从 SQL 自动提取）</p>
      <u-table
        :class="cls.e('param-table')"
        :data="paramRows"
        :columns="paramColumns"
        border
        text-ellipsis
      >
        <template #column:label="{ rowData }">
          <u-input
            :model-value="rowData.label"
            size="small"
            @update:model-value="(v) => patchParam(rowData.id, { label: String(v ?? '') })"
          />
        </template>
        <template #column:type="{ rowData }">
          <u-select
            :model-value="rowData.type"
            size="small"
            :options="paramTypeOptions"
            @update:model-value="(v) => patchParam(rowData.id, { type: v as QueryParamType })"
          />
        </template>
        <template #column:defaultValue="{ rowData }">
          <u-input
            v-if="rowData.type === 'number'"
            :model-value="String(rowData.defaultValue ?? '')"
            size="small"
            type="number"
            @update:model-value="(v) => patchParam(rowData.id, { defaultValue: Number(v) })"
          />
          <u-input
            v-else-if="rowData.type === 'date'"
            :model-value="String(rowData.defaultValue ?? '')"
            size="small"
            type="date"
            @update:model-value="(v) => patchParam(rowData.id, { defaultValue: v })"
          />
          <u-select
            v-else-if="rowData.type === 'select'"
            :model-value="String(rowData.defaultValue ?? '')"
            size="small"
            :options="rowData.options ?? []"
            @update:model-value="(v) => patchParam(rowData.id, { defaultValue: v })"
          />
          <u-input
            v-else
            :model-value="formatDefaultValue(rowData.defaultValue)"
            size="small"
            @update:model-value="(v) => patchParam(rowData.id, { defaultValue: v })"
          />
        </template>
        <template #column:options="{ rowData }">
          <u-input
            v-if="rowData.type === 'select'"
            :model-value="formatOptions(rowData.options)"
            size="small"
            placeholder="华东|华东,华南|华南"
            @update:model-value="
              (v) => patchParam(rowData.id, { options: parseOptions(String(v ?? '')) })
            "
          />
          <span v-else :class="cls.e('muted')">—</span>
        </template>
      </u-table>
    </div>

    <u-tabs v-model="detailTab" :items="detailTabItems" :class="cls.e('tabs')">
      <template #schema>
        <p v-if="describing" :class="cls.e('muted')">正在解析字段…</p>
        <u-table
          v-else
          :class="cls.e('schema-table')"
          :data="schemaRows"
          :columns="schemaColumns"
          border
          text-ellipsis
        >
          <template #column:label="{ rowData }">
            <u-input
              :model-value="rowData.label"
              size="small"
              placeholder="中文显示名"
              @update:model-value="(v) => patchFieldLabel(rowData.name, String(v ?? ''))"
            />
          </template>
          <template #column:type="{ rowData }">
            <u-tag size="small" :type="fieldTypeColor(rowData.type)">{{ rowData.type }}</u-tag>
          </template>
        </u-table>
      </template>
      <template #preview>
        <div :class="cls.e('preview-actions')">
          <u-button size="small" plain :loading="previewing" @click="runPreview">
            刷新预览（按参数默认值取数）
          </u-button>
        </div>
        <u-table
          :class="cls.e('preview-table')"
          :data="previewRows"
          :columns="previewColumns"
          show-index
          border
          text-ellipsis
        />
        <p v-if="previewError" :class="cls.e('preview-error')" role="alert">{{ previewError }}</p>
      </template>
    </u-tabs>
  </section>
</template>

<script lang="ts" setup>
import {
  UButton,
  UCodeEditor,
  UInput,
  UPopConfirm,
  USelect,
  UTable,
  UTabs,
  UTag,
  defineTableColumns
} from '@veltra/desktop'
import type { ColorType } from '@veltra/utils'
import { bem } from '@veltra/utils'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import { buildParamDefs } from '../../report/params'
import type { DatasetField, QueryParamDef, QueryParamType } from '../../report/types'
import type { DatasetHubController, DesignerDataset } from './use-report-designer'

defineOptions({ name: 'UReportHubDatasetEditor' })

const props = defineProps<{ hub: DatasetHubController; datasetId: string }>()

const emit = defineEmits<{ remove: [] }>()

const cls = bem('report-hub-dataset-editor')

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

const dataset = computed((): DesignerDataset | undefined =>
  props.hub.datasets.value.find((item) => item.id === props.datasetId)
)

// ---- describe / 预览状态（声明先于下方 immediate watcher 使用） ----

const describing = ref(false)
const describeError = shallowRef('')
let describeSeq = 0

const previewing = ref(false)
const previewError = shallowRef('')
const previewRows = shallowRef<Record<string, unknown>[]>([])
const previewFields = shallowRef<DatasetField[]>([])

function resetPreview(): void {
  previewing.value = false
  previewError.value = ''
  previewRows.value = []
  previewFields.value = []
}

// ---- SQL 编辑：debounce 写回数据集并触发 describe ----

const sqlDraft = ref('')
let sqlTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.datasetId,
  () => {
    sqlDraft.value = dataset.value?.sql ?? ''
    resetPreview()
    void runDescribe()
  },
  { immediate: true }
)

function onSqlChange(value: string): void {
  sqlDraft.value = value
  if (sqlTimer) clearTimeout(sqlTimer)
  sqlTimer = setTimeout(() => {
    props.hub.updateDataset(props.datasetId, { sql: value })
    void runDescribe()
  }, 280)
}

onBeforeUnmount(() => {
  if (sqlTimer) clearTimeout(sqlTimer)
})

// ---- describe 字段解析（经连接器；结果写入数据集字段缓存） ----

async function runDescribe(): Promise<void> {
  const seq = ++describeSeq
  if (!sqlDraft.value.trim()) {
    describeError.value = ''
    // SQL 清空 = 无查询：清掉字段缓存，字段面板不再残留旧字段
    props.hub.updateDataset(props.datasetId, { fields: undefined })
    return
  }
  describing.value = true
  const result = await props.hub.describeDataset(props.datasetId)
  if (seq !== describeSeq) return
  describing.value = false
  describeError.value = result.ok ? '' : result.error.message
}

// ---- 查询参数（`${param}` 提取 + 元数据覆盖） ----

const paramRows = computed(() => {
  const current = dataset.value
  if (!current || !current.sql.trim()) return []
  return buildParamDefs(current.sql, current.paramOverrides)
})

// ---- 字段 schema（describe 缓存 + fieldOverrides） ----

const schemaRows = computed(() => {
  const current = dataset.value
  if (!current) return []
  return (current.fields ?? []).map((field) => ({
    ...field,
    label: current.fieldOverrides?.[field.name]?.label ?? field.label
  }))
})

// ---- 记录预览（按参数默认值经连接器取数） ----

async function runPreview(): Promise<void> {
  previewing.value = true
  previewError.value = ''
  const result = await props.hub.previewDataset(props.datasetId)
  previewing.value = false
  if (result.ok) {
    previewRows.value = result.data.rows
    previewFields.value = result.data.fields
  } else {
    previewRows.value = []
    previewError.value = result.error.message
  }
}

watch(detailTab, (tab) => {
  if (tab === 'preview') void runPreview()
})

// ---- 表格列与编辑 ----

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

const previewColumns = computed(() =>
  defineTableColumns(
    previewFields.value.map((field) => ({
      key: field.name,
      name: field.label,
      minWidth: field.type === 'number' ? 88 : 112
    }))
  )
)

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

function patchDataset(patch: Partial<Omit<DesignerDataset, 'id'>>): void {
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
</script>
