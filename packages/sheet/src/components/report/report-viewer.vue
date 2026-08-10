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
        :class="cls.e('sheet')"
        :workbook="workbook"
        :rows="renderRows"
        :cols="renderCols"
        :show-toolbar="false"
        :show-formula-bar="false"
        :show-tabs="false"
        readonly
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SheetSnapshot } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import { bem } from '@veltra/utils'
import { computed, watch } from 'vue'

import type { ReportViewerProps, _ReportViewerExposed } from '../../types'
import { USheet } from '../sheet'
import UReportFilterBar from './filter-bar.vue'
import { useReportViewer } from './use-report-viewer'

defineOptions({ name: 'UReportViewer' })

const props = defineProps<ReportViewerProps>()

const cls = bem('report-viewer')

/** 网格最小渲染尺寸（与 playground 预览态一致）；Filled Report 超出时按快照尺寸放大 */
const MIN_RENDER_ROWS = 50
const MIN_RENDER_COLS = 10

/** 查看器工作簿：宿主可注入（同 USheet `workbook?` 先例），缺省内部自建；模板 / 填充结果都 restore 进活动 sheet 只读展示 */
const internalWorkbook = new Workbook()
const workbook = computed(() => props.workbook ?? internalWorkbook)

const { params, values, loading, error, filledSnapshot, refresh, setValues } =
  useReportViewer(props)

const renderRows = computed(() =>
  Math.max(MIN_RENDER_ROWS, filledSnapshot.value?.rows ?? 0, props.template.rows)
)
const renderCols = computed(() =>
  Math.max(MIN_RENDER_COLS, filledSnapshot.value?.cols ?? 0, props.template.cols)
)

/**
 * restore 负责尺寸/冻结/行高/选区（静默），restoreContent 发 content-reset
 * 触发网格全量刷新（grid 层订阅直刷，无需手动 flush）；history.clear 使填充不进 undo
 */
function applySnapshot(snapshot: SheetSnapshot): void {
  const sheet = workbook.value.activeSheet
  sheet.restore(snapshot)
  sheet.restoreContent(snapshot)
  sheet.history.clear()
}

// 先铺模板静态结构（取数期间 / 取数失败时可见），取数成功后替换为 Filled Report
watch(() => props.template, applySnapshot, { immediate: true })
watch(filledSnapshot, (filled) => {
  if (filled) applySnapshot(filled)
})

defineExpose<_ReportViewerExposed>({ refresh })
</script>
