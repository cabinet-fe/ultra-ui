<template>
  <div class="sheet-report-demo">
    <header class="sheet-report-demo__header">
      <div>
        <h2 class="sheet-report-demo__title">
          报表模板设计 · {{ isPreview ? '预览模式' : '设计模式' }}
        </h2>
        <p class="sheet-report-demo__hint">
          左侧点击或拖拽字段绑定到选中格；选中已绑定格可通过悬浮编辑卡片调整角色、聚合与条件样式。点
          <strong>预览模式</strong> 按 mock 数据展开渲染结果。点「数据源」管理模拟数据库与查询参数。
        </p>
      </div>
      <div class="sheet-report-demo__actions">
        <u-button size="small" plain @click="helpVisible = true">使用说明</u-button>
        <u-button size="small" plain :disabled="isPreview" @click="paramsVisible = true">
          筛选参数
        </u-button>
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
        <u-button
          v-if="isPreview"
          size="small"
          type="primary"
          plain
          :loading="exporting"
          @click="exportPreviewXlsx"
        >
          导出 XLSX
        </u-button>
      </div>
    </header>

    <div class="sheet-report-demo__presets" role="tablist" aria-label="商业报表模板">
      <u-button
        v-for="preset in REPORT_PRESETS"
        :key="preset.id"
        size="small"
        :type="activePresetId === preset.id ? 'primary' : undefined"
        :plain="activePresetId !== preset.id"
        @click="switchPreset(preset.id)"
      >
        {{ preset.label }}
      </u-button>
      <span class="sheet-report-demo__preset-hint">{{ activePreset.description }}</span>
    </div>

    <filter-bar
      v-if="isPreview"
      :query-params="previewQueryParams"
      :values="paramValues"
      @update:values="onParamValuesChange"
    />

    <help-dialog v-model="helpVisible" />
    <dataset-center
      v-model="datasetVisible"
      :hub="dataHub"
      :revision="hubRevision"
      :param-values="paramValues"
    />
    <params-config-dialog
      v-model="paramsVisible"
      :hub="dataHub"
      :revision="hubRevision"
      :bound-dataset-ids="boundDatasetIds"
      :values="paramValues"
      @update:values="onParamValuesChange"
      @reset-params="resetParamValues"
    />

    <div class="sheet-report-demo__body">
      <field-panel
        v-if="!isPreview"
        class="sheet-report-demo__field-panel"
        :datasets="panelDatasets"
        :selection-label="selectionLabel"
        :bound-keys="boundKeys"
        @bind="(datasetId, fieldName) => bindField(datasetId, fieldName)"
      />

      <div
        ref="gridHostRef"
        class="sheet-report-demo__grid"
        @dragover="onGridDragOver"
        @dragleave="onGridDragLeave"
        @drop="onGridDrop"
      >
        <div v-if="previewLoading" class="sheet-report-demo__loading" aria-live="polite">
          <div class="sheet-report-demo__loading-spinner" />
          <span>正在按参数重新计算报表…</span>
        </div>

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

        <topology-overlay
          v-if="!isPreview"
          :cell="activeCell"
          :binding="activeBinding ?? null"
          :entries="topologyEntries"
          :meta-tick="metaTick"
          :host-el="gridHostEl"
          :get-grid="getDesignGrid"
          :get-binding-at="getBindingAt"
        />

        <drop-highlight-overlay
          v-if="!isPreview"
          :cell="dropTargetAddr"
          :host-el="gridHostEl"
          :get-grid="getDesignGrid"
        />

        <binding-float-panel
          v-if="!isPreview"
          :cell="activeCell"
          :binding="activeBinding ?? null"
          :resolved-left-parent-label="resolvedLeftParentLabel"
          :resolve-field-label="resolveFieldLabelFromCatalog"
          :host-el="gridHostEl"
          :get-grid="getDesignGrid"
          @patch="patchActiveBinding"
          @remove="removeActiveBinding"
          @open-rules="rulesDialogVisible = true"
        />
      </div>
    </div>

    <conditional-rules-dialog
      v-model="rulesDialogVisible"
      :rules="activeBinding?.conditionalRules ?? EMPTY_CONDITIONAL_RULES"
      :field-type="activeFieldType"
      @save="saveConditionalRules"
    />
  </div>
</template>

<script lang="ts" setup>
import { USheet, type SheetExposed } from '@veltra/sheet'
import type { CellAddress, Sheet, SheetSnapshot } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import type { ResolveDisplayValue } from '@veltra/sheet-core/grid/sheet-grid'
import '@veltra/sheet/components/sheet/style'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch
} from 'vue'

import {
  REPORT_META_NAMESPACE,
  createReportBinding,
  formatBindingPlaceholder,
  formatCellAddress,
  resolveLeftParent,
  resolveReportRole,
  setBindingCatalog
} from './binding'
import DatasetCenter from './dataset-center.vue'
import { createDataHub } from './dataset-hub'
import BindingFloatPanel from './designer/binding-float-panel.vue'
import { resolveGridDropAddress } from './designer/cell-coords'
import ConditionalRulesDialog from './designer/conditional-rules-dialog.vue'
import DropHighlightOverlay from './designer/drop-highlight-overlay.vue'
import type { TopologyBindingEntry } from './designer/topology'
import TopologyOverlay from './designer/topology-overlay.vue'
import { downloadFilledReportXlsx } from './export-xlsx'
import FieldPanel from './field-panel.vue'
import FilterBar from './filter-bar.vue'
import HelpDialog from './help-dialog.vue'
import { resolveBoundDatasetParams } from './params'
import ParamsConfigDialog from './params-config-dialog.vue'
import { REPORT_PRESETS, findReportPreset } from './presets'
import { renderReport } from './render'
import {
  DEMO_COL_WIDTHS,
  applyColWidths,
  readDemoColWidths,
  type DemoColWidthEntry
} from './template'
import type { ConditionalRule, DatasetCatalogItem, DatasetField, ReportBinding } from './types'

type ViewMode = 'design' | 'preview'

/** 条件样式弹窗在无绑定格时的空规则占位 */
const EMPTY_CONDITIONAL_RULES: ConditionalRule[] = []

/** Data Hub：数据连接 + SQL 数据集 + 查询执行 */
const dataHub = createDataHub()
const hubRevision = ref(0)
setBindingCatalog(dataHub.getCatalog())
const paramValues = ref(dataHub.getParamValues())
const datasetRecords = computed(() => {
  hubRevision.value
  paramValues.value
  return dataHub.getRecords()
})
const datasetCatalog = computed((): DatasetCatalogItem[] => {
  hubRevision.value
  return dataHub.getCatalog()
})

function onParamValuesChange(values: typeof paramValues.value): void {
  dataHub.setParamValues(values)
  paramValues.value = dataHub.getParamValues()
}

function resetParamValues(): void {
  dataHub.resetParamValues()
  paramValues.value = dataHub.getParamValues()
}

const viewMode = ref<ViewMode>('design')
const activePresetId = ref(REPORT_PRESETS[0]!.id)
const activePreset = computed(() => findReportPreset(activePresetId.value) ?? REPORT_PRESETS[0]!)
const previewLoading = ref(false)
const exporting = ref(false)
const helpVisible = ref(false)
const datasetVisible = ref(false)
const paramsVisible = ref(false)
const rulesDialogVisible = ref(false)

const panelDatasets = computed((): DatasetCatalogItem[] => datasetCatalog.value)

function resolveFieldLabelFromCatalog(datasetId: string, fieldName: string): string {
  hubRevision.value
  const dataset = datasetCatalog.value.find((item) => item.id === datasetId)
  const field = dataset?.fields.find((f) => f.name === fieldName)
  return field?.label ?? fieldName
}

/** 进入预览前保存的模板快照，切回设计态时恢复 */
const templateSnapshot = ref<string | null>(null)
/** 当前设计态列宽；DEMO_COL_WIDTHS 仅作初始/重置种子 */
const designColWidths = ref<Array<[number, number]>>(
  DEMO_COL_WIDTHS.map(([col, width]) => [col, width])
)
const selectionTick = ref(0)
const metaTick = ref(0)
/** 稳定选区地址引用，避免 getSelection() 每次返回新对象触发子组件 watcher */
const activeCell = shallowRef<CellAddress | null>(null)
const topologyEntries = shallowRef<TopologyBindingEntry[]>([])

const workbook = new Workbook()

const activeBinding = computed((): ReportBinding | undefined => {
  metaTick.value
  const cell = activeCell.value
  if (!cell) return undefined
  return activeSheet().getCellMeta<ReportBinding>(cell, REPORT_META_NAMESPACE)
})

const activeFieldType = computed((): DatasetField['type'] => {
  const binding = activeBinding.value
  if (!binding) return 'number'
  hubRevision.value
  const dataset = datasetCatalog.value.find((item) => item.id === binding.dataset)
  const field = dataset?.fields.find((f) => f.name === binding.field)
  return field?.type ?? 'number'
})

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')
const gridHostRef = useTemplateRef<HTMLElement>('gridHostRef')
const gridHostEl = computed(() => gridHostRef.value ?? null)
const dropTargetAddr = ref<CellAddress | null>(null)

const isPreview = computed(() => viewMode.value === 'preview')

const selectionLabel = computed(() => {
  selectionTick.value
  const cell = activeCell.value
  if (!cell) return '—'
  return formatCellAddress(cell)
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

const boundDatasetIds = computed(() => {
  metaTick.value
  const ids = new Set<string>()
  for (const [, namespace, payload] of activeSheet().entriesCellMeta()) {
    if (namespace !== REPORT_META_NAMESPACE) continue
    ids.add((payload as ReportBinding).dataset)
  }
  return [...ids]
})

const previewQueryParams = computed(() =>
  resolveBoundDatasetParams(dataHub.getQueryParams(), boundDatasetIds.value, (datasetId) =>
    dataHub.getQueryParams([datasetId])
  )
)

const resolvedLeftParentLabel = computed(() => {
  metaTick.value
  const binding = activeBinding.value
  const cell = activeCell.value
  if (!binding || !cell) return '—'
  const resolved = resolveLeftParent(binding, cell, getBindingAt)
  return resolved ? formatCellAddress(resolved) : '—'
})

function syncActiveCell(): void {
  const next = sheetRef.value?.getContext().getSelection().activeCell ?? null
  if (!next) {
    activeCell.value = null
    return
  }
  const prev = activeCell.value
  if (prev && prev.row === next.row && prev.col === next.col) return
  activeCell.value = { row: next.row, col: next.col }
}

function syncTopologyEntries(): void {
  const entries: TopologyBindingEntry[] = []
  for (const [addr, namespace, payload] of activeSheet().entriesCellMeta()) {
    if (namespace !== REPORT_META_NAMESPACE) continue
    entries.push({ addr, binding: payload as ReportBinding })
  }
  topologyEntries.value = entries
}

let offSelection: (() => void) | undefined
let offMeta: (() => void) | undefined
let offDataHub: (() => void) | undefined

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
  syncActiveCell()
}

function bumpMeta(): void {
  metaTick.value++
  syncTopologyEntries()
}

function refreshGrid(): void {
  sheetRef.value?.getGrid()?.refresh()
}

/** 预览态下查询参数变更时重新渲染 */
watch(datasetRecords, () => {
  if (!isPreview.value || !templateSnapshot.value) return
  void refreshPreview()
})

/** 设计态显示绑定占位符；预览态用渲染后的真实值 */
const resolveDisplayValue: ResolveDisplayValue = (addr, base) => {
  if (isPreview.value) return base
  const binding = getBindingAt(addr)
  if (binding) return formatBindingPlaceholder(binding)
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
    captureDesignColWidths()
    templateSnapshot.value = JSON.stringify(activeSheet().snapshot())
    void refreshPreview()
  } else if (templateSnapshot.value) {
    applySheetSnapshot(JSON.parse(templateSnapshot.value))
  }

  viewMode.value = mode
  bumpSelection()
}

async function refreshPreview(): Promise<void> {
  if (!templateSnapshot.value) return
  previewLoading.value = true
  await nextTick()
  // 让浏览器先绘制遮罩，再执行同步 renderReport
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
  const filled = renderReport(JSON.parse(templateSnapshot.value), datasetRecords.value)
  applySheetSnapshot(filled)
  previewLoading.value = false
}

function loadPresetTemplate(preset: (typeof REPORT_PRESETS)[number]): void {
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
  preset.seed(sheet)
  sheet.history.clear()
  designColWidths.value = preset.colWidths.map(([col, width]) => [col, width])
  templateSnapshot.value = null
  bumpMeta()
  bumpSelection()
  void nextTick(syncGridView)
}

async function switchPreset(presetId: string): Promise<void> {
  const preset = findReportPreset(presetId)
  if (!preset || activePresetId.value === presetId) return

  activePresetId.value = presetId
  const inPreview = isPreview.value
  loadPresetTemplate(preset)
  if (inPreview) {
    templateSnapshot.value = JSON.stringify(activeSheet().snapshot())
    await refreshPreview()
  }
}

async function exportPreviewXlsx(): Promise<void> {
  if (!isPreview.value || exporting.value) return
  exporting.value = true
  try {
    captureDesignColWidths()
    const widths: DemoColWidthEntry[] = designColWidths.value
    const fileName = `${activePreset.value.label}.xlsx`
    await downloadFilledReportXlsx(activeSheet(), widths, fileName)
  } finally {
    exporting.value = false
  }
}

// readonly / rows 变化会 rebuildGrid，重建后补列宽
watch(isPreview, () => {
  void nextTick(syncGridView)
})

function isGroupAnchorCell(addr: CellAddress, binding?: ReportBinding): boolean {
  if (addr.row === 1 && addr.col === 0) return true
  if (!binding) return false
  return resolveReportRole(binding) === 'group' && binding.leftParent === 'none'
}

function resolveParentGroupDataset(addr: CellAddress): string | undefined {
  for (let col = addr.col - 1; col >= 0; col--) {
    const binding = getBindingAt({ row: addr.row, col })
    if (!binding) continue
    if (resolveReportRole(binding) === 'group') return binding.dataset
  }
  return undefined
}

function patchActiveBinding(patch: Partial<ReportBinding>): void {
  if (isPreview.value) return
  const cell = activeCell.value
  const binding = activeBinding.value
  if (!cell || !binding) return

  if (isGroupAnchorCell(cell, binding)) {
    const nextRole = patch.role ?? resolveReportRole({ ...binding, ...patch })
    const nextAggregate = patch.aggregate ?? binding.aggregate
    if (nextRole === 'detail' || nextAggregate === 'select') return
  }

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

function saveConditionalRules(rules: ConditionalRule[]): void {
  patchActiveBinding({ conditionalRules: rules })
}

function bindField(datasetId: string, fieldName: string, addr?: CellAddress): void {
  if (isPreview.value) return
  const dataset = panelDatasets.value.find((d) => d.id === datasetId)
  if (!dataset) return

  const target =
    addr ??
    sheetRef.value?.getContext().getSelection().activeCell ??
    activeSheet().getSelection().activeCell
  if (!target) return

  const binding = createReportBinding(dataset, fieldName)
  const existing = getBindingAt(target)
  if (isGroupAnchorCell(target, existing)) {
    binding.aggregate = 'group'
    binding.leftParent = 'none'
    binding.role = 'group'
  }

  const parentDataset = resolveParentGroupDataset(target)
  if (parentDataset) {
    binding.dataset = parentDataset
  }

  activeSheet().setCellMeta(target, REPORT_META_NAMESPACE, binding)
  refreshGrid()
  bumpMeta()
}

function clearDropTarget(): void {
  dropTargetAddr.value = null
}

function onGridDragOver(event: DragEvent): void {
  if (isPreview.value) return
  if (!event.dataTransfer?.types.includes('application/x-sheet-report-field')) return

  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'

  const grid = sheetRef.value?.getGrid()
  const host = gridHostRef.value
  const gridEl = host?.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!grid || !gridEl) {
    clearDropTarget()
    return
  }

  dropTargetAddr.value = resolveGridDropAddress(grid, gridEl, event.clientX, event.clientY)
}

function onGridDragLeave(event: DragEvent): void {
  const host = gridHostRef.value
  const related = event.relatedTarget
  if (host && related instanceof Node && host.contains(related)) return
  clearDropTarget()
}

function onGridDrop(event: DragEvent): void {
  if (isPreview.value) return
  event.preventDefault()
  const raw = event.dataTransfer?.getData('application/x-sheet-report-field')
  clearDropTarget()
  if (!raw) return

  const sep = raw.indexOf(':')
  if (sep <= 0) return
  const datasetId = raw.slice(0, sep)
  const fieldName = raw.slice(sep + 1)
  if (!fieldName) return

  const grid = sheetRef.value?.getGrid()
  const host = gridHostRef.value
  const gridEl = host?.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!grid || !gridEl) return

  const dropAddr = resolveGridDropAddress(grid, gridEl, event.clientX, event.clientY)
  if (dropAddr) {
    bindField(datasetId, fieldName, dropAddr)
    sheetRef.value?.getContext().selectCell(dropAddr)
  } else {
    bindField(datasetId, fieldName)
  }
}

function seedTemplate(): void {
  loadPresetTemplate(activePreset.value)
}

function onWindowDragEnd(): void {
  clearDropTarget()
}

onMounted(() => {
  window.addEventListener('dragend', onWindowDragEnd)
  offDataHub = dataHub.subscribe(() => {
    hubRevision.value++
    setBindingCatalog(dataHub.getCatalog())
    if (!isPreview.value) {
      refreshGrid()
      bumpMeta()
    }
  })
  seedTemplate()
  syncTopologyEntries()
  offSelection = workbook.activeSheet.on('selection-change', bumpSelection)
  offMeta = workbook.activeSheet.on('meta-change', bumpMeta)
  bumpSelection()
  void nextTick(syncGridView)
})

onBeforeUnmount(() => {
  window.removeEventListener('dragend', onWindowDragEnd)
  offSelection?.()
  offMeta?.()
  offDataHub?.()
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

.sheet-report-demo__presets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.sheet-report-demo__preset-hint {
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.sheet-report-demo__loading {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: color-mix(in srgb, var(--u-bg-color, #fff) 72%, transparent);
  font-size: 13px;
  color: var(--u-text-color-secondary, #64748b);
}

.sheet-report-demo__loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--u-border-color-light, #e2e8f0);
  border-top-color: var(--u-color-primary, #2563eb);
  border-radius: 50%;
  animation: sheet-report-spin 0.8s linear infinite;
}

@keyframes sheet-report-spin {
  to {
    transform: rotate(360deg);
  }
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
