<template>
  <div class="sheet-demo">
    <div class="sheet-demo__hint">
      USheet 组件：工具栏为内置工具（撤销/重做/合并/取消合并）+ 演示注册的两个自定义工具
      （插入当前日期 / 清空选区，均走命令系统可撤销）。输入 = 开头文本即公式； 拖选区域后可合并；
      快捷键：Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z 或 Ctrl+Y 重做
    </div>
    <u-sheet ref="sheetRef" :workbook="workbook" :rows="30" :cols="10" class="sheet-demo__sheet" />
  </div>
</template>

<script lang="ts" setup>
import { Calendar, Clear } from '@veltra/icons'
import {
  iterateRange,
  registerTool,
  unregisterTool,
  USheet,
  Workbook,
  type SetCellValueItem,
  type SheetExposed
} from '@veltra/sheet'
import '@veltra/sheet/vue/style'
import { onBeforeUnmount, useTemplateRef } from 'vue'

// 工作簿：两个 sheet 共享公式依赖图（跨表引用与联动重算的中枢）
const workbook = new Workbook()
const sheet1 = workbook.activeSheet // 默认 Sheet1
const sheet2 = workbook.addSheet('Sheet2')

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

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

// 两个示例自定义工具：与内置工具同一注册通道（dogfood 扩展机制）
registerTool({
  id: 'demo-insert-date',
  title: '插入当前日期',
  icon: Calendar,
  tooltip: '插入当前日期到选中格',
  group: 'demo',
  order: 0,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: (ctx) => {
    const active = ctx.getSelection().activeCell
    if (!active) return
    ctx.setCellValue(active, new Date().toLocaleDateString('sv-SE'))
  }
})

registerTool({
  id: 'demo-clear-selection',
  title: '清空选区',
  icon: Clear,
  tooltip: '清空选区全部单元格（批量写入，一个 undo 单元）',
  group: 'demo',
  order: 1,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: (ctx) => {
    const range = ctx.getSelection().ranges[0]
    if (!range) return
    const items: SetCellValueItem[] = []
    for (const addr of iterateRange(range)) items.push({ addr, data: undefined })
    ctx.setCells(items)
  }
})

// 调试句柄：浏览器控制台/自动化可直接读取模型与组件暴露
;(window as unknown as Record<string, unknown>).__sheetDemo = {
  workbook,
  sheet1,
  sheet2,
  getSheet: () => sheetRef.value
}

onBeforeUnmount(() => {
  unregisterTool('demo-insert-date')
  unregisterTool('demo-clear-selection')
  delete (window as unknown as Record<string, unknown>).__sheetDemo
})
</script>

<style scoped>
.sheet-demo__hint {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.sheet-demo__sheet {
  height: 620px;
}
</style>
