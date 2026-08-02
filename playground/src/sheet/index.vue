<template>
  <div class="sheet-demo">
    <div class="sheet-demo__toolbar">
      <u-button :disabled="!canUndo" @click="undo">撤销</u-button>
      <u-button :disabled="!canRedo" @click="redo">重做</u-button>
      <u-button type="primary" @click="mergeAtActive">合并当前格 2×2</u-button>
      <u-button @click="unmergeAtActive">取消当前格合并</u-button>
      <span class="sheet-demo__active"
        >当前表：{{ activeSheetName }}；活动格：{{ activeCellText }}</span
      >
      <span class="sheet-demo__hint">
        输入 = 开头文本即公式；快捷键：Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z 或 Ctrl+Y 重做
      </span>
    </div>

    <div class="sheet-demo__grids">
      <div class="sheet-panel" :class="{ 'sheet-panel--active': activeSheetName === 'Sheet1' }">
        <div class="sheet-panel__title">
          Sheet1（跨表公式：B1=SUM(Sheet2!B2:B4)，B2=Sheet2!B2*2）
        </div>
        <div ref="grid1Ref" class="sheet-panel__grid" />
      </div>
      <div class="sheet-panel" :class="{ 'sheet-panel--active': activeSheetName === 'Sheet2' }">
        <div class="sheet-panel__title">Sheet2（数据源：改 B2:B4 → Sheet1 实时联动）</div>
        <div ref="grid2Ref" class="sheet-panel__grid" />
      </div>
    </div>

    <div class="sheet-demo__info">
      <div class="sheet-demo__info-title">
        当前选中格 getCellInfo / getCellData（公式格含 f 原文与缓存值）：
      </div>
      <pre>{{ cellInfoJson }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  formatAddress,
  SheetGrid,
  Workbook,
  type CellData,
  type CellInfo,
  type Sheet
} from '@veltra/sheet'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const grid1Ref = useTemplateRef<HTMLDivElement>('grid1Ref')
const grid2Ref = useTemplateRef<HTMLDivElement>('grid2Ref')

// 工作簿：两个 sheet 共享公式依赖图（跨表引用与联动重算的中枢）
const workbook = new Workbook()
const sheet1 = workbook.activeSheet // 默认 Sheet1
const sheet2 = workbook.addSheet('Sheet2')

let grid1: SheetGrid | undefined
let grid2: SheetGrid | undefined

const activeSheetName = ref('Sheet1')
const activeCellText = ref('-')
const cellInfo = ref<CellInfo | null>(null)
const cellData = ref<CellData | null>(null)
const canUndo = ref(false)
const canRedo = ref(false)

const cellInfoJson = computed(() => {
  if (!cellInfo.value) return '点击表格选择单元格'
  return JSON.stringify({ info: cellInfo.value, data: cellData.value }, null, 2)
})

function sheetByName(name: string): Sheet {
  return workbook.getSheet(name) ?? sheet1
}

function syncSelectionInfo() {
  const sheet = sheetByName(activeSheetName.value)
  const activeCell = sheet.getSelection().activeCell
  if (!activeCell) {
    activeCellText.value = '-'
    cellInfo.value = null
    cellData.value = null
    return
  }
  activeCellText.value = `${sheet.name}!${formatAddress(activeCell)}`
  cellInfo.value = sheet.getCellInfo(activeCell)
  cellData.value = sheet.getCellData(activeCell) ?? null
}

/** 某表被交互（选区变化）→ 切为当前表，工具栏状态跟随 */
function watchSheet(sheet: Sheet): void {
  sheet.on('selection-change', () => {
    if (activeSheetName.value !== sheet.name) {
      activeSheetName.value = sheet.name
      canUndo.value = sheet.canUndo
      canRedo.value = sheet.canRedo
    }
    syncSelectionInfo()
  })
  sheet.on('history-change', (state) => {
    if (activeSheetName.value !== sheet.name) return
    canUndo.value = state.canUndo
    canRedo.value = state.canRedo
  })
  // 重算/undo 引起的值变化也可能影响信息面板
  sheet.on('cell-change', syncSelectionInfo)
  sheet.on('merge-change', syncSelectionInfo)
}

function undo() {
  sheetByName(activeSheetName.value).undo()
}

function redo() {
  sheetByName(activeSheetName.value).redo()
}

/** 以活动格（锚点）为左上合并 2×2；若活动格已在合并内则合并其所在区域 */
function mergeAtActive() {
  const sheet = sheetByName(activeSheetName.value)
  const activeCell = sheet.getSelection().activeCell
  if (!activeCell) return
  const info = sheet.getCellInfo(activeCell)
  const range = info.mergeRange ?? {
    start: activeCell,
    end: { row: activeCell.row + 1, col: activeCell.col + 1 }
  }
  sheet.mergeCells(range)
  sheet.selectCell(activeCell)
  syncSelectionInfo()
}

function unmergeAtActive() {
  const sheet = sheetByName(activeSheetName.value)
  const activeCell = sheet.getSelection().activeCell
  if (!activeCell) return
  sheet.unmergeCells({ start: activeCell, end: activeCell })
  sheet.selectCell(activeCell)
  syncSelectionInfo()
}

onMounted(() => {
  // 预置 Sheet2 数据源
  sheet2.setCellValue({ row: 0, col: 0 }, '项目')
  sheet2.setCellValue({ row: 0, col: 1 }, '数量')
  sheet2.setCellValue({ row: 1, col: 0 }, '苹果')
  sheet2.setCellValue({ row: 1, col: 1 }, 42)
  sheet2.setCellValue({ row: 2, col: 0 }, '香蕉')
  sheet2.setCellValue({ row: 2, col: 1 }, 35)
  sheet2.setCellValue({ row: 3, col: 0 }, '橙子')
  sheet2.setCellValue({ row: 3, col: 1 }, 58)

  // 预置 Sheet1：跨表公式 + 同表联动 + 合并示例
  sheet1.setCellValue({ row: 0, col: 0 }, '跨表汇总')
  sheet1.setCellFormula({ row: 0, col: 1 }, '=SUM(Sheet2!B2:B4)')
  sheet1.setCellValue({ row: 1, col: 0 }, 'Sheet2 首项×2')
  sheet1.setCellFormula({ row: 1, col: 1 }, '=Sheet2!B2*2')
  sheet1.setCellValue({ row: 2, col: 0 }, '本表 B1÷2')
  sheet1.setCellFormula({ row: 2, col: 1 }, '=B1/2')
  sheet1.mergeCells({ start: { row: 4, col: 1 }, end: { row: 5, col: 2 } })
  sheet1.setCellValue({ row: 4, col: 1 }, '合并区(B5:C6)')
  // 预置数据作为初始状态，不进入 undo 历史
  sheet1.history.clear()
  sheet2.history.clear()

  grid1 = new SheetGrid({ container: grid1Ref.value!, sheet: sheet1, rows: 30, cols: 10 })
  grid2 = new SheetGrid({ container: grid2Ref.value!, sheet: sheet2, rows: 30, cols: 10 })
  watchSheet(sheet1)
  watchSheet(sheet2)

  // 调试句柄：浏览器控制台/自动化可直接读取模型与表格实例
  ;(window as unknown as Record<string, unknown>).__sheetDemo = {
    workbook,
    sheet1,
    sheet2,
    grid1,
    grid2,
    getActiveSheet: () => sheetByName(activeSheetName.value)
  }
})

onBeforeUnmount(() => {
  grid1?.release()
  grid2?.release()
  delete (window as unknown as Record<string, unknown>).__sheetDemo
})
</script>

<style scoped>
.sheet-demo__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.sheet-demo__active {
  margin-left: 8px;
  font-size: 13px;
  color: var(--u-text-secondary-color, #666);
}

.sheet-demo__hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--u-text-secondary-color, #999);
}

.sheet-demo__grids {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.sheet-panel {
  border: 1px solid var(--u-border-muted-color, #e0e0e0);
  border-radius: var(--u-radius-large, 8px);
  overflow: hidden;
}

.sheet-panel--active {
  border-color: var(--u-primary-color, #4a90e2);
}

.sheet-panel__title {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--u-text-secondary-color, #666);
  background: var(--u-bg-soft-color, #f6f6f6);
}

.sheet-panel__grid {
  height: 360px;
}

.sheet-demo__info {
  margin-top: 12px;
}

.sheet-demo__info-title {
  font-size: 13px;
  margin-bottom: 4px;
}

.sheet-demo__info pre {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  background: var(--u-bg-soft-color, #f6f6f6);
  border-radius: 8px;
  min-height: 72px;
}
</style>
