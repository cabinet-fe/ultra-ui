<template>
  <aside :class="cls.b">
    <h3 :class="cls.e('title')">数据集字段</h3>
    <p :class="cls.e('meta')">
      当前选区：
      <u-tag size="small" type="primary">{{ selectionLabel }}</u-tag>
    </p>

    <u-input
      v-model="searchQuery"
      :class="cls.e('search')"
      size="small"
      clearable
      placeholder="搜索字段…"
    />

    <p :class="cls.e('hint')">点击或拖拽字段到网格；中文名为主，英文键为绑定标识。</p>

    <section v-for="dataset in visibleDatasets" :key="dataset.id" :class="cls.e('dataset')">
      <u-button
        text
        size="small"
        :class="cls.e('dataset-toggle')"
        :aria-expanded="isDatasetExpanded(dataset.id)"
        @click="toggleDataset(dataset.id)"
      >
        <span
          :class="[cls.e('dataset-chevron'), bem.is('expanded', isDatasetExpanded(dataset.id))]"
          aria-hidden="true"
        >
          ▸
        </span>
        <span :class="cls.e('dataset-name')">{{ dataset.label }}</span>
        <span :class="cls.e('dataset-count')">{{ dataset.fields.length }}</span>
      </u-button>

      <div v-show="isDatasetExpanded(dataset.id)" :class="cls.e('fields')">
        <div
          v-for="field in dataset.fields"
          :key="field.name"
          role="button"
          tabindex="0"
          :class="[cls.e('pill'), bem.is('bound', isBound(dataset.id, field.name))]"
          draggable="true"
          :title="`${field.label}（${field.name}）`"
          @click="emit('bind', dataset.id, field.name)"
          @keydown.enter.prevent="emit('bind', dataset.id, field.name)"
          @keydown.space.prevent="emit('bind', dataset.id, field.name)"
          @dragstart="onDragStart($event, dataset.id, field.name)"
        >
          <span :class="cls.e('pill-icon')" :data-type="field.type">{{
            fieldTypeGlyph(field.type)
          }}</span>
          <span :class="cls.e('pill-label')">{{ field.label }}</span>
          <span v-if="isBound(dataset.id, field.name)" :class="cls.e('pill-bound')" title="已绑定"
            >✓</span
          >
        </div>
      </div>
    </section>

    <p v-if="datasets.length === 0" :class="cls.e('empty')">
      尚无可用数据集，请点「数据中枢」创建连接与 SQL 数据集。
    </p>
    <p v-else-if="visibleDatasets.length === 0" :class="cls.e('empty')">没有匹配的字段。</p>
  </aside>
</template>

<script lang="ts" setup>
import { UButton, UInput, UTag } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, ref } from 'vue'

import type { DatasetCatalogItem } from '../../report/types'
import {
  FIELD_DRAG_MIME,
  fieldTypeGlyph,
  filterDatasetsByQuery,
  formatFieldDragPayload
} from './field-panel-helpers'

defineOptions({ name: 'UReportFieldPanel' })

const props = defineProps<{
  /** 本报表已选用的数据集（含可编辑中文 label） */
  datasets: DatasetCatalogItem[]
  selectionLabel: string
  /** 已绑定字段键：`${datasetId}:${fieldName}` */
  boundKeys: Set<string>
}>()

const emit = defineEmits<{ bind: [datasetId: string, fieldName: string] }>()

const cls = bem('report-field-panel')

const searchQuery = ref('')
const collapsedDatasetIds = ref<Set<string>>(new Set())

const visibleDatasets = computed(() => filterDatasetsByQuery(props.datasets, searchQuery.value))

/** 折叠集合；搜索时视为全部展开（返回空集） */
const effectiveCollapsed = computed(() => {
  const keyword = searchQuery.value.trim()
  if (!keyword) return collapsedDatasetIds.value
  return new Set<string>()
})

function isDatasetExpanded(datasetId: string): boolean {
  return !effectiveCollapsed.value.has(datasetId)
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
  event.dataTransfer?.setData(FIELD_DRAG_MIME, formatFieldDragPayload(datasetId, fieldName))
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
