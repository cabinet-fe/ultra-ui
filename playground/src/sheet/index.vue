<template>
  <div class="sheet-demo">
    <div class="sheet-demo__hint">
      USheet：工具栏图标化（history / cell / text / edit / file）。输入 =
      开头即公式；拖选后可合并或右键菜单；
      单元格右下角拖填充柄可复制/数字序列/公式相对引用；行边界可拖行高。快捷键：Ctrl/Cmd+Z 撤销，
      Ctrl/Cmd+Shift+Z 或 Ctrl+Y 重做；编辑中方向键只移光标。行列插入/删除与冻结见行列头右键菜单。
    </div>
    <u-sheet ref="sheetRef" :workbook="workbook" :rows="30" class="sheet-demo__sheet" />
  </div>
</template>

<script lang="ts" setup>
import { USheet, Workbook, type SheetExposed } from '@veltra/sheet'
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
// 填充柄演示：数字序列 / 文本 tile
sheet1.setCellValue({ row: 0, col: 3 }, '序列')
sheet1.setCellValue({ row: 1, col: 3 }, 1)
sheet1.setCellValue({ row: 2, col: 3 }, 2)
sheet1.setCellValue({ row: 0, col: 4 }, 'tile')
sheet1.setCellValue({ row: 1, col: 4 }, 'a')
sheet1.setCellValue({ row: 2, col: 4 }, 'b')
// 预置数据作为初始状态，不进入 undo 历史
sheet1.history.clear()
sheet2.history.clear()

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

// 调试句柄：浏览器控制台/自动化可直接读取模型与组件暴露
;(window as unknown as Record<string, unknown>).__sheetDemo = {
  workbook,
  sheet1,
  sheet2,
  getSheet: () => sheetRef.value
}

onBeforeUnmount(() => {
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
