<template>
  <section v-if="queryParams.length" class="report-filter-bar">
    <span class="report-filter-bar__label">筛选参数</span>
    <div class="report-filter-bar__fields">
      <div v-for="param in queryParams" :key="param.id" class="report-filter-bar__field">
        <label class="report-filter-bar__field-label">{{ param.label }}</label>
        <u-input
          v-if="param.type === 'date'"
          :model-value="String(values[param.id] ?? '')"
          size="small"
          type="date"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
        <template v-else-if="param.type === 'date-range'">
          <u-input
            :model-value="dateRangeFrom(param)"
            size="small"
            type="date"
            @update:model-value="(v) => emitDateRangeChange(param.id, v, dateRangeTo(param))"
          />
          <span class="report-filter-bar__range-sep">—</span>
          <u-input
            :model-value="dateRangeTo(param)"
            size="small"
            type="date"
            @update:model-value="(v) => emitDateRangeChange(param.id, dateRangeFrom(param), v)"
          />
        </template>
        <u-select
          v-else-if="param.type === 'select'"
          :model-value="String(values[param.id] ?? '')"
          size="small"
          :options="param.options ?? []"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
        <u-input
          v-else-if="param.type === 'number'"
          :model-value="String(values[param.id] ?? '')"
          size="small"
          type="number"
          @update:model-value="(v) => emitChange(param.id, Number(v))"
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

defineOptions({ name: 'SheetReportFilterBar' })

const props = defineProps<{
  queryParams: QueryParamDef[] | DatasetQueryParam[]
  values: DatasetQueryParamValues
}>()

const emit = defineEmits<{ 'update:values': [values: DatasetQueryParamValues] }>()

function dateRangeFrom(param: QueryParamDef): string {
  const raw = props.values[param.id]
  if (Array.isArray(raw)) return String(raw[0] ?? '')
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return String(obj.from ?? obj.start ?? '')
  }
  return ''
}

function dateRangeTo(param: QueryParamDef): string {
  const raw = props.values[param.id]
  if (Array.isArray(raw)) return String(raw[1] ?? '')
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return String(obj.to ?? obj.end ?? '')
  }
  return ''
}

function emitChange(id: string, value: unknown): void {
  emit('update:values', { ...props.values, [id]: value })
}

function emitDateRangeChange(id: string, from: string, to: string): void {
  emit('update:values', { ...props.values, [id]: [from, to] })
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

.report-filter-bar__range-sep {
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}
</style>
