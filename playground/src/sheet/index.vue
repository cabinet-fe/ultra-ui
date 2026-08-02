<template>
  <div class="sheet-demo">
    <div class="sheet-demo__toolbar">
      <u-button :disabled="!canUndo" @click="undo">撤销</u-button>
      <u-button :disabled="!canRedo" @click="redo">重做</u-button>
      <u-button type="primary" @click="mergeAtActive">合并当前格 2×2</u-button>
      <u-button @click="unmergeAtActive">取消当前格合并</u-button>
      <span class="sheet-demo__active">活动格：{{ activeCellText }}</span>
      <span class="sheet-demo__hint">快捷键：Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z 或 Ctrl+Y 重做</span>
    </div>

    <div ref="containerRef" class="sheet-demo__grid" />

    <div class="sheet-demo__info">
      <div class="sheet-demo__info-title">当前选中格 getCellInfo：</div>
      <pre>{{ cellInfoJson }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatAddress, Sheet, SheetGrid, type CellInfo } from '@veltra/sheet'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const containerRef = useTemplateRef<HTMLDivElement>('containerRef')

const sheet = new Sheet('Demo')
let grid: SheetGrid | undefined

const activeCellText = ref('-')
const cellInfo = ref<CellInfo | null>(null)
const canUndo = ref(false)
const canRedo = ref(false)

const cellInfoJson = computed(() =>
  cellInfo.value ? JSON.stringify(cellInfo.value, null, 2) : '点击表格选择单元格'
)

function syncSelectionInfo() {
  const activeCell = sheet.getSelection().activeCell
  if (!activeCell) {
    activeCellText.value = '-'
    cellInfo.value = null
    return
  }
  activeCellText.value = formatAddress(activeCell)
  cellInfo.value = sheet.getCellInfo(activeCell)
}

function undo() {
  sheet.undo()
}

function redo() {
  sheet.redo()
}

/** 以活动格（锚点）为左上合并 2×2；若活动格已在合并内则合并其所在区域 */
function mergeAtActive() {
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
  const activeCell = sheet.getSelection().activeCell
  if (!activeCell) return
  sheet.unmergeCells({ start: activeCell, end: activeCell })
  sheet.selectCell(activeCell)
  syncSelectionInfo()
}

onMounted(() => {
  // 预置一些数据，覆盖普通格 / 合并锚点 / 被覆盖格三种形态
  sheet.setCellValue({ row: 0, col: 0 }, '名称')
  sheet.setCellValue({ row: 0, col: 1 }, '数量')
  sheet.setCellValue({ row: 1, col: 0 }, '苹果')
  sheet.setCellValue({ row: 1, col: 1 }, 42)
  sheet.mergeCells({ start: { row: 3, col: 1 }, end: { row: 4, col: 2 } })
  sheet.setCellValue({ row: 3, col: 1 }, '已合并(B4:C5)')
  // 预置数据作为初始状态，不进入 undo 历史
  sheet.history.clear()

  grid = new SheetGrid({ container: containerRef.value!, sheet, rows: 50, cols: 12 })
  sheet.on('selection-change', syncSelectionInfo)
  // undo/redo 引起的合并结构变化也同步刷新信息面板
  sheet.on('merge-change', syncSelectionInfo)
  sheet.on('history-change', (state) => {
    canUndo.value = state.canUndo
    canRedo.value = state.canRedo
  })

  // 调试句柄：浏览器控制台/自动化可直接读取模型与表格实例
  ;(window as unknown as Record<string, unknown>).__sheetDemo = { sheet, grid }
})

onBeforeUnmount(() => {
  grid?.release()
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

.sheet-demo__grid {
  height: 480px;
  border: 1px solid var(--u-border-muted-color, #e0e0e0);
  border-radius: var(--u-radius-large, 8px);
  overflow: hidden;
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
