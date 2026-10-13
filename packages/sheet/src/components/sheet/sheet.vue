<template>
  <div ref="rootRef" :class="cls.b">
    <div ref="toolbarWrapRef" :class="cls.e('toolbar-wrap')">
      <u-sheet-toolbar v-if="showToolbar" :groups="toolGroups" @tool-click="handleToolClick" />

      <!-- 弹层型工具面板（填充/边框/字体色/字号/查找/函数/插入图片/导出）：UDropdown（Teleport 到
           #pop-container + floating-ui 定位：锚点跟随触发按钮、自动翻转/边界位移；
           触发元素滚动/窗口缩放时自动关闭）。面板交互走 SheetContext 命令入口。
           导入无弹层：点击直接系统文件选择（见 handleToolClick → pickAndImportFile） -->
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
            <u-sheet-functions-popup
              v-else-if="popupTool.popup === 'functions'"
              @select="handleFunctionSelect"
            />
            <u-sheet-insert-image-popup
              v-else-if="popupTool.popup === 'insert-image'"
              :context="context"
              @close="closePopup"
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
      :set-selection-anchor="setSelectionAnchor"
      :set-ref-highlights="setRefHighlights"
    />

    <div ref="gridRef" :class="cls.e('grid')">
      <!-- 导入解析覆盖层（自绘，不动 desktop Loading 组件）：遮罩 + 动画 + 文字
           同一层，动画在上、文字在下，不存在被遮罩掩盖的问题 -->
      <div v-if="parsing" :class="cls.e('loading-mask')">
        <div :class="cls.e('loading-spinner')"></div>
        <div :class="cls.e('loading-text')">{{ parseText }}</div>
      </div>

      <!-- 悬停链接格 tooltip：引擎 cell link hover/leave 事件驱动挂载/卸载，
           层坐标 + 偏移后绝对定位于 grid 区（不遮指针；pointer-events: none） -->
      <div
        v-if="cellLinkTooltip"
        :class="cls.e('link-tooltip')"
        :style="{ left: `${cellLinkTooltip.left}px`, top: `${cellLinkTooltip.top}px` }"
      >
        {{ cellLinkTooltip.url }}
      </div>
    </div>

    <u-sheet-tabs
      v-if="showTabs"
      :workbook="workbook"
      :sheet-list="sheetList"
      :active-index="activeIndex"
    />

    <!-- 单元格/图片超链接配置弹窗（右键菜单拉起；confirm 按模式路由写入） -->
    <u-sheet-hyperlink-popup
      v-if="hyperlinkPopup"
      :mode="hyperlinkPopup.mode"
      :initial="hyperlinkPopup.initial"
      @confirm="handleHyperlinkConfirm"
      @close="hyperlinkPopup = null"
    />

    <!-- 图片 lightbox 预览（浮动图/嵌入图右键「预览」拉起；关闭卸载 → objectURL 由组件回收） -->
    <u-image-previewer
      v-if="imagePreview"
      :src="imagePreview.src ?? imagePreview.data"
      :mime="imagePreview.mime"
      @close="imagePreview = null"
    />
  </div>
</template>

<script lang="ts" setup>
import { UDropdown, UImagePreviewer, messageConfirm } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import type {
  CellAddress,
  CellLinkClickEvent,
  CellLinkPayload,
  ImageLinkClickEvent
} from 'infinitable/sheet'
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue'

import type { SheetTool } from '../../tools/registry'
import type { SheetEmits, SheetProps, _SheetExposed } from '../../types'
import UFormulaBar from './formula-bar.vue'
import { pickAndImportFile } from './import-file'
import type {
  HyperlinkConfirmPayload,
  HyperlinkImageTarget,
  HyperlinkPopupMode,
  ImagePreviewSource
} from './popup-helpers'
import USheetBorderPopup from './popups/border-popup.vue'
import USheetExportPopup from './popups/export-popup.vue'
import USheetFillColorPopup from './popups/fill-color-popup.vue'
import USheetFindPopup from './popups/find-popup.vue'
import USheetFontColorPopup from './popups/font-color-popup.vue'
import USheetFontSizePopup from './popups/font-size-popup.vue'
import USheetFunctionsPopup from './popups/functions-popup.vue'
import USheetHyperlinkPopup from './popups/hyperlink-popup.vue'
import USheetInsertImagePopup from './popups/insert-image-popup.vue'
import USheetTabs from './sheet-tabs.vue'
import USheetToolbar from './sheet-toolbar.vue'
import { useCellLinkTooltip } from './use-cell-link-tooltip'
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
  showTabs: true,
  showRowHeader: true,
  showColHeader: true,
  readonly: false,
  colResize: false,
  // 缺省画布常驻档：true 经引擎归一化为 canvas always + reserve——滚动条常驻
  // 画在画布内，reserve 只在画布内预留轨道（不占页面布局、不遮挡单元格）
  scrollbar: true,
  // 显式对齐引擎当前缺省（true 近边增长）：boolean prop 不写 default 会被
  // Vue 铸成 false，把引擎缺省翻成固定尺寸网格
  growOnScroll: true
})

const emit = defineEmits<SheetEmits>()

const cls = bem('sheet')

/** 根容器 ref：Ctrl/Cmd+F 判定焦点是否在本实例内（#6，避免劫持浏览器查找） */
const rootRef = useTemplateRef<HTMLElement>('rootRef')

/** 工具栏容器 ref：工具栏隐藏（showToolbar=false）时查找弹层的回退锚点（0 高贴 sheet 顶） */
const toolbarWrapRef = useTemplateRef<HTMLElement>('toolbarWrapRef')

// ─── 状态源（workbook / sheet 列表 / 活动 sheet / 工具上下文）────────
// hooks 引用的 closePopup / rebuildGrid 由下方组合提供：箭头函数在事件触发时才
// 求值（彼时已完成全部 setup），组合声明顺序不构成循环依赖。

const { workbook, activeIndex, sheetList, activeSheet, context, stateTick, syncFromWorkbook } =
  useSheetState(props, emit, {
    onBeforeSheetChange: () => closePopup(),
    rebuildGrid: () => rebuildGrid(),
    activateGrid: () => activateGrid(),
    pruneCache: (sheets) => pruneCache(sheets),
    // 行高/列宽菜单确认 → 活动 grid 引擎尺寸即时生效（getGrid 声明于下方，事件时才求值）
    syncAxisSizes: (axis, indexes) => getGrid()?.applyAxisSizes(axis, indexes)
  })

// ─── 弹层型工具编排（打开 / 关闭 / 面板事务）─────────────────────

const {
  popupTool,
  popupAnchor,
  closePopup,
  handleToolClick: openOrRunTool
} = useToolPopup(context, rootRef, () => toolbarWrapRef.value ?? null)
// xlsx 解析中（worker）：grid 容器显示自绘覆盖层（import-file 写入 parsing /
// parseProgress；遮罩 + 动画 + 文字同层——动画在上、文字在下）
const parsing = ref(false)
const parseProgress = ref({ done: 0, total: 0 })
const parseText = computed(() =>
  parseProgress.value.total > 0
    ? `正在解析… ${parseProgress.value.done}/${parseProgress.value.total}`
    : '正在读取文件结构…'
)

/** 导入无弹层：直接系统文件选择；其余工具走 useToolPopup */
function handleToolClick(tool: SheetTool, event?: MouseEvent): void {
  if (tool.id === 'import') {
    if (tool.disabled?.(context)) return
    pickAndImportFile({
      workbook: workbook.value,
      activeSheet: activeSheet.value,
      parsing,
      parseProgress,
      onCsvImported: () => rebuildGrid(),
      onWorkbookReplaced: () => syncFromWorkbook()
    })
    return
  }
  openOrRunTool(tool, event)
}

/** 工具栏「函数」弹框选中 → 关弹层并走公式栏统一插入路径（与 fx 按钮一致） */
function handleFunctionSelect(name: string): void {
  closePopup()
  formulaBarRef.value?.insertFunction(name)
}

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

// ─── 单元格超链接 / 图片 UI（右键菜单 → 配置弹窗 → 写入；悬停 tooltip；lightbox）──

/** 超链接配置弹层状态（右键菜单拉起）：mode + 编辑回填 + 写入目标（cell 格 / image 浮动图或嵌入图） */
const hyperlinkPopup = shallowRef<{
  mode: HyperlinkPopupMode
  initial?: CellLinkPayload
  addr?: CellAddress
  imageTarget?: HyperlinkImageTarget
} | null>(null)

/** 悬停 tooltip 状态机（引擎 cell link hover/leave 事件驱动，层坐标换算见 use-cell-link-tooltip） */
const {
  tooltip: cellLinkTooltip,
  onCellLinkHover: showCellLinkTooltip,
  onCellLinkLeave: hideCellLinkTooltip
} = useCellLinkTooltip()

/** 右键菜单超链接项句柄：记录写入目标并拉起弹窗（编辑回填原 url/text） */
function openHyperlinkPopup(
  mode: HyperlinkPopupMode,
  initial?: CellLinkPayload,
  imageTarget?: HyperlinkImageTarget
): void {
  hyperlinkPopup.value = {
    mode,
    initial,
    addr: mode === 'cell' ? (context.getSelection().activeCell ?? undefined) : undefined,
    imageTarget: mode === 'image' ? imageTarget : undefined
  }
}

/**
 * 弹窗确认：关弹层并写目标链接，一次写入 = 一个 undo 单元。
 * cell：setCellLink（显示文本留空不写入 text → 单元格沿用自身内容显示）；
 * 浮动图：updateImage（link 字段）；嵌入图：insertCellImage 覆盖写（其余载荷保留）。
 */
function handleHyperlinkConfirm(payload: HyperlinkConfirmPayload): void {
  const current = hyperlinkPopup.value
  hyperlinkPopup.value = null
  if (current?.mode === 'cell') {
    if (current.addr) context.setCellLink(current.addr, payload)
    return
  }
  const target = current?.imageTarget
  if (target?.kind === 'float') {
    context.updateImage(target.id, { link: payload.url })
    return
  }
  if (target?.kind === 'cell') {
    const existing = context.getCellImage(target.addr)
    if (existing) context.insertCellImage(target.addr, { ...existing, link: payload.url })
  }
}

/** lightbox 预览状态（右键「预览」拉起）：URL 或字节 + MIME；关闭置 null 卸载（objectURL 由 UImagePreviewer 回收） */
const imagePreview = shallowRef<ImagePreviewSource | null>(null)

/** 右键「预览」句柄：浮动图 / 嵌入图菜单共用 */
function openImagePreview(source: ImagePreviewSource): void {
  imagePreview.value = source
}

// ─── 链接打开（引擎 openCellLinkOnClick=false，打开行为由组件接管）────────

/** 新标签打开外链（对齐引擎默认打开语义：noopener） */
function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** 链接格单击：emit 后直开（保持引擎原默认行为） */
function handleCellLinkClick(event: CellLinkClickEvent): void {
  emit('cell-link-click', event)
  openExternal(event.url)
}

/** 图片链接单击（浮动图/嵌入图）：emit 后确认再开——点击即跳转易误触 */
function handleImageLinkClick(event: ImageLinkClickEvent): void {
  emit('image-link-click', event)
  messageConfirm({
    title: '打开图片链接',
    message: `即将打开图片链接：${event.url}`,
    confirmButtonText: '打开',
    cancelButtonText: '取消',
    onClose: (action) => {
      if (action === 'confirm') openExternal(event.url)
    }
  })
}

// ─── grid 生命周期（重建 / 右键菜单 / 公式栏编辑镜像）────────────────

const gridRef = useTemplateRef<HTMLElement>('gridRef')
const formulaBarRef = useTemplateRef<InstanceType<typeof UFormulaBar>>('formulaBarRef')

const { rebuildGrid, activateGrid, pruneCache, getGrid, setSelectionAnchor, setRefHighlights } =
  useSheetGrid({
    props,
    gridRef,
    getActiveSheet: () => activeSheet.value,
    context,
    formulaBarRef,
    // 工具栏「函数」弹框打开期间与 fx 入口一致：画布点击不清除目标格高亮
    isFunctionPopupOpen: () => popupTool.value?.popup === 'functions',
    onColResizeEnd: (event) => emit('col-resize-end', event),
    // 引擎链接 / 浮动图事件透传（openCellLinkOnClick=false：链接格直开、图片链接确认后开）；
    // hover/leave 同时喂给 tooltip 状态机（与组件 emit 同源）
    onCellLinkHover: (event) => {
      emit('cell-link-hover', event)
      showCellLinkTooltip(event)
    },
    onCellLinkLeave: (event) => {
      emit('cell-link-leave', event)
      hideCellLinkTooltip(event)
    },
    onCellLinkClick: (event) => handleCellLinkClick(event),
    onImageLinkClick: (event) => handleImageLinkClick(event),
    onFloatContextMenu: (event) => emit('float-context-menu', event),
    // body 菜单超链接项 → 拉起配置弹窗；右键「预览」→ 打开 lightbox
    openHyperlinkPopup,
    openImagePreview
  })

const exposed: _SheetExposed = {
  workbook,
  getActiveSheet: () => activeSheet.value,
  getContext: () => context,
  getGrid
}

defineExpose(exposed)
</script>
