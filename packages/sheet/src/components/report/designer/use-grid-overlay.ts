import type { CellAddress, SheetGrid } from '@veltra/sheet-core'
import { onBeforeUnmount, watch, type Ref } from 'vue'

import {
  getCellOverlayRect,
  resolveGridOverlayLayout,
  type CellOverlayRect,
  type GridOverlayLayout
} from './cell-coords'

type GridGetter = () => SheetGrid | undefined

/** 网格滚动时重算 overlay 坐标；避免在 props 不稳定时重复绑定监听 */
export function useGridOverlaySync(options: {
  hostEl: Ref<HTMLElement | null>
  getGrid: GridGetter
  watchSources: () => readonly unknown[]
  update: () => void
}): void {
  let offScroll: (() => void) | undefined
  let rafId = 0

  function scheduleUpdate(): void {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(options.update)
  }

  function bindScroll(): void {
    offScroll?.()
    offScroll = undefined
    const grid = options.getGrid()
    if (!grid) return

    const table = grid.getTable()
    const onScroll = (): void => scheduleUpdate()
    const scrollEvent = 'scroll'
    table.on(scrollEvent, onScroll)
    offScroll = () => table.off(scrollEvent, onScroll)
  }

  watch(
    options.watchSources,
    () => {
      bindScroll()
      scheduleUpdate()
    },
    { immediate: true, flush: 'post' }
  )

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId)
    offScroll?.()
  })
}

export function readCellOverlayRect(
  cell: CellAddress,
  host: HTMLElement,
  getGrid: GridGetter
): ReturnType<typeof getCellOverlayRect> {
  const grid = getGrid()
  if (!grid) return null
  const resolved = resolveGridOverlayLayout(host)
  if (!resolved) return null
  return getCellOverlayRect(grid, cell, resolved.layout)
}

export function readGridOverlaySize(host: HTMLElement): { width: number; height: number } | null {
  const resolved = resolveGridOverlayLayout(host)
  if (!resolved) return null
  const { layout } = resolved
  return { width: layout.viewW + layout.offsetX, height: layout.viewH + layout.offsetY }
}

export interface BindingFloatPanelPosition {
  placement: 'above' | 'below'
  left: number
  top: number
}

/** 悬浮编辑卡锚点：空间按网格画布（非宿主顶）计算，避免顶行格误判为上方可放 */
export function resolveBindingFloatPanelPosition(
  rect: CellOverlayRect,
  layout: GridOverlayLayout,
  panelWidth: number,
  panelHeight: number,
  hostWidth: number,
  options?: { gap?: number; edgePad?: number }
): BindingFloatPanelPosition {
  const gap = options?.gap ?? 8
  const edgePad = options?.edgePad ?? 10
  const gridTop = layout.offsetY
  const gridBottom = layout.offsetY + layout.viewH

  let left = rect.centerX
  const halfW = panelWidth / 2
  left = Math.max(edgePad + halfW, Math.min(hostWidth - edgePad - halfW, left))

  const spaceAbove = rect.top - gridTop
  const spaceBelow = gridBottom - rect.bottom
  const need = panelHeight + gap

  let placement: 'above' | 'below' =
    spaceAbove >= need || spaceAbove >= spaceBelow ? 'above' : 'below'

  if (placement === 'above' && rect.top - gap - panelHeight < gridTop + edgePad) {
    if (spaceBelow >= need || spaceBelow > spaceAbove) placement = 'below'
  }

  const top = placement === 'above' ? rect.top - gap : rect.bottom + gap

  return { placement, left: Math.round(left), top: Math.round(top) }
}
