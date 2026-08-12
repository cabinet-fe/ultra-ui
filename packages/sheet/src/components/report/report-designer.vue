<template>
  <div :class="cls.b">
    <div :class="cls.e('toolbar')">
      <u-button size="small" plain @click="hubVisible = true">数据中枢</u-button>

      <div :class="cls.e('mode-toggle')" role="group" aria-label="视图模式">
        <u-button
          size="small"
          :type="!isPreview ? 'primary' : undefined"
          :plain="isPreview"
          @click="setViewMode('design')"
        >
          设计模式
        </u-button>
        <u-button
          size="small"
          :type="isPreview ? 'primary' : undefined"
          :plain="!isPreview"
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

      <span :class="cls.e('hint')">
        在数据中枢配置连接与 SQL
        数据集，再将左侧字段点击或拖拽到单元格完成绑定；选中已绑定格可通过悬浮卡片调整角色、聚合与条件样式。
      </span>
    </div>

    <div v-if="!isPreview" :class="cls.e('body')">
      <u-report-field-panel
        :class="cls.e('field-panel')"
        :datasets="catalog"
        :selection-label="selectionLabel"
        :bound-keys="boundKeys"
        @bind="bindField"
      />

      <div
        ref="gridHostRef"
        :class="cls.e('grid')"
        @dragover="onGridDragOver"
        @dragleave="onGridDragLeave"
        @drop="onGridDrop"
      >
        <u-sheet
          ref="sheetRef"
          :class="cls.e('sheet')"
          :workbook="workbook"
          :rows="DESIGN_ROWS"
          :cols="DESIGN_COLS"
          :show-tabs="false"
          :resolve-cell-style="resolveCellStyle"
          :resolve-cell-renderer="resolveCellRenderer"
        />

        <u-report-topology-overlay
          :cell="activeCell"
          :binding="activeBinding ?? null"
          :entries="bindingEntries"
          :meta-tick="metaTick"
          :host-el="gridHostEl"
          :get-grid="getDesignGrid"
          :get-binding-at="getBindingAt"
        />

        <u-report-drop-highlight-overlay
          :cell="dropTargetAddr"
          :host-el="gridHostEl"
          :get-grid="getDesignGrid"
          :dragging="isFieldDragging"
          :fallback-label="selectionLabel"
        />

        <u-report-float-panel
          :cell="activeCell"
          :binding="activeBinding ?? null"
          :resolved-row-parent-label="resolvedRowParentLabel"
          :resolved-col-parent-label="resolvedColParentLabel"
          :parent-pick-mode="parentPick?.mode ?? null"
          :row-parent-candidates="rowParentCandidates"
          :col-parent-candidates="colParentCandidates"
          :resolve-field-label="resolveFieldLabel"
          :host-el="gridHostEl"
          :get-grid="getDesignGrid"
          @patch="patchActiveBinding"
          @remove="removeActiveBinding"
          @open-rules="rulesDialogVisible = true"
          @start-parent-pick="startParentPick"
          @cancel-parent-pick="cancelParentPick"
          @clear-parent="clearParent"
        />
      </div>
    </div>

    <div v-else-if="previewTemplate" :class="cls.e('preview')">
      <u-report-viewer
        ref="previewViewerRef"
        :connector="props.connector"
        :template="previewTemplate"
        :workbook="previewWorkbook"
        :col-widths="designColWidths"
      />
    </div>

    <u-drawer v-model="hubVisible" :class="cls.e('hub-drawer')" show-close>
      <u-report-dataset-hub :hub="designer" @close="hubVisible = false" />
    </u-drawer>

    <u-report-rules-dialog
      v-model="rulesDialogVisible"
      :rules="activeBinding?.conditionalRules ?? EMPTY_CONDITIONAL_RULES"
      :field-type="activeFieldType"
      @save="saveConditionalRules"
    />
  </div>
</template>

<script lang="ts" setup>
import { UButton, UDrawer } from '@veltra/desktop'
import type { CellAddress, SheetGrid } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import { bem } from '@veltra/utils'
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'

import type { ReportTemplate } from '../../report/template'
import type { ConditionalRule } from '../../report/types'
import type {
  ReportDesignerEmits,
  ReportDesignerProps,
  ReportViewerExposed,
  SheetExposed,
  _ReportDesignerExposed
} from '../../types'
import { USheet } from '../sheet'
import UReportDatasetHub from './designer-hub.vue'
import { resolveGridDropAddress } from './designer/cell-coords'
import { applyGridColWidths, readGridColWidths } from './designer/col-widths'
import UReportDropHighlightOverlay from './designer/drop-highlight-overlay.vue'
import UReportFloatPanel from './designer/float-panel.vue'
import UReportRulesDialog from './designer/rules-dialog.vue'
import UReportTopologyOverlay from './designer/topology-overlay.vue'
import { FIELD_DRAG_MIME, parseFieldDragPayload } from './field-panel-helpers'
import UReportFieldPanel from './field-panel.vue'
import UReportViewer from './report-viewer.vue'
import { useReportDesigner } from './use-report-designer'

defineOptions({ name: 'UReportDesigner' })

const props = withDefaults(defineProps<ReportDesignerProps>(), { connections: () => [] })
const emit = defineEmits<ReportDesignerEmits>()

const cls = bem('report-designer')

/** 设计态网格尺寸（列宽捕获范围与之一致） */
const DESIGN_ROWS = 24
const DESIGN_COLS = 10

/** 条件样式弹窗在无绑定格时的空规则占位 */
const EMPTY_CONDITIONAL_RULES: ConditionalRule[] = []

/** `v-model:connections` 可写代理（连接为纯序列化对象，仅驻留内存） */
const connections = computed({
  get: () => props.connections,
  set: (value) => emit('update:connections', value)
})

const designer = useReportDesigner({ props, connections })
const {
  workbook,
  catalog,
  boundKeys,
  activeCell,
  selectionLabel,
  activeBinding,
  activeFieldType,
  resolvedRowParentLabel,
  resolvedColParentLabel,
  parentPick,
  rowParentCandidates,
  colParentCandidates,
  bindingEntries,
  metaTick,
  getBindingAt,
  resolveFieldLabel,
  bindField,
  patchActiveBinding,
  startParentPick,
  cancelParentPick,
  pickParentAt,
  clearParent,
  removeActiveBinding,
  resolveCellStyle,
  resolveCellRenderer,
  getTemplate
} = designer

const hubVisible = ref(false)
const rulesDialogVisible = ref(false)

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')
const previewViewerRef = useTemplateRef<ReportViewerExposed>('previewViewerRef')
const gridHostRef = useTemplateRef<HTMLElement>('gridHostRef')
const gridHostEl = computed(() => gridHostRef.value ?? null)

/** 字段拖拽落点高亮（dragover 时更新；落空时 overlay 提示回退当前选区） */
const isFieldDragging = ref(false)
const dropTargetAddr = ref<CellAddress | null>(null)

function getDesignGrid(): SheetGrid | undefined {
  return sheetRef.value?.getGrid()
}

// ---- 设计 / 预览模式切换（预览态内嵌查看器路径，issue 05） ----

type ViewMode = 'design' | 'preview'

const viewMode = ref<ViewMode>('design')
const isPreview = computed(() => viewMode.value === 'preview')

/** 进入预览时的模板快照（getTemplate 吐出，设计态工作簿不受预览取数影响，切回绑定不丢） */
const previewTemplate = shallowRef<ReportTemplate | null>(null)
/** 预览工作簿自持（XLSX 导出需要拿到填充后的 sheet，05 票 workbook? prop 先例） */
const previewWorkbook = new Workbook()
/** 当前设计态列宽（sheet-core 列宽未进快照，经 VTable 运行时捕获；导出随快照写宽） */
const designColWidths = ref<Array<[number, number]>>([])
const exporting = ref(false)

/** 从当前设计网格捕获列宽（网格未就绪则保留旧值） */
function captureDesignColWidths(): void {
  const widths = readGridColWidths(
    getDesignGrid(),
    Array.from({ length: DESIGN_COLS }, (_, col) => col)
  )
  if (widths) designColWidths.value = widths
}

/** 设计网格重建后补刷新与列宽（restore 不发 content-reset 的场景由 grid 自行订阅，这里只管列宽） */
function syncDesignGridView(): void {
  const grid = getDesignGrid()
  grid?.flushPending()
  grid?.refresh()
  applyGridColWidths(grid, designColWidths.value)
}

function setViewMode(mode: ViewMode): void {
  if (viewMode.value === mode) return
  if (mode === 'preview') {
    captureDesignColWidths()
    previewTemplate.value = getTemplate()
  }
  viewMode.value = mode
  if (mode === 'design') void nextTick(syncDesignGridView)
}

// 模板 prop 更换：组合式函数内完成载入；组件层切回设计态（预览内容随之作废）
watch(
  () => props.template,
  () => {
    viewMode.value = 'design'
  }
)

// 父格点选：网格选区变更时写入父格并回到源格
watch(activeCell, (cell) => {
  if (cell && parentPick.value) pickParentAt(cell)
})

// 徽章文案依赖 catalog（describe 完成 / label 覆盖变更后重绘绑定格；meta 变更由 grid 自行订阅）
watch(catalog, () => {
  void nextTick(() => getDesignGrid()?.refresh())
})

async function exportPreviewXlsx(): Promise<void> {
  if (!isPreview.value || exporting.value) return
  const viewer = previewViewerRef.value
  if (!viewer) {
    throw new Error('预览查看器尚未就绪，请稍后再导出')
  }
  exporting.value = true
  try {
    await viewer.exportXlsx()
  } finally {
    exporting.value = false
  }
}

function saveConditionalRules(rules: ConditionalRule[]): void {
  patchActiveBinding({ conditionalRules: rules })
}

function clearDropState(): void {
  isFieldDragging.value = false
  dropTargetAddr.value = null
}

function resolveDropAddress(event: DragEvent): CellAddress | null {
  const grid = getDesignGrid()
  const gridEl = gridHostRef.value?.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!grid || !gridEl) return null
  return resolveGridDropAddress(grid, gridEl, event.clientX, event.clientY)
}

function onGridDragOver(event: DragEvent): void {
  if (!event.dataTransfer?.types.includes(FIELD_DRAG_MIME)) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  isFieldDragging.value = true
  dropTargetAddr.value = resolveDropAddress(event)
}

function onGridDragLeave(event: DragEvent): void {
  const host = gridHostRef.value
  const related = event.relatedTarget
  if (host && related instanceof Node && host.contains(related)) return
  clearDropState()
}

function onGridDrop(event: DragEvent): void {
  event.preventDefault()
  clearDropState()
  const raw = event.dataTransfer?.getData(FIELD_DRAG_MIME)
  const payload = raw ? parseFieldDragPayload(raw) : null
  if (!payload) return

  // 与旧设计器一致：网格未就绪直接放弃；仅 hit-test 落空时回退当前选区
  const grid = getDesignGrid()
  const gridEl = gridHostRef.value?.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!grid || !gridEl) return

  const dropAddr = resolveDropAddress(event)
  if (dropAddr) {
    bindField(payload.datasetId, payload.fieldName, dropAddr)
    sheetRef.value?.getContext().selectCell(dropAddr)
  } else {
    bindField(payload.datasetId, payload.fieldName)
  }
}

defineExpose<_ReportDesignerExposed>({ getTemplate })
</script>
