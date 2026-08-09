<template>
  <aside class="field-panel">
    <h3 class="field-panel__title">数据集字段</h3>
    <p class="field-panel__meta">
      当前选区：
      <u-tag size="small" type="primary">{{ selectionLabel }}</u-tag>
    </p>

    <u-input
      v-model="searchQuery"
      class="field-panel__search"
      size="small"
      clearable
      placeholder="搜索字段…"
    />

    <p class="field-panel__hint">点击或拖拽字段到网格；中文名为主，英文键为绑定标识。</p>

    <section v-for="dataset in visibleDatasets" :key="dataset.id" class="field-panel__dataset">
      <button
        type="button"
        class="field-panel__dataset-toggle"
        :aria-expanded="isDatasetExpanded(dataset.id)"
        @click="toggleDataset(dataset.id)"
      >
        <span
          class="field-panel__dataset-chevron"
          :class="{ 'field-panel__dataset-chevron--expanded': isDatasetExpanded(dataset.id) }"
          aria-hidden="true"
        >
          ▸
        </span>
        <span class="field-panel__dataset-name">{{ dataset.label }}</span>
        <span class="field-panel__dataset-count">{{ dataset.fields.length }}</span>
      </button>

      <div v-show="isDatasetExpanded(dataset.id)" class="field-panel__fields">
        <button
          v-for="field in dataset.fields"
          :key="field.name"
          type="button"
          class="field-panel__pill"
          :class="{ 'field-panel__pill--bound': isBound(dataset.id, field.name) }"
          draggable="true"
          :title="`${field.label}（${field.name}）`"
          @click="emit('bind', dataset.id, field.name)"
          @dragstart="onDragStart($event, dataset.id, field.name)"
        >
          <span class="field-panel__pill-icon" :data-type="field.type">{{
            fieldTypeGlyph(field.type)
          }}</span>
          <span class="field-panel__pill-label">{{ field.label }}</span>
          <span
            v-if="isBound(dataset.id, field.name)"
            class="field-panel__pill-bound"
            title="已绑定"
            >✓</span
          >
        </button>
      </div>
    </section>

    <p v-if="datasets.length === 0" class="field-panel__empty">
      尚无可用数据集，请点「数据源」创建连接与 SQL 数据集。
    </p>
    <p v-else-if="visibleDatasets.length === 0" class="field-panel__empty">没有匹配的字段。</p>
  </aside>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import { fieldTypeGlyph, filterDatasetsByQuery } from './designer/field-panel-helpers'
import type { DatasetCatalogItem } from './types'

defineOptions({ name: 'SheetReportFieldPanel' })

const props = defineProps<{
  /** 本报表已选用的数据集（含可编辑中文 label） */
  datasets: DatasetCatalogItem[]
  selectionLabel: string
  /** 已绑定字段键：`${datasetId}:${fieldName}` */
  boundKeys: Set<string>
}>()

const emit = defineEmits<{ bind: [datasetId: string, fieldName: string] }>()

const searchQuery = ref('')
const collapsedDatasetIds = ref<Set<string>>(new Set())

const visibleDatasets = computed(() => filterDatasetsByQuery(props.datasets, searchQuery.value))

const effectiveExpanded = computed(() => {
  const keyword = searchQuery.value.trim()
  if (!keyword) return collapsedDatasetIds.value
  return new Set<string>()
})

function isDatasetExpanded(datasetId: string): boolean {
  return !effectiveExpanded.value.has(datasetId)
}

function isBound(datasetId: string, fieldName: string): boolean {
  return props.boundKeys.has(`${datasetId}:${fieldName}`)
}

function toggleDataset(datasetId: string): void {
  const next = new Set(collapsedDatasetIds.value)
  if (next.has(datasetId)) next.delete(datasetId)
  else next.add(datasetId)
  collapsedDatasetIds.value = next
}

function onDragStart(event: DragEvent, datasetId: string, fieldName: string): void {
  event.dataTransfer?.setData('application/x-sheet-report-field', `${datasetId}:${fieldName}`)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'

  const target = event.currentTarget
  if (event.dataTransfer && target instanceof HTMLElement) {
    event.dataTransfer.setDragImage(
      target,
      Math.round(target.offsetWidth / 2),
      Math.round(target.offsetHeight / 2)
    )
  }
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
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.field-panel__search {
  margin-bottom: 8px;
}

.field-panel__hint {
  margin: 0 0 12px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--u-text-color-secondary, #64748b);
}

.field-panel__empty {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.field-panel__dataset {
  margin-bottom: 12px;
}

.field-panel__dataset-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 0 0 8px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: inherit;
}

.field-panel__dataset-chevron {
  display: inline-block;
  font-size: 11px;
  color: var(--u-text-color-secondary, #64748b);
  transition: transform 0.15s ease;
  transform: rotate(0deg);
}

.field-panel__dataset-chevron--expanded {
  transform: rotate(90deg);
}

.field-panel__dataset-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-panel__dataset-count {
  flex-shrink: 0;
  min-width: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--u-fill-color-light, #f1f5f9);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  color: var(--u-text-color-secondary, #64748b);
}

.field-panel__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.field-panel__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 calc(50% - 3px);
  min-width: 0;
  max-width: calc(50% - 3px);
  height: 24px;
  padding: 0 8px 0 4px;
  border: 1px solid var(--u-border-color, #cbd5e1);
  border-radius: 999px;
  background: var(--u-bg-color, #fff);
  cursor: grab;
  transition:
    background 0.15s,
    border-color 0.15s;

  &:hover {
    background: var(--u-fill-color-light, #f8fafc);
    border-color: var(--u-color-primary-light-5, #93c5fd);
  }

  &:active {
    cursor: grabbing;
  }
}

.field-panel__pill--bound {
  border-color: color-mix(
    in srgb,
    var(--u-color-success, #16a34a) 45%,
    var(--u-border-color, #cbd5e1)
  );
}

.field-panel__pill-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: var(--u-color-info, #0ea5e9);
  background: color-mix(in srgb, var(--u-color-info, #0ea5e9) 12%, transparent);

  &[data-type='number'] {
    color: var(--u-color-success, #16a34a);
    background: color-mix(in srgb, var(--u-color-success, #16a34a) 12%, transparent);
  }

  &[data-type='date'] {
    color: var(--u-color-warning, #d97706);
    background: color-mix(in srgb, var(--u-color-warning, #d97706) 12%, transparent);
  }
}

.field-panel__pill-label {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-panel__pill-bound {
  flex-shrink: 0;
  color: var(--u-color-success, #16a34a);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
</style>
