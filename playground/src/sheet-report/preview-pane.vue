<template>
  <aside class="preview-pane">
    <header class="preview-pane__header">
      <h3 class="preview-pane__title">实时预览</h3>
      <p v-if="!empty" class="preview-pane__stats">明细 {{ detailCount }} 条 · {{ renderMs }} ms</p>
    </header>

    <div class="preview-pane__grid">
      <div v-if="empty" class="preview-pane__empty">
        <u-empty text="暂无字段绑定，请在设计区绑定字段" />
      </div>
      <u-sheet
        v-show="!empty"
        ref="previewSheetRef"
        class="preview-pane__sheet"
        :workbook="previewWorkbook"
        :rows="50"
        :cols="10"
        :show-tabs="false"
        :show-toolbar="false"
        :show-formula-bar="false"
        :readonly="true"
      />
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { debounce } from '@cat-kit/core'
import { USheet, type SheetExposed } from '@veltra/sheet'
import type { Sheet } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import '@veltra/sheet/vue/style'
import { nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'

import { REPORT_META_NAMESPACE } from './binding'
import { MOCK_DATA_RECORDS, MOCK_ORDER_ROWS } from './mock-dataset'
import { renderReport } from './render'

defineOptions({ name: 'SheetReportPreviewPane' })

const props = defineProps<{
  /** 设计区 Sheet，用于订阅变更并取快照渲染 */
  designSheet: Sheet | null
}>()

const previewWorkbook = new Workbook()
const previewSheetRef = useTemplateRef<SheetExposed>('previewSheetRef')

const empty = ref(true)
const detailCount = ref(0)
const renderMs = ref(0)

const disposers: Array<() => void> = []

const scheduleRefresh = debounce(
  () => {
    void refreshPreview()
  },
  200,
  false
)

watch(
  () => props.designSheet,
  (sheet) => {
    for (const off of disposers) off()
    disposers.length = 0

    if (!sheet) {
      empty.value = true
      return
    }

    disposers.push(
      sheet.on('meta-change', scheduleRefresh),
      sheet.on('cell-change', scheduleRefresh),
      sheet.on('merge-change', scheduleRefresh),
      sheet.on('content-reset', scheduleRefresh)
    )
    scheduleRefresh()
  },
  { immediate: true }
)

async function refreshPreview(): Promise<void> {
  const sheet = props.designSheet
  if (!sheet) {
    empty.value = true
    return
  }

  const snapshot = sheet.snapshot()
  const hasBinding = snapshot.meta?.some((m) => m.namespace === REPORT_META_NAMESPACE) ?? false
  if (!hasBinding) {
    empty.value = true
    return
  }

  empty.value = false
  detailCount.value = MOCK_ORDER_ROWS.length

  const t0 = performance.now()
  const filled = renderReport(snapshot, MOCK_DATA_RECORDS)
  renderMs.value = Math.round(performance.now() - t0)

  await nextTick()
  const previewSheet = previewSheetRef.value?.getActiveSheet() ?? previewWorkbook.activeSheet
  previewSheet.restoreContent(filled)
  previewSheet.history.clear()
}

onBeforeUnmount(() => {
  for (const off of disposers) off()
  disposers.length = 0
})
</script>

<style scoped lang="scss">
.preview-pane {
  width: 360px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 8px;
  background: var(--u-bg-color, #fff);
  overflow: hidden;
}

.preview-pane__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--u-border-color-light, #f1f5f9);
}

.preview-pane__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.preview-pane__stats {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
  white-space: nowrap;
}

.preview-pane__grid {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.preview-pane__empty {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--u-bg-color, #fff);
}

.preview-pane__sheet {
  flex: 1;
  min-height: 0;
  min-width: 0;
}
</style>
