import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import type { Sheet } from '../core/sheet'
import { Workbook } from '../core/workbook'
import { createSheetContext } from '../tools/context'
import { defaultToolRegistry } from '../tools/registry'
import type { SheetProps } from '../types'

/**
 * useSheetState 与宿主组件的协作钩子。
 * 弹层关闭 / 网格重建是宿主编排动作（由 use-tool-popup / use-sheet-grid 提供），
 * 以钩子注入避免组合函数之间互相引用。
 */
export interface SheetStateHooks {
  /** 活动 sheet 或工作簿切换前调用（关闭弹层并提交面板事务） */
  onBeforeSheetChange: () => void
  /** 需要重建网格（tab 切换 / structure-change / 工作簿切换 / 导入替换） */
  rebuildGrid: () => void
}

type Emit = (event: 'active-sheet-change', payload: { sheet: Sheet; index: number }) => void

/**
 * USheet 的状态源（单一数据源，其余状态由此推导）：
 * - workbook（外部传入或内部自建单 sheet 工作簿）、sheetList、activeIndex、activeSheet
 * - SheetContext 工具门面（动态解析活动 sheet，tab 切换后自动指向当前 sheet）
 * - stateTick：工具 visible/disabled/active 等纯函数的状态源版本号（bump 触发重算）
 * - 工作簿 / 活动 sheet 的事件绑定（tab 切换、工作簿 prop 变更时重绑）
 */
export function useSheetState(props: SheetProps, emit: Emit, hooks: SheetStateHooks) {
  /** 工作簿：外部传入或内部自建（单 sheet） */
  const internalWorkbook = new Workbook()
  const workbook = computed(() => props.workbook ?? internalWorkbook)

  /** 激活 sheet 索引（镜像 workbook.activeSheetIndex，经事件同步） */
  const activeIndex = ref(workbook.value.activeSheetIndex)
  /** sheet 列表（tabs 渲染；由 sheets-change 同步） */
  const sheetList = shallowRef<Sheet[]>(workbook.value.getSheets())
  const activeSheet = computed(
    () => sheetList.value[activeIndex.value] ?? workbook.value.activeSheet
  )

  /** 工具上下文：动态解析活动 sheet，tab 切换后自动指向当前 sheet */
  const context = createSheetContext(() => activeSheet.value, workbook.value)

  /** 工具栏状态版本号：visible/disabled/active 是 (ctx) => boolean 纯函数，状态源变化时 bump 触发重算 */
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
      sheet.on('merge-change', bump),
      sheet.on('frozen-change', bump),
      // 行列插入/删除 → 重建网格（渲染行列数 = max(props, sheet.rows/cols)，
      // 数据/选区/冻结/行高随重建恢复；低频操作直接重建）
      sheet.on('structure-change', hooks.rebuildGrid)
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
      wb.on('sheet-rename', () => {
        // sheet 对象未变（浅引用），换新数组引用触发 tab 文本重渲染
        sheetList.value = workbook.value.getSheets()
        bump()
      }),
      wb.on('active-sheet-change', ({ sheet, index }) => {
        hooks.onBeforeSheetChange() // tab 切换：关闭弹层并提交面板事务
        activeIndex.value = index
        bindSheetEvents(sheet)
        hooks.rebuildGrid()
        bump()
        emit('active-sheet-change', { sheet, index })
      })
    ]
  }

  /**
   * 工作簿内容被结构性替换后同步（如导入 xlsx 的 replaceWorkbook）：
   * replaceWorkbook 未必触发 active-sheet-change（同 index），需显式同步 tabs、
   * 重绑 sheet 事件并重建网格。
   */
  function syncFromWorkbook(): void {
    sheetList.value = workbook.value.getSheets()
    activeIndex.value = workbook.value.activeSheetIndex
    bindSheetEvents(activeSheet.value)
    hooks.rebuildGrid()
    bump()
  }

  const offRegistryChange = defaultToolRegistry.onChange(bump)

  onMounted(() => {
    bindWorkbookEvents(workbook.value)
    bindSheetEvents(activeSheet.value)
  })

  watch(
    () => props.workbook,
    (wb, prev) => {
      if (wb === prev) return
      hooks.onBeforeSheetChange() // 工作簿切换：关闭弹层并提交面板事务
      activeIndex.value = workbook.value.activeSheetIndex
      sheetList.value = workbook.value.getSheets()
      bindWorkbookEvents(workbook.value)
      bindSheetEvents(activeSheet.value)
      hooks.rebuildGrid()
      bump()
    }
  )

  onBeforeUnmount(() => {
    offRegistryChange()
    for (const dispose of disposeWorkbookEvents) dispose()
    for (const dispose of disposeSheetEvents) dispose()
  })

  return { workbook, activeIndex, sheetList, activeSheet, context, stateTick, syncFromWorkbook }
}
