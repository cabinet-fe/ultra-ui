<template>
  <div :class="cls.b">
    <div v-if="showToolbar" :class="cls.e('toolbar')">
      <template v-for="(group, groupIndex) in toolGroups" :key="group.name">
        <span v-if="groupIndex > 0" :class="cls.e('toolbar-divider')" />
        <button
          v-for="item in group.tools"
          :key="item.tool.id"
          type="button"
          :class="cls.e('tool')"
          :disabled="item.disabled"
          :title="item.tool.tooltip ?? item.tool.title"
          @click="handleToolClick(item.tool)"
        >
          <component :is="item.tool.icon" v-if="item.tool.icon" :class="cls.e('tool-icon')" />
          <span>{{ item.tool.title }}</span>
        </button>
      </template>
    </div>

    <div ref="gridRef" :class="cls.e('grid')" />

    <div v-if="showTabs" :class="cls.e('tabs')">
      <button
        v-for="(sheet, index) in sheetList"
        :key="sheet.name"
        type="button"
        :class="[cls.e('tab'), bem.is('active', index === activeIndex)]"
        @click="handleTabClick(index)"
      >
        {{ sheet.name }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

import type { Sheet } from '../core/sheet'
import { Workbook } from '../core/workbook'
import { SheetGrid } from '../grid/sheet-grid'
import { createSheetContext } from '../tools/context'
import { defaultToolRegistry, type SheetTool } from '../tools/registry'
import type { SheetEmits, SheetProps, _SheetExposed } from '../types'

defineOptions({ name: 'USheet' })

const props = withDefaults(defineProps<SheetProps>(), {
  rows: 100,
  cols: 26,
  showToolbar: true,
  showTabs: true
})

const emit = defineEmits<SheetEmits>()

const cls = bem('sheet')

/** 工作簿：外部传入或内部自建（单 sheet） */
const internalWorkbook = new Workbook()
const workbook = computed(() => props.workbook ?? internalWorkbook)

/** 激活 sheet 索引（镜像 workbook.activeSheetIndex，经事件同步） */
const activeIndex = ref(workbook.value.activeSheetIndex)
/** sheet 列表（tabs 渲染；由 sheets-change 同步） */
const sheetList = shallowRef<Sheet[]>(workbook.value.getSheets())
const activeSheet = computed(() => sheetList.value[activeIndex.value] ?? workbook.value.activeSheet)

/** 工具上下文：动态解析活动 sheet，tab 切换后自动指向当前 sheet */
const context = createSheetContext(() => activeSheet.value)

const gridRef = useTemplateRef<HTMLElement>('gridRef')
let grid: SheetGrid | undefined

// ─── 工具栏状态刷新 ─────────────────────────────────────────
// 工具 visible/disabled 是 (ctx) => boolean 纯函数，状态源变化时 bump 触发重算

const stateTick = ref(0)
const bump = (): void => {
  stateTick.value++
}

let disposeSheetEvents: (() => void)[] = []
/** 订阅活动 sheet 的状态源（tab 切换 / 工作簿变更时重绑） */
function bindSheetEvents(sheet: Sheet): void {
  for (const dispose of disposeSheetEvents) dispose()
  disposeSheetEvents = [
    sheet.on('selection-change', bump),
    sheet.on('history-change', bump),
    sheet.on('cell-change', bump),
    sheet.on('merge-change', bump)
  ]
}

let disposeWorkbookEvents: (() => void)[] = []
function bindWorkbookEvents(wb: Workbook): void {
  for (const dispose of disposeWorkbookEvents) dispose()
  disposeWorkbookEvents = [
    wb.on('sheets-change', ({ sheets }) => {
      sheetList.value = sheets
      bump()
    }),
    wb.on('active-sheet-change', ({ sheet, index }) => {
      activeIndex.value = index
      bindSheetEvents(sheet)
      rebuildGrid()
      bump()
      emit('active-sheet-change', { sheet, index })
    })
  ]
}

const offRegistryChange = defaultToolRegistry.onChange(bump)

// ─── 工具栏 ────────────────────────────────────────────────

const toolGroups = computed(() => {
  void stateTick.value // 依赖状态源：选区 / 历史 / 单元格 / 合并 / 注册表
  return defaultToolRegistry
    .getGroups()
    .map((group) => ({
      name: group.name,
      tools: group.tools
        .map((tool) => ({
          tool,
          visible: tool.visible?.(context) ?? true,
          disabled: tool.disabled?.(context) ?? false
        }))
        .filter((item) => item.visible)
    }))
    .filter((group) => group.tools.length > 0)
})

function handleToolClick(tool: SheetTool): void {
  if (tool.disabled?.(context)) return
  tool.onClick(context)
}

// ─── sheet tabs ─────────────────────────────────────────────

function handleTabClick(index: number): void {
  if (index === activeIndex.value) return
  const sheet = sheetList.value[index]
  if (sheet) workbook.value.activateSheet(sheet.name)
}

// ─── grid 生命周期 ──────────────────────────────────────────

function rebuildGrid(): void {
  const container = gridRef.value
  if (!container) return
  grid?.release()
  grid = new SheetGrid({ container, sheet: activeSheet.value, rows: props.rows, cols: props.cols })
}

onMounted(() => {
  bindWorkbookEvents(workbook.value)
  bindSheetEvents(activeSheet.value)
  rebuildGrid()
})

watch(() => [props.rows, props.cols], rebuildGrid)

watch(
  () => props.workbook,
  (wb, prev) => {
    if (wb === prev) return
    activeIndex.value = workbook.value.activeSheetIndex
    sheetList.value = workbook.value.getSheets()
    bindWorkbookEvents(workbook.value)
    bindSheetEvents(activeSheet.value)
    rebuildGrid()
    bump()
  }
)

onBeforeUnmount(() => {
  offRegistryChange()
  for (const dispose of disposeWorkbookEvents) dispose()
  for (const dispose of disposeSheetEvents) dispose()
  grid?.release()
  grid = undefined
})

const exposed: _SheetExposed = {
  workbook,
  getActiveSheet: () => activeSheet.value,
  getContext: () => context,
  getGrid: () => grid
}

defineExpose(exposed)
</script>
