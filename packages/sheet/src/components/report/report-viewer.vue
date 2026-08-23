<template>
  <div :class="cls.b">
    <u-report-filter-bar
      v-if="params.length"
      :query-params="params"
      :values="values"
      @update:values="setValues"
    />

    <div v-if="canDrillBack" :class="cls.e('drill-bar')">
      <u-button size="small" plain @click="drillBack">返回上一层</u-button>
    </div>

    <div :class="cls.e('body')">
      <div v-if="loading" :class="cls.e('loading')" aria-live="polite">
        <div :class="cls.e('loading-spinner')" />
        <span>正在加载报表数据…</span>
      </div>
      <div v-else-if="error" :class="cls.e('error')" role="alert">
        {{ error.message }}
      </div>

      <u-sheet
        ref="sheetRef"
        :class="[cls.e('sheet'), drillHover ? cls.em('sheet', 'drill-hover') : '']"
        :workbook="workbook"
        :rows="renderSize.rows"
        :cols="renderSize.cols"
        :show-toolbar="false"
        :show-formula-bar="false"
        :show-tabs="false"
        :show-row-header="false"
        :show-col-header="false"
        :resolve-cell-style="resolveViewerCellStyle"
        readonly
        @pointerdown="handleGridPointerDown"
        @pointermove="handleGridPointerMove"
        @pointerleave="handleGridPointerLeave"
        @click="handleGridClick"
      />
    </div>

    <u-dialog
      v-if="drillDialog"
      v-model="drillDialogVisible"
      title="详情报表"
      :class="cls.e('drill-dialog')"
    >
      <u-report-viewer
        :connector="connector"
        :template="drillDialog.template"
        :initial-values="drillDialog.params"
        :resolve-template="resolveTemplate"
      />
    </u-dialog>
  </div>
</template>

<script lang="ts" setup>
import { saveBlob } from '@cat-kit/fe'
import { UButton, UDialog } from '@veltra/desktop'
import type { CellAddress, SheetSnapshot } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import type { ResolveCellStyleHook } from '@veltra/sheet-core/grid'
import { bem } from '@veltra/utils'
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'

import { exportFilledReportXlsx } from '../../report/export-xlsx'
import { buildFilledReportPrintHtml, type ReportPrintOptions } from '../../report/print'
import type { ReportTemplate } from '../../report/template'
import type { ParamValues, ReportDrillConfig } from '../../report/types'
import type { ReportViewerProps, SheetExposed, _ReportViewerExposed } from '../../types'
import { USheet } from '../sheet'
import { applyGridColWidths, applySheetColWidths } from './designer/col-widths'
import UReportFilterBar from './filter-bar.vue'
import { previewGridSize, type PreviewGridSizeMode } from './preview-grid-size'
import { printHtmlDocument } from './print'
import { useReportViewer } from './use-report-viewer'

defineOptions({ name: 'UReportViewer' })

/** 与 `ReportViewerProps` 交叉显式列出下钻 props，避免 SFC 对跨文件 interface 漏抽 runtime 声明 */
type ViewerRuntimeProps = ReportViewerProps & {
  resolveTemplate?: ReportViewerProps['resolveTemplate']
  initialValues?: ReportViewerProps['initialValues']
}

const props = defineProps<ViewerRuntimeProps>()

const cls = bem('report-viewer')

/** 取数未完成时拒绝导出的可读错误 */
const EXPORT_NOT_READY_MESSAGE = '报表数据尚未就绪，请等待取数完成后再导出'
const EXPORT_LOADING_MESSAGE = '报表数据加载中，请稍后再导出'

/** 取数未完成时拒绝打印的可读错误 */
const PRINT_NOT_READY_MESSAGE = '报表数据尚未就绪，请等待取数完成后再打印'
const PRINT_LOADING_MESSAGE = '报表数据加载中，请稍后再打印'

/**
 * 单击 / 拖拽框选判定位移阈值（px）：pointerdown 与 click 位移超过它视为拖选，不触发下钻。
 * （VTable 拖选后 DOM click 仍会冒泡，按位移自行抑制。）
 */
const DRAG_CLICK_THRESHOLD_PX = 4

/** 查看器工作簿：宿主可注入（同 USheet `workbook?` 先例），缺省内部自建；模板 / 填充结果都 restore 进活动 sheet 只读展示 */
const internalWorkbook = new Workbook()
const workbook = computed(() => props.workbook ?? internalWorkbook)

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

const {
  params,
  values,
  loading,
  error,
  filledSnapshot,
  filledColWidths,
  currentTemplate,
  canDrillBack,
  resolveDrillHit,
  resolveDrillTarget,
  drillInto,
  drillBack,
  refresh,
  setValues
} = useReportViewer(props)

/** 配了下钻的单元格在查看态展示可点击链接样式（蓝字 + 下划线），便于用户直观感知 */
const resolveViewerCellStyle: ResolveCellStyleHook = (addr, base) => {
  if (!props.resolveTemplate) return base
  const hit = resolveDrillHit(addr)
  if (!hit) return base
  return {
    ...base,
    font: {
      ...base?.font,
      color: base?.font?.color ?? '#2f54eb',
      underline: base?.font?.underline ?? true
    }
  }
}

/** 弹框下钻：先挂 UDialog 再打开，避免 modelValue 初始为 true 时 overlay 不进入 */
const drillDialogVisible = ref(false)
const drillDialog = shallowRef<{ template: ReportTemplate; params: ParamValues } | null>(null)

const renderSize = computed(() => {
  const filled = filledSnapshot.value
  if (filled) return previewGridSize(filled, 'filled')
  return previewGridSize(currentTemplate.value, 'template')
})

/** 宿主显式传入优先；否则取数完成后用展开映射列宽；再回落当前层模板设计态列宽 */
const effectiveColWidths = computed(() => {
  if (props.colWidths?.length) return props.colWidths
  if (filledColWidths.value?.length) return filledColWidths.value
  return currentTemplate.value.colWidths
})

/** 将运行时列宽写入模型与 VTable（模型为单一事实源；grid 构造/content-reset 也会回放） */
function applyRuntimeColWidths(): void {
  if (!effectiveColWidths.value?.length) return
  const sheet = workbook.value.activeSheet
  applySheetColWidths(sheet, effectiveColWidths.value)
  applyGridColWidths(sheetRef.value?.getGrid(), effectiveColWidths.value)
}

/**
 * restore 负责尺寸/冻结/行高/列宽/选区（静默），restoreContent 发 content-reset
 * 触发网格全量刷新（grid 层订阅直刷，无需手动 flush）；history.clear 使填充不进 undo
 */
function applySnapshot(snapshot: SheetSnapshot, mode: PreviewGridSizeMode): void {
  const size = previewGridSize(snapshot, mode)
  const trimmed: SheetSnapshot = { ...snapshot, rows: size.rows, cols: size.cols }
  const sheet = workbook.value.activeSheet
  sheet.restore(trimmed)
  sheet.restoreContent(trimmed)
  sheet.history.clear()
  void nextTick(applyRuntimeColWidths)
}

// 先铺当前层模板静态结构（取数期间 / 取数失败时可见），取数成功后替换为 Filled Report
watch(currentTemplate, (template) => applySnapshot(template, 'template'), { immediate: true })
watch(filledSnapshot, (filled) => {
  if (filled) applySnapshot(filled, 'filled')
})
watch(effectiveColWidths, applyRuntimeColWidths)

// ─── 下钻点击与可点视觉提示 ─────────────────────────────────

/** 悬停命中下钻格时给网格加 cursor 提示 */
const drillHover = ref(false)
let pointerStart: { x: number; y: number } | null = null

watch(drillDialogVisible, (visible) => {
  if (!visible) drillDialog.value = null
})

async function openDrillDialog(
  config: ReportDrillConfig,
  record: Record<string, unknown>
): Promise<void> {
  const next = await resolveDrillTarget(config, record)
  if (!next) return
  drillDialog.value = next
  await nextTick()
  drillDialogVisible.value = true
}

/** 事件坐标 → 模型地址（经当前 SheetGrid 命中测试；网格随内容尺寸重建，实例按事件时刻取） */
function resolveEventAddr(event: MouseEvent): CellAddress | null {
  const host = event.currentTarget as HTMLElement
  const gridEl = host.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  const grid = sheetRef.value?.getGrid()
  if (!gridEl || !grid) return null
  const rect = gridEl.getBoundingClientRect()
  return grid.hitTestSheetAddr(event.clientX - rect.left, event.clientY - rect.top)
}

function handleGridPointerDown(event: PointerEvent): void {
  pointerStart = { x: event.clientX, y: event.clientY }
}

function handleGridClick(event: MouseEvent): void {
  if (!props.resolveTemplate) return
  const start = pointerStart
  pointerStart = null
  if (start) {
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (dx * dx + dy * dy > DRAG_CLICK_THRESHOLD_PX * DRAG_CLICK_THRESHOLD_PX) return
  }
  const addr = resolveEventAddr(event)
  if (!addr) return
  const hit = resolveDrillHit(addr)
  if (!hit) return
  if (hit.config.openMode === 'dialog') {
    void openDrillDialog(hit.config, hit.record)
    return
  }
  void drillInto(hit.config, hit.record)
}

function handleGridPointerMove(event: PointerEvent): void {
  const addr = props.resolveTemplate ? resolveEventAddr(event) : null
  const hit = addr ? resolveDrillHit(addr) : null
  const next = !!hit
  if (next !== drillHover.value) drillHover.value = next
}

function handleGridPointerLeave(): void {
  drillHover.value = false
}

async function exportXlsx(): Promise<void> {
  if (loading.value) {
    throw new Error(EXPORT_LOADING_MESSAGE)
  }
  if (!filledSnapshot.value) {
    throw new Error(EXPORT_NOT_READY_MESSAGE)
  }

  const sheet = workbook.value.activeSheet
  const buffer = await exportFilledReportXlsx(sheet)
  saveBlob(
    new Blob([buffer as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    `${sheet.name || '报表'}.xlsx`
  )
}

/**
 * 打印填充报表（纯前端）：填充 sheet 模型 → 打印专用 HTML（buildFilledReportPrintHtml）
 * → 隐藏 iframe 调起浏览器打印。守卫语义与 exportXlsx 一致（取数完成前拒绝）。
 */
function print(options?: ReportPrintOptions): void {
  if (loading.value) {
    throw new Error(PRINT_LOADING_MESSAGE)
  }
  if (!filledSnapshot.value) {
    throw new Error(PRINT_NOT_READY_MESSAGE)
  }
  printHtmlDocument(buildFilledReportPrintHtml(workbook.value.activeSheet, options))
}

defineExpose<_ReportViewerExposed>({ refresh, exportXlsx, print })
</script>
