<template>
  <div ref="rootRef" :class="cls.b">
    <div :class="cls.e('toolbar-wrap')">
      <u-sheet-toolbar v-if="showToolbar" :groups="toolGroups" @tool-click="handleToolClick" />

      <!-- 弹层型工具面板（填充/边框/字体色/字号/查找/导入/导出）：UDropdown（Teleport 到
           #pop-container + floating-ui 定位：锚点跟随触发按钮、自动翻转/边界位移；
           触发元素滚动/窗口缩放时自动关闭）。面板交互走 SheetContext 命令入口 -->
      <u-dropdown
        ref="popupDropdownRef"
        trigger="custom"
        :visible="popupTool !== null"
        width="auto"
        @update:visible="handlePopupVisible"
      >
        <template #content>
          <div v-if="popupTool" :class="cls.e('popup')" @click.stop>
            <u-sheet-fill-color-popup v-if="popupTool.popup === 'fill-color'" :context="context" />
            <u-sheet-border-popup v-else-if="popupTool.popup === 'border'" :context="context" />
            <u-sheet-font-color-popup
              v-else-if="popupTool.popup === 'font-color'"
              :context="context"
            />
            <u-sheet-font-size-popup
              v-else-if="popupTool.popup === 'font-size'"
              :context="context"
            />
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
              @parsing="parsing = $event"
            />
            <u-sheet-export-popup
              v-else-if="popupTool.popup === 'export'"
              :context="context"
              @close="closePopup"
            />
          </div>
        </template>
      </u-dropdown>
    </div>

    <u-formula-bar
      v-if="showFormulaBar"
      ref="formulaBarRef"
      :sheet="activeSheet"
      :context="context"
    />

    <div ref="gridRef" :class="cls.e('grid')" v-loading="parsing" />

    <u-sheet-tabs
      v-if="showTabs"
      :workbook="workbook"
      :sheet-list="sheetList"
      :active-index="activeIndex"
    />
  </div>
</template>

<script lang="ts" setup>
import { UDropdown, vLoading } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { provide, ref, useTemplateRef, watch } from 'vue'

import type { SheetEmits, SheetProps, _SheetExposed } from '../types'
import UFormulaBar from './formula-bar.vue'
import { SHEET_PARSING_KEY } from './parsing'
import USheetBorderPopup from './popups/border-popup.vue'
import USheetExportPopup from './popups/export-popup.vue'
import USheetFillColorPopup from './popups/fill-color-popup.vue'
import USheetFindPopup from './popups/find-popup.vue'
import USheetFontColorPopup from './popups/font-color-popup.vue'
import USheetFontSizePopup from './popups/font-size-popup.vue'
import USheetImportPopup from './popups/import-popup.vue'
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

/** 根容器 ref：Ctrl/Cmd+F 判定焦点是否在本实例内（#6，避免劫持浏览器查找） */
const rootRef = useTemplateRef<HTMLElement>('rootRef')

// ─── 状态源（workbook / sheet 列表 / 活动 sheet / 工具上下文）────────
// hooks 引用的 closePopup / rebuildGrid 由下方组合提供：箭头函数在事件触发时才
// 求值（彼时已完成全部 setup），组合声明顺序不构成循环依赖。

const { workbook, activeIndex, sheetList, activeSheet, context, stateTick, syncFromWorkbook } =
  useSheetState(props, emit, {
    onBeforeSheetChange: () => closePopup(),
    rebuildGrid: () => rebuildGrid(),
    activateGrid: () => activateGrid(),
    pruneCache: (sheets) => pruneCache(sheets)
  })

// ─── 弹层型工具编排（打开 / 关闭 / 面板事务）─────────────────────

const { popupTool, popupAnchor, closePopup, handleToolClick } = useToolPopup(context, rootRef)
// xlsx 解析中（worker）：grid 容器挂 v-loading（import-popup 经 provide/inject 写入）
const parsing = ref(false)
provide(SHEET_PARSING_KEY, parsing)

// ─── UDropdown 面板：锚点跟随触发按钮（floating-ui 定位）──────────

const popupDropdownRef = useTemplateRef<InstanceType<typeof UDropdown>>('popupDropdownRef')

// popupTool 变化 → 打开（传触发按钮作锚点）/ 关闭。
// 必须同步调用 open()：usePop 在 content 挂载时执行定位与滚动监听，
// 若等 nextTick 后再设 customTriggerRef，usePop 首次 update 时锚点缺失 → 面板不定位。
watch(popupTool, () => {
  const dropdown = popupDropdownRef.value
  if (!dropdown) return
  if (popupTool.value) {
    // 触发元素移动（工具栏滚动 / 窗口缩放）由 usePop 监听 → UDropdown 自动关闭
    dropdown.open({ trigger: popupAnchor.value ?? undefined })
  } else {
    dropdown.close()
  }
})

/** UDropdown 内部关闭（滚动 / resize / transition 结束）→ 同步状态并提交面板事务 */
function handlePopupVisible(visible: boolean): void {
  if (!visible) closePopup()
}

// ─── 工具栏分组视图模型 ────────────────────────────────────────

const toolGroups = useToolGroups(context, stateTick)

// ─── grid 生命周期（重建 / 右键菜单 / 公式栏编辑镜像）────────────────

const gridRef = useTemplateRef<HTMLElement>('gridRef')
const formulaBarRef = useTemplateRef<InstanceType<typeof UFormulaBar>>('formulaBarRef')

const { rebuildGrid, activateGrid, pruneCache, getGrid } = useSheetGrid({
  props,
  gridRef,
  getActiveSheet: () => activeSheet.value,
  context,
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
