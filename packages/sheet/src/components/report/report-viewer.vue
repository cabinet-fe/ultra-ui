<template>
  <div :class="cls.b">
    <u-report-filter-bar
      v-if="params.length"
      :query-params="params"
      :values="values"
      @update:values="setValues"
    />

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
        :class="cls.e('sheet')"
        :workbook="workbook"
        :rows="renderSize.rows"
        :cols="renderSize.cols"
        :show-toolbar="false"
        :show-formula-bar="false"
        :show-tabs="false"
        :show-row-header="false"
        :show-col-header="false"
        readonly
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { saveBlob } from '@cat-kit/fe'
import type { SheetSnapshot } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import { bem } from '@veltra/utils'
import { computed, nextTick, useTemplateRef, watch } from 'vue'

import { exportFilledReportXlsx } from '../../report/export-xlsx'
import type { ReportViewerProps, _ReportViewerExposed } from '../../types'
import type { SheetExposed } from '../../types'
import { USheet } from '../sheet'
import { applyGridColWidths, applySheetColWidths } from './designer/col-widths'
import UReportFilterBar from './filter-bar.vue'
import { previewGridSize, type PreviewGridSizeMode } from './preview-grid-size'
import { useReportViewer } from './use-report-viewer'

defineOptions({ name: 'UReportViewer' })

const props = defineProps<ReportViewerProps>()

const cls = bem('report-viewer')

/** 取数未完成时拒绝导出的可读错误 */
const EXPORT_NOT_READY_MESSAGE = '报表数据尚未就绪，请等待取数完成后再导出'
const EXPORT_LOADING_MESSAGE = '报表数据加载中，请稍后再导出'

/** 查看器工作簿：宿主可注入（同 USheet `workbook?` 先例），缺省内部自建；模板 / 填充结果都 restore 进活动 sheet 只读展示 */
const internalWorkbook = new Workbook()
const workbook = computed(() => props.workbook ?? internalWorkbook)

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

const { params, values, loading, error, filledSnapshot, filledColWidths, refresh, setValues } =
  useReportViewer(props)

const renderSize = computed(() => {
  const filled = filledSnapshot.value
  if (filled) return previewGridSize(filled, 'filled')
  return previewGridSize(props.template, 'template')
})

/** 宿主显式传入优先；否则取数完成后用展开映射列宽；再回落模板设计态列宽 */
const effectiveColWidths = computed(() => {
  if (props.colWidths?.length) return props.colWidths
  if (filledColWidths.value?.length) return filledColWidths.value
  return props.template.colWidths
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

// 先铺模板静态结构（取数期间 / 取数失败时可见），取数成功后替换为 Filled Report
watch(
  () => props.template,
  (template) => applySnapshot(template, 'template'),
  { immediate: true }
)
watch(filledSnapshot, (filled) => {
  if (filled) applySnapshot(filled, 'filled')
})
watch(effectiveColWidths, applyRuntimeColWidths)

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

defineExpose<_ReportViewerExposed>({ refresh, exportXlsx })
</script>
