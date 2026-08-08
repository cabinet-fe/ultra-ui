<template>
  <aside class="field-panel">
    <h3 class="field-panel__title">数据集字段</h3>
    <p class="field-panel__meta">
      当前选区：
      <u-tag size="small" type="primary">{{ selectionLabel }}</u-tag>
    </p>

    <section v-for="dataset in datasets" :key="dataset.id" class="field-panel__dataset">
      <h4 class="field-panel__dataset-name">{{ dataset.label }}</h4>
      <ul class="field-panel__fields">
        <li
          v-for="field in dataset.fields"
          :key="field.name"
          class="field-panel__field"
          draggable="true"
          @click="emit('bind', dataset.id, field.name)"
          @dragstart="onDragStart($event, dataset.id, field.name)"
        >
          <div class="field-panel__field-main">
            <span class="field-panel__field-label">{{ field.label }}</span>
            <span v-if="isBound(dataset.id, field.name)" class="field-panel__bound" title="已绑定"
              >✓</span
            >
          </div>
          <div class="field-panel__field-sub">
            <span class="field-panel__field-name">{{ field.name }}</span>
            <u-tag size="small" :type="fieldTypeColor(field.type)">{{ field.type }}</u-tag>
          </div>
        </li>
      </ul>
    </section>
  </aside>
</template>

<script lang="ts" setup>
import type { ColorType } from '@veltra/utils'

import type { DatasetField, MockDataset } from './types'

defineOptions({ name: 'SheetReportFieldPanel' })

const props = defineProps<{
  datasets: MockDataset[]
  selectionLabel: string
  /** 已绑定字段键：`${datasetId}:${fieldName}` */
  boundKeys: Set<string>
}>()

const emit = defineEmits<{
  bind: [datasetId: string, fieldName: string]
  'drag-start': [event: DragEvent, datasetId: string, fieldName: string]
}>()

function isBound(datasetId: string, fieldName: string): boolean {
  return props.boundKeys.has(`${datasetId}:${fieldName}`)
}

function fieldTypeColor(type: DatasetField['type']): ColorType {
  if (type === 'number') return 'success'
  if (type === 'date') return 'warning'
  return 'info'
}

function onDragStart(event: DragEvent, datasetId: string, fieldName: string): void {
  event.dataTransfer?.setData('application/x-sheet-report-field', `${datasetId}:${fieldName}`)
  event.dataTransfer!.effectAllowed = 'copy'
  emit('drag-start', event, datasetId, fieldName)
}
</script>

<style scoped lang="scss">
.field-panel {
  width: 220px;
  flex-shrink: 0;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 8px;
  background: var(--u-bg-color, #fff);
}

.field-panel__title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}

.field-panel__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.field-panel__dataset-name {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 500;
}

.field-panel__fields {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
}

.field-panel__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  margin-bottom: 6px;
  border: 1px dashed var(--u-border-color, #cbd5e1);
  border-radius: 6px;
  cursor: grab;
  transition: background 0.15s;

  &:hover {
    background: var(--u-fill-color-light, #f8fafc);
  }
}

.field-panel__field-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.field-panel__field-label {
  font-size: 13px;
  font-weight: 500;
}

.field-panel__bound {
  color: var(--u-color-success, #16a34a);
  font-size: 12px;
  font-weight: 600;
}

.field-panel__field-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.field-panel__field-name {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--u-text-color-secondary, #64748b);
}
</style>
