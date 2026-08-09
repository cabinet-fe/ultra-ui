<template>
  <section v-if="visibleParams.length" class="report-filter-bar">
    <span class="report-filter-bar__label">筛选参数</span>
    <div class="report-filter-bar__fields">
      <div v-for="param in visibleParams" :key="param.id" class="report-filter-bar__field">
        <label class="report-filter-bar__field-label">{{ param.label }}</label>
        <u-input
          v-if="param.type === 'date'"
          :model-value="String(values[param.id] ?? '')"
          size="small"
          type="date"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
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
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import type { DatasetQueryParam, DatasetQueryParamValues } from './dataset-hub'
import { resolveVisibleParams } from './params'

defineOptions({ name: 'SheetReportFilterBar' })

const props = defineProps<{
  queryParams: DatasetQueryParam[]
  values: DatasetQueryParamValues
  activeDatasetIds: readonly string[]
}>()

const emit = defineEmits<{ 'update:values': [values: DatasetQueryParamValues] }>()

const visibleParams = computed(() =>
  resolveVisibleParams(props.queryParams, props.activeDatasetIds)
)

function emitChange(id: string, value: unknown): void {
  emit('update:values', { ...props.values, [id]: value })
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
