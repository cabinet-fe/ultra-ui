import { contextmenu } from '@veltra/desktop'
import { onBeforeUnmount, onMounted, watch } from 'vue'

import type { CellAddress, CellRange } from '../core/address'
import type { Sheet } from '../core/sheet'
import { SheetGrid, type SheetGridContextMenuInfo } from '../grid/sheet-grid'
import type { SheetContext } from '../tools/context'
import type { SheetProps } from '../types'
import {
  buildBodyMenus,
  buildColHeaderMenus,
  buildRowHeaderMenus,
  ensureContextMenuSelection,
  resolveRenderSize
} from './sheet-context-menu'

/** 模板 ref（useTemplateRef 的只读形态） */
type ElRef<T> = { readonly value: T | null | undefined }

/** 公式栏暴露接口（镜像 + 引用选择） */
export interface FormulaBarMirror {
  mirrorGridEdit: (addr: CellAddress) => void
  exitMirror: (addr: CellAddress) => void
  /** fx 编辑中且处于可插入引用位置 */
  isRefSelecting: () => boolean
  /** 网格 pointerdown → 挂起 blur 提交 */
  beginBlurSuppress: () => void
  /** 画布选区 → 插入引用文本 */
  handleRefSelect: (range: CellRange) => void
}

interface UseSheetGridOptions {
  props: SheetProps
  gridRef: ElRef<HTMLElement>
  getActiveSheet: () => Sheet
  context: SheetContext
  formulaBarRef: ElRef<FormulaBarMirror>
}

/**
 * SheetGrid 生命周期与网格右键菜单：
 * - rebuildGrid：释放旧实例并按当前活动 sheet 重建
 * - 右键菜单：body / 行号 / 列头
 * - 公式栏引用选择：interceptSelection 拦截选区回写 + pointerdown 挂起 blur
 */
export function useSheetGrid(options: UseSheetGridOptions) {
  const { props, gridRef, getActiveSheet, context, formulaBarRef } = options
  let grid: SheetGrid | undefined
  let detachPointerDown: (() => void) | undefined

  function handleContextMenu(info: SheetGridContextMenuInfo): void {
    const sheet = getActiveSheet()
    const renderSize = resolveRenderSize(props.rows, props.cols, sheet.rows, sheet.cols)
    ensureContextMenuSelection(context, info, renderSize)

    const menus =
      info.kind === 'row-header'
        ? buildRowHeaderMenus(context)
        : info.kind === 'col-header'
          ? buildColHeaderMenus(context)
          : buildBodyMenus(context)

    contextmenu.pop({ mousePosition: { x: info.x, y: info.y }, width: 240, menus })
  }

  function bindGridPointerDown(container: HTMLElement): void {
    detachPointerDown?.()
    const onPointerDown = () => {
      formulaBarRef.value?.beginBlurSuppress()
    }
    // capture：赶在 textarea blur 之前挂起提交
    container.addEventListener('pointerdown', onPointerDown, true)
    detachPointerDown = () => {
      container.removeEventListener('pointerdown', onPointerDown, true)
      detachPointerDown = undefined
    }
  }

  function rebuildGrid(): void {
    const container = gridRef.value
    if (!container) return
    detachPointerDown?.()
    grid?.release()
    grid = new SheetGrid({
      container,
      sheet: getActiveSheet(),
      rows: props.rows,
      cols: props.cols,
      onContextMenu: handleContextMenu,
      onEditStart: (addr) => formulaBarRef.value?.mirrorGridEdit(addr),
      onEditEnd: (addr) => formulaBarRef.value?.exitMirror(addr),
      // 引用选择：不回写模型选区，序列化为 A1 / A1:B2 交给公式栏
      interceptSelection: () => formulaBarRef.value?.isRefSelecting() ?? false,
      onSelectionIntercept: (range) => formulaBarRef.value?.handleRefSelect(range)
    })
    bindGridPointerDown(container)
  }

  onMounted(rebuildGrid)

  watch(() => [props.rows, props.cols], rebuildGrid)

  onBeforeUnmount(() => {
    detachPointerDown?.()
    grid?.release()
    grid = undefined
  })

  return { rebuildGrid, getGrid: () => grid }
}
