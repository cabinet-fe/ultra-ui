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
import { message } from '@veltra/desktop'
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
  emit('close')
  // 大工作簿序列化在 worker 中进行（数秒）：给常驻反馈，失败（如 sheet 名含
  // Excel 非法字符，hucre 1.0 写入校验抛 InvalidArgumentError）明确报错，
  // 绝不静默失败
  const loading = message({ message: '正在导出…', duration: 0 })
  exportWorkbookFile(props.context)
    .then(() => loading.close())
    .catch((err: unknown) => {
      loading.close()
      message.error(`导出失败：${err instanceof Error ? err.message : String(err)}`)
    })
}

function exportCsv(): void {
  emit('close')
  try {
    exportSheetCsvFile(props.context)
  } catch (err) {
    message.error(`导出失败：${err instanceof Error ? err.message : String(err)}`)
  }
}
</script>
