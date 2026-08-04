<template>
  <div :class="cls.e('export-menu')">
    <button type="button" :class="cls.e('export-option')" @click="exportXlsx">
      导出 Excel (.xlsx)
    </button>
    <button type="button" :class="cls.e('export-option')" @click="exportCsv">
      导出 CSV (.csv)
    </button>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

import type { SheetContext } from '../../tools/context'
import { exportSheetCsvFile, exportWorkbookFile } from '../../tools/download'

defineOptions({ name: 'USheetExportPopup' })

/**
 * 导出选择面板（xlsx / csv）。不参与面板事务：点击即下载并关闭。
 */
const props = defineProps<{ context: SheetContext }>()

const emit = defineEmits<{ close: [] }>()

const cls = bem('sheet')

function exportXlsx(): void {
  exportWorkbookFile(props.context)
  emit('close')
}

function exportCsv(): void {
  exportSheetCsvFile(props.context)
  emit('close')
}
</script>
