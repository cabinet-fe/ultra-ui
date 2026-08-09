<template>
  <u-drawer
    v-model="visible"
    direction="right"
    title="筛选参数"
    class="params-config-drawer"
    :show-close="true"
  >
    <p class="params-config-drawer__hint">
      汇总当前模板已绑定数据集使用的查询参数；修改显示名、默认值与控件类型后，预览筛选栏将同步更新。
    </p>

    <p v-if="paramRows.length === 0" class="params-config-drawer__empty">
      当前模板尚未绑定带参数的数据集字段。
    </p>

    <u-table
      v-else
      class="params-config-drawer__table"
      :data="paramRows"
      :columns="columns"
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
          :model-value="String(values[row.id] ?? row.defaultValue ?? '')"
          size="small"
          type="number"
          @update:model-value="(v) => onValueChange(row.id, Number(v))"
        />
        <u-input
          v-else-if="row.type === 'date'"
          :model-value="String(values[row.id] ?? row.defaultValue ?? '')"
          size="small"
          type="date"
          @update:model-value="(v) => onValueChange(row.id, v)"
        />
        <u-select
          v-else-if="row.type === 'select'"
          :model-value="String(values[row.id] ?? row.defaultValue ?? '')"
          size="small"
          :options="row.options ?? []"
          @update:model-value="(v) => onValueChange(row.id, v)"
        />
        <u-input
          v-else
          :model-value="String(values[row.id] ?? row.defaultValue ?? '')"
          size="small"
          @update:model-value="(v) => onValueChange(row.id, v)"
        />
      </template>
      <template #column:metaDefault="{ row }">
        <u-button size="small" text @click="applyDefault(row)">应用默认值</u-button>
      </template>
    </u-table>

    <template #footer>
      <u-button plain @click="emit('reset-params')">重置参数</u-button>
      <u-button type="primary" @click="visible = false">完成</u-button>
    </template>
  </u-drawer>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { computed } from 'vue'

import type { DataHub, QueryParamDef, QueryParamType } from './dataset-hub'

defineOptions({ name: 'SheetReportParamsConfigDrawer' })

const props = defineProps<{
  hub: DataHub
  revision: number
  boundDatasetIds: readonly string[]
  values: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:values': [values: Record<string, unknown>]
  'reset-params': []
}>()

const visible = defineModel<boolean>({ default: false })

const paramTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '日期', value: 'date' },
  { label: '日期范围', value: 'date-range' },
  { label: '下拉', value: 'select' }
]

const paramRows = computed((): QueryParamDef[] => {
  props.revision
  return props.hub.getQueryParams(props.boundDatasetIds)
})

const columns = defineTableColumns([
  { key: 'id', name: '参数名', minWidth: 100 },
  { key: 'label', name: '显示名', minWidth: 120 },
  { key: 'type', name: '控件类型', width: 120 },
  { key: 'defaultValue', name: '当前值', minWidth: 140 },
  { key: 'metaDefault', name: '默认值', width: 100 }
])

function datasetsUsingParam(paramId: string): string[] {
  props.revision
  return props.hub.datasets
    .filter((dataset) => props.boundDatasetIds.includes(dataset.id))
    .filter((dataset) => dataset.sql.includes(`\${${paramId}}`))
    .map((dataset) => dataset.id)
}

function patchParam(paramId: string, patch: Partial<Omit<QueryParamDef, 'id'>>): void {
  for (const datasetId of datasetsUsingParam(paramId)) {
    const dataset = props.hub.getDataset(datasetId)
    if (!dataset) continue
    const nextOverrides = {
      ...dataset.paramOverrides,
      [paramId]: { ...dataset.paramOverrides?.[paramId], ...patch }
    }
    props.hub.updateDataset(datasetId, { paramOverrides: nextOverrides })
  }
  if (patch.defaultValue !== undefined) {
    emit('update:values', { ...props.values, [paramId]: patch.defaultValue })
  }
}

function onValueChange(paramId: string, value: unknown): void {
  emit('update:values', { ...props.values, [paramId]: value })
}

function applyDefault(row: QueryParamDef): void {
  emit('update:values', { ...props.values, [row.id]: row.defaultValue })
}
</script>

<style scoped lang="scss">
.params-config-drawer__hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--u-text-color-secondary, #64748b);
}

.params-config-drawer__empty {
  margin: 24px 0;
  font-size: 13px;
  color: var(--u-text-color-secondary, #64748b);
  text-align: center;
}

.params-config-drawer__table {
  min-height: 280px;
  height: 360px;
}
</style>

<style lang="scss">
.params-config-drawer.u-drawer.is-right {
  width: min(640px, 92vw);
}
</style>
