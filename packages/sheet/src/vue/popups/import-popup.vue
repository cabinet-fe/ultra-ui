<template>
  <u-file-picker accept=".xlsx,.csv" :class="cls.e('import-picker')" @pick="handleImportPick">
    <div :class="cls.e('import-hint')">
      选择 .xlsx / .csv 文件
      <div :class="cls.e('import-sub')">xlsx 将替换当前工作簿（需确认），csv 写入当前工作表</div>
    </div>
  </u-file-picker>
</template>

<script lang="ts" setup>
import { message, messageConfirm, UFilePicker } from '@veltra/desktop'
import { bem } from '@veltra/utils'

import { importCsv, importXlsx, replaceWorkbook } from '../../core/io/import'
import type { Sheet } from '../../core/sheet'
import type { Workbook } from '../../core/workbook'

defineOptions({ name: 'USheetImportPopup' })

/**
 * 导入面板（UFilePicker 文件选择）。不参与面板事务：
 * - .csv → importCsv 直接写入当前活动表（事务 = 单 undo 单元）
 * - .xlsx → importXlsx 解析后经 messageConfirm 确认「替换当前工作簿」再 replaceWorkbook
 */
const props = defineProps<{
  /** 当前工作簿（xlsx 替换目标） */
  workbook: Workbook
  /** 当前活动 sheet（csv 写入目标） */
  activeSheet: Sheet
}>()

const emit = defineEmits<{
  close: []
  /** csv 导入完成（可能扩张 sheet.rows/cols，宿主需重建网格吃到新尺寸） */
  csvImported: []
  /** xlsx 已替换当前工作簿（宿主需同步 tabs / 重绑事件 / 重建网格） */
  workbookReplaced: []
}>()

const cls = bem('sheet')

function handleImportPick(files: File[]): void {
  const file = files[0]
  if (!file) return
  emit('close')
  if (file.name.toLowerCase().endsWith('.csv')) {
    void file.text().then((text) => {
      importCsv(text, props.activeSheet)
      // 导入扩张了 sheet.rows/cols：通知宿主重建网格（否则仍按旧 props 渲染）
      emit('csvImported')
      message.success(`已从 ${file.name} 导入到工作表「${props.activeSheet.name}」`)
    })
    return
  }
  void file.arrayBuffer().then((buffer) => {
    void importXlsx(new Uint8Array(buffer)).then((imported) => {
      messageConfirm.danger(
        `导入将替换当前工作簿（共 ${imported.sheetCount} 个工作表），确定吗？`,
        {
          confirmButtonText: '导入',
          onClosed: (action) => {
            if (action !== 'confirm') return
            replaceWorkbook(props.workbook, imported)
            // replaceWorkbook 未必触发 active-sheet-change（同 index）：通知宿主显式同步
            emit('workbookReplaced')
            message.success('导入完成')
          }
        }
      )
    })
  })
}
</script>
