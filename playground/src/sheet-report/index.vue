<template>
  <div class="sheet-report-demo">
    <header class="sheet-report-demo__header">
      <div>
        <h2 class="sheet-report-demo__title">
          报表模板设计 · {{ isPreview ? '预览模式' : '设计模式' }}
        </h2>
        <p class="sheet-report-demo__hint">
          左侧点击或拖拽字段绑定到选中格；选中已绑定格可就地编辑聚合/扩展/左父格。点
          <strong>预览模式</strong> 按 mock 数据展开渲染结果。点「数据源」管理模拟数据库与查询参数。
        </p>
      </div>
      <div class="sheet-report-demo__actions">
        <u-button size="small" plain @click="helpVisible = true">使用说明</u-button>
        <u-button size="small" plain @click="datasetVisible = true">数据源</u-button>
        <div class="sheet-report-demo__mode-toggle" role="group" aria-label="视图模式">
          <u-button
            size="small"
            :type="viewMode === 'design' ? 'primary' : undefined"
            :plain="viewMode !== 'design'"
            @click="setViewMode('design')"
          >
            设计模式
          </u-button>
          <u-button
            size="small"
            :type="viewMode === 'preview' ? 'primary' : undefined"
            :plain="viewMode !== 'preview'"
            @click="setViewMode('preview')"
          >
            预览模式
          </u-button>
        </div>
        <u-button size="small" :disabled="isPreview" @click="saveSnapshot">保存快照</u-button>
        <u-button size="small" :disabled="isPreview || !savedSnapshot" @click="restoreSnapshot">
          恢复快照
        </u-button>
        <u-pop-confirm title="确定重置为默认模板？当前绑定与编辑将丢失。" @confirm="resetTemplate">
          <template #reference>
            <u-button size="small" type="warning" plain :disabled="isPreview">重置模板</u-button>
          </template>
        </u-pop-confirm>
      </div>
    </header>

    <help-dialog v-model="helpVisible" />
    <dataset-dialog
      v-model="datasetVisible"
      :records="datasetRecords"
      :items="reportDatasets"
      :query-params="dataHub.queryParams"
      :param-values="paramValues"
      @update:items="reportDatasets = $event"
      @update:param-values="onParamValuesChange"
      @reset="resetReportDatasets"
      @reset-params="resetParamValues"
    />

    <div class="sheet-report-demo__body">
      <field-panel
        class="sheet-report-demo__field-panel"
        :class="{ 'sheet-report-demo__field-panel--disabled': isPreview }"
        :datasets="panelDatasets"
        :selection-label="selectionLabel"
        :bound-keys="boundKeys"
        @bind="(datasetId, fieldName) => bindField(datasetId, fieldName)"
      />

      <div ref="gridHostRef" class="sheet-report-demo__grid" @dragover.prevent @drop="onGridDrop">
        <u-sheet
          ref="sheetRef"
          class="sheet-report-demo__sheet"
          :workbook="workbook"
          :rows="isPreview ? 50 : 24"
          :cols="10"
          :show-tabs="false"
          :show-toolbar="!isPreview"
          :show-formula-bar="!isPreview"
          :readonly="isPreview"
          :resolve-display-value="resolveDisplayValue"
        />

        <binding-editor
          v-if="!isPreview"
          :cell="activeCell"
          :binding="activeBinding ?? null"
          :resolved-left-parent-label="resolvedLeftParentLabel"
          :host-el="gridHostEl"
          :get-grid="getDesignGrid"
          :resolve-field-label="resolveReportFieldLabel"
          @patch="patchActiveBinding"
          @remove="removeActiveBinding"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { USheet, type SheetExposed } from '@veltra/sheet'
import type { CellAddress, Sheet, SheetSnapshot } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import type { ResolveDisplayValue } from '@veltra/sheet-core/grid/sheet-grid'
import '@veltra/sheet/vue/style'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import {
  REPORT_META_NAMESPACE,
  createReportBinding,
  formatBindingPlaceholder,
  formatCellAddress,
  resolveLeftParent
} from './binding'
import BindingEditor from './binding-editor.vue'
import DatasetDialog from './dataset-dialog.vue'
import { DATASET_CATALOG, DEFAULT_SELECTED_DATASET_IDS, createMockDataHub } from './dataset-hub'
import FieldPanel from './field-panel.vue'
import HelpDialog from './help-dialog.vue'
import { renderReport } from './render'
import {
  DEMO_COL_WIDTHS,
  applyColWidths,
  readDemoColWidths,
  seedGroupDetailTemplate
} from './template'
import type { DatasetCatalogItem, ReportBinding, ReportDatasetConfig } from './types'

defineOptions({ name: 'SheetReportDemo' })

type ViewMode = 'design' | 'preview'

/** 演示层快照：SheetSnapshot 不含列宽，一并持久化 */
type DemoSnapshotPayload = { sheet: SheetSnapshot; colWidths: Array<[number, number]> }

/** Mock Data Hub：模拟数据库 Catalog + 查询参数 + Records 生成 */
const dataHub = createMockDataHub()
const paramValues = ref(dataHub.getParamValues())
const datasetRecords = computed(() => {
  paramValues.value
  return dataHub.getRecords()
})

/** 从 catalog 生成报表数据集配置；默认选用订单 + 客户 */
function buildReportDatasets(): ReportDatasetConfig[] {
  const defaults = new Set<string>(DEFAULT_SELECTED_DATASET_IDS)
  const records = dataHub.getRecords()
  return DATASET_CATALOG.map((dataset) => ({
    id: dataset.id,
    label: dataset.label,
    selected: defaults.has(dataset.id),
    fields: dataset.fields.map((field) => ({ ...field })),
    rowCount: records[dataset.id]?.length ?? 0
  }))
}

function onParamValuesChange(values: typeof paramValues.value): void {
  dataHub.setParamValues(values)
  paramValues.value = dataHub.getParamValues()
  syncDatasetRowCounts()
}

function resetParamValues(): void {
  dataHub.resetParamValues()
  paramValues.value = dataHub.getParamValues()
  syncDatasetRowCounts()
}

function syncDatasetRowCounts(): void {
  const records = dataHub.getRecords()
  reportDatasets.value = reportDatasets.value.map((item) => ({
    ...item,
    rowCount: records[item.id]?.length ?? 0
  }))
}

const viewMode = ref<ViewMode>('design')
const helpVisible = ref(false)
const datasetVisible = ref(false)
/** 本报表选用与字段 schema 配置（可改中文 label；不改 catalog 源） */
const reportDatasets = ref<ReportDatasetConfig[]>(buildReportDatasets())

const panelDatasets = computed((): DatasetCatalogItem[] =>
  reportDatasets.value
    .filter((item) => item.selected)
    .map((item) => ({ id: item.id, label: item.label, fields: item.fields }))
)

function resetReportDatasets(): void {
  reportDatasets.value = buildReportDatasets()
}

/** 用报表字段配置解析中文 label（占位 / 编辑卡片） */
function resolveReportFieldLabel(datasetId: string, fieldName: string): string {
  const item = reportDatasets.value.find((dataset) => dataset.id === datasetId)
  const field = item?.fields.find((f) => f.name === fieldName)
  return field?.label ?? fieldName
}

/** 进入预览前保存的模板快照，切回设计态时恢复 */
const templateSnapshot = ref<string | null>(null)
const savedSnapshot = ref<string | null>(null)
/** 当前设计态列宽；DEMO_COL_WIDTHS 仅作初始/重置种子 */
const designColWidths = ref<Array<[number, number]>>(
  DEMO_COL_WIDTHS.map(([col, width]) => [col, width])
)
const selectionTick = ref(0)
const metaTick = ref(0)

const workbook = new Workbook()

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')
const gridHostRef = useTemplateRef<HTMLElement>('gridHostRef')
const gridHostEl = computed(() => gridHostRef.value ?? null)

const isPreview = computed(() => viewMode.value === 'preview')

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
  metaTick.value
  const cell = activeCell.value
  if (!cell) return undefined
  return activeSheet().getCellMeta<ReportBinding>(cell, REPORT_META_NAMESPACE)
})

const boundKeys = computed(() => {
  metaTick.value
  const keys = new Set<string>()
  const sheet = workbook.activeSheet
  for (const [, namespace, payload] of sheet.entriesCellMeta()) {
    if (namespace !== REPORT_META_NAMESPACE) continue
    const binding = payload as ReportBinding
    keys.add(`${binding.dataset}:${binding.field}`)
  }
  return keys
})

const resolvedLeftParentLabel = computed(() => {
  metaTick.value
  const binding = activeBinding.value
  const cell = activeCell.value
  if (!binding || !cell) return '—'
  const resolved = resolveLeftParent(binding, cell, getBindingAt)
  return resolved ? formatCellAddress(resolved) : '—'
})

let offSelection: (() => void) | undefined
let offMeta: (() => void) | undefined

function activeSheet(): Sheet {
  return sheetRef.value?.getActiveSheet() ?? workbook.activeSheet
}

function getBindingAt(addr: CellAddress): ReportBinding | undefined {
  return activeSheet().getCellMeta<ReportBinding>(addr, REPORT_META_NAMESPACE)
}

function getDesignGrid() {
  return sheetRef.value?.getGrid()
}

function bumpSelection(): void {
  selectionTick.value++
}

function bumpMeta(): void {
  metaTick.value++
}

function refreshGrid(): void {
  sheetRef.value?.getGrid()?.refresh()
}

/** 预览态下查询参数变更时重新渲染 */
watch(datasetRecords, () => {
  if (!isPreview.value || !templateSnapshot.value) return
  const filled = renderReport(JSON.parse(templateSnapshot.value), datasetRecords.value)
  applySheetSnapshot(filled)
})

/** 字段中文名变更后刷新设计态占位 */
watch(
  reportDatasets,
  () => {
    refreshGrid()
    bumpMeta()
  },
  { deep: true }
)

/** 设计态显示绑定占位符；预览态用渲染后的真实值 */
const resolveDisplayValue: ResolveDisplayValue = (addr, base) => {
  if (isPreview.value) return base
  const binding = getBindingAt(addr)
  if (binding) return formatBindingPlaceholder(binding, resolveReportFieldLabel)
  return base
}

/** 从当前网格捕获设计列宽到 designColWidths（网格未就绪则保留旧值） */
function captureDesignColWidths(): void {
  const widths = readDemoColWidths(sheetRef.value?.getGrid())
  if (widths) designColWidths.value = widths
}

function syncGridView(): void {
  const grid = sheetRef.value?.getGrid()
  grid?.flushPending()
  grid?.refresh()
  // 写入当前设计态列宽（非 DEMO 常量），避免模式切换覆盖用户拖拽
  applyColWidths(grid, designColWidths.value)
}

/** restore 不发 content-reset，需显式刷新；readonly 切换会 rebuildGrid，再刷列宽 */
function applySheetSnapshot(snapshot: SheetSnapshot): void {
  const sheet = activeSheet()
  sheet.restore(snapshot)
  sheet.restoreContent(snapshot)
  sheet.history.clear()
  bumpMeta()
  void nextTick(syncGridView)
}

function setViewMode(mode: ViewMode): void {
  if (viewMode.value === mode) return

  if (mode === 'preview') {
    // 进预览前先记下设计态列宽；快照不含列宽
    captureDesignColWidths()
    templateSnapshot.value = JSON.stringify(activeSheet().snapshot())
    const filled = renderReport(JSON.parse(templateSnapshot.value), datasetRecords.value)
    applySheetSnapshot(filled)
  } else if (templateSnapshot.value) {
    // 切回设计：恢复模板；列宽仍用进预览前捕获的 designColWidths
    applySheetSnapshot(JSON.parse(templateSnapshot.value))
  }

  viewMode.value = mode
  bumpSelection()
}

// readonly / rows 变化会 rebuildGrid，重建后补列宽
watch(isPreview, () => {
  void nextTick(syncGridView)
})

function patchActiveBinding(patch: Partial<ReportBinding>): void {
  if (isPreview.value) return
  const cell = activeCell.value
  const binding = activeBinding.value
  if (!cell || !binding) return

  const next: ReportBinding = { ...binding, ...patch }
  activeSheet().setCellMeta(cell, REPORT_META_NAMESPACE, next)
  refreshGrid()
  bumpMeta()
  bumpSelection()
}

function removeActiveBinding(): void {
  if (isPreview.value) return
  const cell = activeCell.value
  if (!cell) return
  activeSheet().clearCellMeta(cell, REPORT_META_NAMESPACE)
  refreshGrid()
  bumpMeta()
  bumpSelection()
}

function bindField(datasetId: string, fieldName: string, addr?: CellAddress): void {
  if (isPreview.value) return
  const dataset = reportDatasets.value.find((d) => d.id === datasetId && d.selected)
  if (!dataset) return

  const target =
    addr ??
    sheetRef.value?.getContext().getSelection().activeCell ??
    activeSheet().getSelection().activeCell
  if (!target) return

  const binding = createReportBinding(dataset, fieldName)
  if (fieldName === 'customer') {
    binding.aggregate = 'group'
    binding.leftParent = 'none'
  } else if (target.row === 1 && target.col === 0) {
    // 分组格勿被普通 list 覆盖
    binding.aggregate = 'group'
    binding.leftParent = 'none'
  }

  activeSheet().setCellMeta(target, REPORT_META_NAMESPACE, binding)
  refreshGrid()
  bumpMeta()
}

function onGridDrop(event: DragEvent): void {
  if (isPreview.value) return
  const raw = event.dataTransfer?.getData('application/x-sheet-report-field')
  if (!raw) return

  const [datasetId, fieldName] = raw.split(':')
  if (!datasetId || !fieldName) return

  const grid = sheetRef.value?.getGrid()
  const host = event.currentTarget as HTMLElement
  const gridEl = host.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!grid || !gridEl) return

  const rect = gridEl.getBoundingClientRect()
  const dropAddr = grid.hitTestSheetAddr(event.clientX - rect.left, event.clientY - rect.top)
  if (dropAddr) {
    bindField(datasetId, fieldName, dropAddr)
    sheetRef.value?.getContext().selectCell(dropAddr)
  } else {
    bindField(datasetId, fieldName)
  }
}

function saveSnapshot(): void {
  if (isPreview.value) return
  captureDesignColWidths()
  const payload: DemoSnapshotPayload = {
    sheet: activeSheet().snapshot(),
    colWidths: designColWidths.value.map(([col, width]) => [col, width])
  }
  savedSnapshot.value = JSON.stringify(payload)
}

function restoreSnapshot(): void {
  if (isPreview.value || !savedSnapshot.value) return
  const parsed = JSON.parse(savedSnapshot.value) as DemoSnapshotPayload | SheetSnapshot
  if (
    parsed &&
    typeof parsed === 'object' &&
    'sheet' in parsed &&
    'colWidths' in parsed &&
    Array.isArray(parsed.colWidths)
  ) {
    designColWidths.value = parsed.colWidths.map(([col, width]) => [col, width])
    applySheetSnapshot(parsed.sheet)
  } else {
    applySheetSnapshot(parsed as SheetSnapshot)
  }
  bumpSelection()
}

function seedTemplate(): void {
  seedGroupDetailTemplate(workbook.activeSheet)
  workbook.activeSheet.history.clear()
  bumpMeta()
}

function resetTemplate(): void {
  if (isPreview.value) return
  const sheet = activeSheet()
  sheet.restoreContent({
    cells: [],
    styles: [],
    merges: [],
    meta: [],
    frozen: { rows: 0, cols: 0 },
    rows: sheet.rowCount,
    cols: sheet.colCount
  })
  seedGroupDetailTemplate(sheet)
  sheet.history.clear()
  // 重置回演示种子列宽
  designColWidths.value = DEMO_COL_WIDTHS.map(([col, width]) => [col, width])
  bumpMeta()
  bumpSelection()
  void nextTick(syncGridView)
}

onMounted(() => {
  seedTemplate()
  offSelection = workbook.activeSheet.on('selection-change', bumpSelection)
  offMeta = workbook.activeSheet.on('meta-change', bumpMeta)
  void nextTick(syncGridView)
})

onBeforeUnmount(() => {
  offSelection?.()
  offMeta?.()
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
}

.sheet-report-demo__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.sheet-report-demo__mode-toggle {
  display: inline-flex;
  gap: 4px;
  margin-right: 4px;
}

.sheet-report-demo__body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 12px;
}

.sheet-report-demo__field-panel--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.sheet-report-demo__grid {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* USheet 根为 flex 列，grid 区 flex:1；宿主必须给 .u-sheet 明确高度 */
.sheet-report-demo__sheet {
  flex: 1;
  min-height: 0;
  min-width: 0;
}
</style>
