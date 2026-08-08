<template>
  <div class="sheet-report-demo">
    <header class="sheet-report-demo__header">
      <div>
        <h2 class="sheet-report-demo__title">报表模板设计</h2>
        <p class="sheet-report-demo__hint">
          左侧点击或拖拽字段绑定到选中格；选中已绑定格可就地编辑聚合/扩展/左父格；右侧为 mock
          数据实时预览。
        </p>
      </div>
      <div class="sheet-report-demo__actions">
        <u-button size="small" @click="saveSnapshot">保存快照</u-button>
        <u-button size="small" :disabled="!savedSnapshot" @click="restoreSnapshot">
          恢复快照
        </u-button>
        <u-pop-confirm title="确定重置为默认模板？当前绑定与编辑将丢失。" @confirm="resetTemplate">
          <template #reference>
            <u-button size="small" type="warning" plain>重置模板</u-button>
          </template>
        </u-pop-confirm>
      </div>
    </header>

    <div class="sheet-report-demo__body">
      <field-panel
        :datasets="datasets"
        :selection-label="selectionLabel"
        :bound-keys="boundKeys"
        @bind="(datasetId, fieldName) => bindField(datasetId, fieldName)"
      />

      <div ref="gridHostRef" class="sheet-report-demo__grid" @dragover.prevent @drop="onGridDrop">
        <u-sheet
          ref="sheetRef"
          class="sheet-report-demo__sheet"
          :workbook="workbook"
          :rows="24"
          :cols="10"
          :show-tabs="false"
          :resolve-display-value="resolveDisplayValue"
        />

        <binding-editor
          :cell="activeCell"
          :binding="activeBinding ?? null"
          :resolved-left-parent-label="resolvedLeftParentLabel"
          :host-el="gridHostEl"
          :get-grid="getDesignGrid"
          @patch="patchActiveBinding"
          @remove="removeActiveBinding"
        />
      </div>

      <preview-pane :design-sheet="designSheet" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { USheet, type SheetExposed } from '@veltra/sheet'
import type { CellAddress, Sheet, SheetSnapshot } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import type { ResolveDisplayValue } from '@veltra/sheet-core/grid/sheet-grid'
import '@veltra/sheet/vue/style'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef
} from 'vue'

import {
  REPORT_META_NAMESPACE,
  createReportBinding,
  formatBindingPlaceholder,
  formatCellAddress,
  resolveLeftParent
} from './binding'
import BindingEditor from './binding-editor.vue'
import FieldPanel from './field-panel.vue'
import { MOCK_DATASETS } from './mock-dataset'
import PreviewPane from './preview-pane.vue'
import { seedGroupDetailTemplate } from './template'
import type { ReportBinding } from './types'

defineOptions({ name: 'SheetReportDemo' })

const datasets = MOCK_DATASETS
const savedSnapshot = ref<string | null>(null)
const selectionTick = ref(0)
const metaTick = ref(0)

const workbook = new Workbook()
const designSheet = shallowRef<Sheet | null>(null)

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')
const gridHostRef = useTemplateRef<HTMLElement>('gridHostRef')
const gridHostEl = computed(() => gridHostRef.value ?? null)

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
  const sheet = designSheet.value ?? workbook.activeSheet
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

/** 设计格恒显示绑定占位符 */
const resolveDisplayValue: ResolveDisplayValue = (addr, base) => {
  const binding = getBindingAt(addr)
  if (binding) return formatBindingPlaceholder(binding)
  return base
}

function syncGridView(): void {
  const grid = sheetRef.value?.getGrid()
  grid?.flushPending()
  grid?.refresh()
}

/** 演示 snapshot API：restore 后显式刷网格 */
function applySheetSnapshot(snapshot: SheetSnapshot): void {
  const sheet = activeSheet()
  sheet.restore(snapshot)
  sheet.restoreContent(snapshot)
  sheet.history.clear()
  bumpMeta()
  void nextTick(syncGridView)
}

function patchActiveBinding(patch: Partial<ReportBinding>): void {
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
  const cell = activeCell.value
  if (!cell) return
  activeSheet().clearCellMeta(cell, REPORT_META_NAMESPACE)
  refreshGrid()
  bumpMeta()
  bumpSelection()
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
  savedSnapshot.value = JSON.stringify(activeSheet().snapshot())
}

function restoreSnapshot(): void {
  if (!savedSnapshot.value) return
  applySheetSnapshot(JSON.parse(savedSnapshot.value))
  bumpSelection()
}

function seedTemplate(): void {
  seedGroupDetailTemplate(workbook.activeSheet)
  workbook.activeSheet.history.clear()
  designSheet.value = workbook.activeSheet
  bumpMeta()
}

function resetTemplate(): void {
  const sheet = activeSheet()
  // 清空内容与 meta 后重新灌入默认模板
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

.sheet-report-demo__body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 12px;
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
