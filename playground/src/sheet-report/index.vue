<template>
  <div class="sheet-report-demo">
    <header class="sheet-report-demo__header">
      <div>
        <h2 class="sheet-report-demo__title">报表模板 · Design Mode</h2>
        <p class="sheet-report-demo__hint">
          选中单元格后点击或拖入字段写入 Binding（namespace
          <code>report</code>）；设计态显示 Binding Placeholder，不写 <code>v</code>。可配置
          Aggregate、Expand、Left Parent 构建分组明细与 Subtotal Row。Ctrl/Cmd+Z 可撤销绑定。
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

      <aside class="sheet-report-demo__props">
        <h3 class="sheet-report-demo__panel-title">Binding 属性</h3>
        <template v-if="activeBinding && activeCell">
          <p class="sheet-report-demo__props-placeholder">
            {{ formatBindingPlaceholder(activeBinding) }}
          </p>

          <fieldset class="sheet-report-demo__fieldset">
            <legend>Aggregate</legend>
            <label
              v-for="opt in aggregateOptions"
              :key="opt.value"
              class="sheet-report-demo__radio"
            >
              <input
                type="radio"
                name="aggregate"
                :value="opt.value"
                :checked="activeBinding.aggregate === opt.value"
                @change="setAggregate(opt.value)"
              />
              {{ opt.label }}
            </label>
          </fieldset>

          <fieldset class="sheet-report-demo__fieldset">
            <legend>Expand</legend>
            <label v-for="opt in expandOptions" :key="opt.value" class="sheet-report-demo__radio">
              <input
                type="radio"
                name="expand"
                :value="opt.value"
                :checked="activeBinding.expand === opt.value"
                :disabled="activeBinding.aggregate === 'sum' && opt.value === 'down'"
                @change="setExpand(opt.value)"
              />
              {{ opt.label }}
            </label>
          </fieldset>

          <fieldset class="sheet-report-demo__fieldset">
            <legend>Left Parent</legend>
            <label
              v-for="opt in leftParentModeOptions"
              :key="opt.value"
              class="sheet-report-demo__radio"
            >
              <input
                type="radio"
                name="leftParent"
                :value="opt.value"
                :checked="leftParentMode === opt.value"
                @change="setLeftParentMode(opt.value)"
              />
              {{ opt.label }}
            </label>
            <label v-if="leftParentMode === 'specify'" class="sheet-report-demo__address">
              设计地址
              <input
                v-model="leftParentAddressInput"
                class="sheet-report-demo__address-input"
                placeholder="如 B2"
                @change="commitLeftParentAddress"
              />
            </label>
            <p v-if="leftParentMode === 'default'" class="sheet-report-demo__props-meta">
              解析结果：{{ resolvedLeftParentLabel }}
            </p>
          </fieldset>
        </template>
        <p v-else class="sheet-report-demo__props-empty">
          选中含 Binding 的单元格以编辑 Aggregate、Expand、Left Parent。
        </p>
      </aside>
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

import {
  REPORT_META_NAMESPACE,
  aggregateDefaultExpand,
  createReportBinding,
  formatBindingPlaceholder,
  formatCellAddress,
  parseCellAddress,
  resolveLeftParent
} from './binding'
import { MOCK_DATASETS, ORDERS_DATASET } from './mock-dataset'
import type { ReportAggregate, ReportBinding, ReportExpand, ReportLeftParent } from './types'

const datasets = MOCK_DATASETS
const designMode = ref(true)
const savedSnapshot = ref<string | null>(null)
const selectionTick = ref(0)
const leftParentAddressInput = ref('')

const workbook = new Workbook()

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

const aggregateOptions = [
  { value: 'select' as const, label: 'List (select)' },
  { value: 'group' as const, label: 'Group' },
  { value: 'sum' as const, label: 'Sum' }
]

const expandOptions = [
  { value: 'down' as const, label: '纵向 (down)' },
  { value: 'none' as const, label: '不扩展 (none)' }
]

type LeftParentMode = 'none' | 'default' | 'specify'

const leftParentModeOptions = [
  { value: 'none' as const, label: '无' },
  { value: 'default' as const, label: '默认（同行向左）' },
  { value: 'specify' as const, label: '指定设计地址' }
]

const selectionLabel = computed(() => {
  selectionTick.value
  const selection = sheetRef.value?.getContext().getSelection()
  if (!selection?.activeCell) return '—'
  return formatCellAddress(selection.activeCell)
})

const activeCell = computed((): CellAddress | null => {
  selectionTick.value
  return sheetRef.value?.getContext().getSelection().activeCell ?? null
})

const activeBinding = computed((): ReportBinding | undefined => {
  const cell = activeCell.value
  if (!cell) return undefined
  return activeSheet().getCellMeta<ReportBinding>(cell, REPORT_META_NAMESPACE)
})

const leftParentMode = computed((): LeftParentMode => {
  const binding = activeBinding.value
  if (!binding) return 'default'
  if (binding.leftParent === 'none') return 'none'
  if (binding.leftParent === 'default') return 'default'
  return 'specify'
})

const resolvedLeftParentLabel = computed(() => {
  const binding = activeBinding.value
  const cell = activeCell.value
  if (!binding || !cell) return '—'

  const resolved = resolveLeftParent(binding, cell, getBindingAt)
  return resolved ? formatCellAddress(resolved) : '—'
})

watch(
  activeBinding,
  (binding) => {
    if (!binding || binding.leftParent === 'none' || binding.leftParent === 'default') {
      leftParentAddressInput.value = ''
      return
    }
    leftParentAddressInput.value = formatCellAddress(binding.leftParent)
  },
  { immediate: true }
)

function activeSheet() {
  return sheetRef.value?.getActiveSheet() ?? workbook.activeSheet
}

function getBindingAt(addr: CellAddress): ReportBinding | undefined {
  return activeSheet().getCellMeta<ReportBinding>(addr, REPORT_META_NAMESPACE)
}

function refreshGrid(): void {
  sheetRef.value?.getGrid()?.refresh()
}

/** Design Mode：Binding Placeholder 覆盖显示，不写 v */
const resolveDisplayValue: ResolveDisplayValue = (addr, base) => {
  if (!designMode.value) return base
  const binding = getBindingAt(addr)
  if (binding) return formatBindingPlaceholder(binding)
  return base
}

watch(designMode, refreshGrid)

function bumpSelection(): void {
  selectionTick.value++
}

function patchActiveBinding(patch: Partial<ReportBinding>): void {
  const cell = activeCell.value
  const binding = activeBinding.value
  if (!cell || !binding) return

  const next: ReportBinding = { ...binding, ...patch }
  if (patch.aggregate) {
    next.expand = aggregateDefaultExpand(patch.aggregate)
  }

  activeSheet().setCellMeta(cell, REPORT_META_NAMESPACE, next)
  refreshGrid()
  bumpSelection()
}

function setAggregate(aggregate: ReportAggregate): void {
  patchActiveBinding({ aggregate })
}

function setExpand(expand: ReportExpand): void {
  patchActiveBinding({ expand })
}

function setLeftParentMode(mode: LeftParentMode): void {
  if (mode === 'specify') {
    const fallback = activeCell.value ?? { row: 0, col: 0 }
    leftParentAddressInput.value = formatCellAddress(fallback)
    patchActiveBinding({ leftParent: fallback })
    return
  }
  patchActiveBinding({ leftParent: mode satisfies ReportLeftParent })
}

function commitLeftParentAddress(): void {
  const parsed = parseCellAddress(leftParentAddressInput.value)
  if (!parsed) return
  patchActiveBinding({ leftParent: parsed })
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
  refreshGrid()
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
  refreshGrid()
  bumpSelection()
}

/** 预置：客户 group → 订单明细 → Subtotal Row */
function seedTemplate(): void {
  const sheet = workbook.activeSheet

  sheet.setCells([
    { addr: { row: 0, col: 0 }, value: '客户' },
    { addr: { row: 0, col: 1 }, value: '订单号' },
    { addr: { row: 0, col: 2 }, value: '金额' },
    { addr: { row: 0, col: 3 }, value: '下单日期' },
    { addr: { row: 3, col: 1 }, value: '合计' }
  ])

  const customerGroup = createReportBinding(ORDERS_DATASET, 'customer')
  customerGroup.aggregate = 'group'
  customerGroup.leftParent = 'none'
  sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, customerGroup)

  const groupParent = { row: 1, col: 0 }

  const orderNo = createReportBinding(ORDERS_DATASET, 'orderNo')
  orderNo.leftParent = groupParent
  sheet.setCellMeta({ row: 2, col: 1 }, REPORT_META_NAMESPACE, orderNo)

  const amount = createReportBinding(ORDERS_DATASET, 'amount')
  amount.leftParent = groupParent
  sheet.setCellMeta({ row: 2, col: 2 }, REPORT_META_NAMESPACE, amount)

  const orderDate = createReportBinding(ORDERS_DATASET, 'orderDate')
  orderDate.leftParent = groupParent
  sheet.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, orderDate)

  const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
  subtotal.aggregate = 'sum'
  subtotal.expand = 'none'
  subtotal.leftParent = groupParent
  sheet.setCellMeta({ row: 3, col: 2 }, REPORT_META_NAMESPACE, subtotal)

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

.sheet-report-demo__panel,
.sheet-report-demo__props {
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

.sheet-report-demo__props-placeholder {
  margin: 0 0 12px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--u-color-primary, #2563eb);
  word-break: break-all;
}

.sheet-report-demo__props-empty,
.sheet-report-demo__props-meta {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
  line-height: 1.5;
}

.sheet-report-demo__fieldset {
  margin: 0 0 12px;
  padding: 8px 10px 10px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 6px;

  legend {
    padding: 0 4px;
    font-size: 12px;
    font-weight: 500;
  }
}

.sheet-report-demo__radio {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  cursor: pointer;

  &:last-child {
    margin-bottom: 0;
  }
}

.sheet-report-demo__address {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
}

.sheet-report-demo__address-input {
  padding: 4px 8px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  border: 1px solid var(--u-border-color, #cbd5e1);
  border-radius: 4px;
}
</style>
