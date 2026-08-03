<template>
  <div :class="cls.b">
    <!-- toolbar-wrap：弹层面板（popup）的定位参照系——相对工具栏而非整个 sheet，
         否则 popup 的 top: calc(100% + 4px) 落在 sheet 底部之外被 overflow:hidden 裁剪 -->
    <div :class="cls.e('toolbar-wrap')">
      <u-sheet-toolbar v-if="showToolbar" :groups="toolGroups" @tool-click="handleToolClick" />

      <!-- 弹层型工具面板（填充颜色 / 边框 / 查找 / 导入 / 插入行列）：面板交互走 SheetContext 命令入口 -->
      <div v-if="popupTool" :class="cls.e('popup')" @click.stop>
        <u-sheet-fill-color-popup v-if="popupTool.popup === 'fill-color'" :context="context" />
        <u-sheet-border-popup v-else-if="popupTool.popup === 'border'" :context="context" />
        <u-sheet-find-popup
          v-else-if="popupTool.popup === 'find'"
          :sheet="activeSheet"
          :context="context"
          @close="closePopup"
        />
        <u-sheet-import-popup
          v-else-if="popupTool.popup === 'import'"
          :workbook="workbook"
          :active-sheet="activeSheet"
          @close="closePopup"
          @csv-imported="rebuildGrid"
          @workbook-replaced="syncFromWorkbook"
        />
        <u-sheet-insert-cells-popup
          v-else-if="popupTool.popup === 'insert-rows' || popupTool.popup === 'insert-cols'"
          :mode="popupTool.popup === 'insert-rows' ? 'rows' : 'cols'"
          :context="context"
          @close="closePopup"
        />
      </div>
    </div>

    <u-formula-bar
      v-if="showFormulaBar"
      ref="formulaBarRef"
      :sheet="activeSheet"
      :context="context"
    />

    <div ref="gridRef" :class="cls.e('grid')" />

    <u-sheet-tabs
      v-if="showTabs"
      :workbook="workbook"
      :sheet-list="sheetList"
      :active-index="activeIndex"
    />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { useTemplateRef } from 'vue'

import type { SheetEmits, SheetProps, _SheetExposed } from '../types'
import UFormulaBar from './formula-bar.vue'
import USheetBorderPopup from './popups/border-popup.vue'
import USheetFillColorPopup from './popups/fill-color-popup.vue'
import USheetFindPopup from './popups/find-popup.vue'
import USheetImportPopup from './popups/import-popup.vue'
import USheetInsertCellsPopup from './popups/insert-cells-popup.vue'
import USheetTabs from './sheet-tabs.vue'
import USheetToolbar from './sheet-toolbar.vue'
import { useSheetGrid } from './use-sheet-grid'
import { useSheetState } from './use-sheet-state'
import { useToolGroups } from './use-tool-groups'
import { useToolPopup } from './use-tool-popup'

defineOptions({ name: 'USheet' })

const props = withDefaults(defineProps<SheetProps>(), {
  rows: 100,
  cols: 26,
  showToolbar: true,
  showFormulaBar: true,
  showTabs: true
})

const emit = defineEmits<SheetEmits>()

const cls = bem('sheet')

// ─── 状态源（workbook / sheet 列表 / 活动 sheet / 工具上下文）────────
// hooks 引用的 closePopup / rebuildGrid 由下方组合提供：箭头函数在事件触发时才
// 求值（彼时已完成全部 setup），组合声明顺序不构成循环依赖。

const { workbook, activeIndex, sheetList, activeSheet, context, stateTick, syncFromWorkbook } =
  useSheetState(props, emit, {
    onBeforeSheetChange: () => closePopup(),
    rebuildGrid: () => rebuildGrid()
  })

// ─── 弹层型工具编排（打开 / 关闭 / 面板事务）─────────────────────

const { popupTool, closePopup, handleToolClick, openToolPopup } = useToolPopup(context)

// ─── 工具栏分组视图模型 ────────────────────────────────────────

const toolGroups = useToolGroups(context, stateTick)

// ─── grid 生命周期（重建 / 右键菜单 / 公式栏编辑镜像）────────────────

const gridRef = useTemplateRef<HTMLElement>('gridRef')
const formulaBarRef = useTemplateRef<InstanceType<typeof UFormulaBar>>('formulaBarRef')

const { rebuildGrid, getGrid } = useSheetGrid({
  props,
  gridRef,
  getActiveSheet: () => activeSheet.value,
  context,
  openToolPopup,
  formulaBarRef
})

const exposed: _SheetExposed = {
  workbook,
  getActiveSheet: () => activeSheet.value,
  getContext: () => context,
  getGrid
}

defineExpose(exposed)
</script>
