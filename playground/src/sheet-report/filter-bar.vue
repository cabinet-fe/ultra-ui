<template>
  <section v-if="queryParams.length" class="report-filter-bar">
    <span class="report-filter-bar__label">筛选参数</span>
    <div class="report-filter-bar__fields">
      <div v-for="param in queryParams" :key="param.id" class="report-filter-bar__field">
        <span class="report-filter-bar__field-label">{{ param.label }}</span>
        <u-date-picker
          v-if="param.type === 'date'"
          :model-value="String(values[param.id] ?? '')"
          size="small"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
        <u-date-range-picker
          v-else-if="param.type === 'date-range'"
          :model-value="dateRangeModel(param.id)"
          size="small"
          @update:model-value="(v) => emitDateRangeChange(param.id, v)"
        />
        <u-select
          v-else-if="param.type === 'select'"
          :model-value="String(values[param.id] ?? '')"
          size="small"
          :options="param.options ?? []"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
        <u-number-input
          v-else-if="param.type === 'number'"
          :model-value="numberModel(param.id)"
          size="small"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
        <u-input
          v-else
          :model-value="String(values[param.id] ?? '')"
          size="small"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { DatasetQueryParam, DatasetQueryParamValues, QueryParamDef } from './dataset-hub'
import {
  parseDateRangeValue,
  patchParamValues,
  resolveNumberParamValue
} from './filter-bar-helpers'

defineOptions({ name: 'SheetReportFilterBar' })

const props = defineProps<{
  queryParams: QueryParamDef[] | DatasetQueryParam[]
  values: DatasetQueryParamValues
}>()

const emit = defineEmits<{ 'update:values': [values: DatasetQueryParamValues] }>()

function dateRangeModel(paramId: string): [string, string] {
  return parseDateRangeValue(props.values[paramId])
}

function numberModel(paramId: string): number | undefined {
  return resolveNumberParamValue(props.values[paramId])
}

function emitChange(id: string, value: unknown): void {
  emit('update:values', patchParamValues(props.values, id, value))
}

function emitDateRangeChange(id: string, value?: [string, string]): void {
  emit('update:values', patchParamValues(props.values, id, value ?? ['', '']))
}
</script>

<style scoped lang="scss">
.report-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--u-border-color-light, #e2e8f0);
  background: var(--u-fill-color-light, #f8fafc);
}

.report-filter-bar__label {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--u-text-color-secondary, #64748b);
}

.report-filter-bar__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  flex: 1;
  min-width: 0;
}

.report-filter-bar__field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.report-filter-bar__field-label {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}
</style>
