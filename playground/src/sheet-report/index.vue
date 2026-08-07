<template>
  <div class="sheet-report-demo">
    <header class="sheet-report-demo__header">
      <div>
        <h2 class="sheet-report-demo__title">报表模板 · Design Mode</h2>
        <p class="sheet-report-demo__hint">
          选中单元格后点击或拖入字段写入 Binding（namespace
          <code>report</code>）；设计态显示 Binding Placeholder，不写
          <code>v</code>。静态表头请直接输入单元格值。Ctrl/Cmd+Z 可撤销绑定。
        </p>
      </div>
      <div class="sheet-report-demo__actions">
        <label class="sheet-report-demo__mode">
          <input v-model="designMode" type="checkbox" />
          Design Mode（占位覆盖）
        </label>
        <button type="button" class="sheet-report-demo__btn" @click="saveSnapshot">保存快照</button>
        <button
          type="button"
          class="sheet-report-demo__btn"
          :disabled="!savedSnapshot"
          @click="restoreSnapshot"
        >
          恢复快照
        </button>
      </div>
    </header>

    <div class="sheet-report-demo__body">
      <aside class="sheet-report-demo__panel">
        <h3 class="sheet-report-demo__panel-title">数据集字段</h3>
        <p class="sheet-report-demo__panel-meta">当前选区：{{ selectionLabel }}</p>
        <section v-for="dataset in datasets" :key="dataset.id" class="sheet-report-demo__dataset">
          <h4 class="sheet-report-demo__dataset-name">{{ dataset.label }}</h4>
          <ul class="sheet-report-demo__fields">
            <li
              v-for="field in dataset.fields"
              :key="field.name"
              class="sheet-report-demo__field"
              draggable="true"
              @click="bindField(dataset.id, field.name)"
              @dragstart="onFieldDragStart($event, dataset.id, field.name)"
            >
              <span class="sheet-report-demo__field-name">{{ field.name }}</span>
              <span class="sheet-report-demo__field-label">{{ field.label }}</span>
            </li>
          </ul>
        </section>
      </aside>

      <div class="sheet-report-demo__grid" @dragover.prevent @drop="onGridDrop">
        <u-sheet
          ref="sheetRef"
          :workbook="workbook"
          :rows="24"
          :cols="10"
          :show-tabs="false"
          :resolve-display-value="resolveDisplayValue"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { USheet, type SheetExposed } from '@veltra/sheet'
import type { CellAddress } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import type { ResolveDisplayValue } from '@veltra/sheet-core/grid/sheet-grid'
import '@veltra/sheet/vue/style'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { REPORT_META_NAMESPACE, createReportBinding, formatBindingPlaceholder } from './binding'
import { MOCK_DATASETS } from './mock-dataset'
import type { ReportBinding } from './types'

const datasets = MOCK_DATASETS
const designMode = ref(true)
const savedSnapshot = ref<string | null>(null)
const selectionTick = ref(0)

const workbook = new Workbook()

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

const selectionLabel = computed(() => {
  selectionTick.value
  const selection = sheetRef.value?.getContext().getSelection()
  if (!selection?.activeCell) return '—'
  const { row, col } = selection.activeCell
  const colName = String.fromCharCode(65 + col)
  return `${colName}${row + 1}`
})

function activeSheet() {
  return sheetRef.value?.getActiveSheet() ?? workbook.activeSheet
}

/** Design Mode：Binding Placeholder 覆盖显示，不写 v */
const resolveDisplayValue: ResolveDisplayValue = (addr, base) => {
  if (!designMode.value) return base
  const binding = activeSheet().getCellMeta<ReportBinding>(addr, REPORT_META_NAMESPACE)
  if (binding) return formatBindingPlaceholder(binding)
  return base
}

watch(designMode, () => {
  sheetRef.value?.getGrid()?.refresh()
})

function bumpSelection(): void {
  selectionTick.value++
}

function bindField(datasetId: string, fieldName: string, addr?: CellAddress): void {
  const dataset = datasets.find((d) => d.id === datasetId)
  if (!dataset) return

  const target =
    addr ??
    sheetRef.value?.getContext().getSelection().activeCell ??
    activeSheet().getSelection().activeCell
  if (!target) return

  const binding = createReportBinding(dataset, fieldName)
  activeSheet().setCellMeta(target, REPORT_META_NAMESPACE, binding)
}

function onFieldDragStart(event: DragEvent, datasetId: string, fieldName: string): void {
  event.dataTransfer?.setData('application/x-sheet-report-field', `${datasetId}:${fieldName}`)
  event.dataTransfer!.effectAllowed = 'copy'
}

function onGridDrop(event: DragEvent): void {
  const raw = event.dataTransfer?.getData('application/x-sheet-report-field')
  if (!raw) return

  const [datasetId, fieldName] = raw.split(':')
  if (!datasetId || !fieldName) return

  const grid = sheetRef.value?.getGrid()
  const host = event.currentTarget as HTMLElement
  const gridEl = host.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!grid || !gridEl) return

  const rect = gridEl.getBoundingClientRect()
  const addr = grid.hitTestSheetAddr(event.clientX - rect.left, event.clientY - rect.top)
  if (addr) {
    bindField(datasetId, fieldName, addr)
    sheetRef.value?.getContext().selectCell(addr)
  } else {
    bindField(datasetId, fieldName)
  }
}

function saveSnapshot(): void {
  savedSnapshot.value = JSON.stringify(activeSheet().snapshot())
}

function restoreSnapshot(): void {
  if (!savedSnapshot.value) return
  const snap = JSON.parse(savedSnapshot.value)
  activeSheet().restore(snap)
  sheetRef.value?.getGrid()?.refresh()
}

function seedTemplate(): void {
  const sheet = workbook.activeSheet
  sheet.setCells([
    { addr: { row: 0, col: 0 }, value: '客户' },
    { addr: { row: 0, col: 1 }, value: '订单号' },
    { addr: { row: 0, col: 2 }, value: '金额' },
    { addr: { row: 0, col: 3 }, value: '下单日期' }
  ])
  sheet.history.clear()
}

let offSelection: (() => void) | undefined

onMounted(() => {
  seedTemplate()
  offSelection = workbook.activeSheet.on('selection-change', bumpSelection)
})

onBeforeUnmount(() => {
  offSelection?.()
})
</script>

<style scoped lang="scss">
.sheet-report-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 48px);
  min-height: 520px;
  padding: 12px 16px 16px;
  box-sizing: border-box;
}

.sheet-report-demo__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sheet-report-demo__title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.sheet-report-demo__hint {
  margin: 0;
  font-size: 13px;
  color: var(--u-text-color-secondary, #64748b);
  max-width: 720px;
  line-height: 1.5;

  code {
    font-size: 12px;
    padding: 0 4px;
    border-radius: 4px;
    background: var(--u-fill-color-light, #f1f5f9);
  }
}

.sheet-report-demo__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.sheet-report-demo__mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  user-select: none;
}

.sheet-report-demo__btn {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 6px;
  background: var(--u-bg-color, #fff);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.sheet-report-demo__body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 12px;
}

.sheet-report-demo__panel {
  width: 220px;
  flex-shrink: 0;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 8px;
  background: var(--u-bg-color, #fff);
}

.sheet-report-demo__panel-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}

.sheet-report-demo__panel-meta {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.sheet-report-demo__dataset-name {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 500;
}

.sheet-report-demo__fields {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
}

.sheet-report-demo__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
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

.sheet-report-demo__field-name {
  font-family: ui-monospace, monospace;
  font-size: 12px;
}

.sheet-report-demo__field-label {
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.sheet-report-demo__grid {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
