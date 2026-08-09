import type { CellAddress } from '@veltra/sheet-core'
import type { SheetGrid } from '@veltra/sheet-core/grid/sheet-grid'
import { onBeforeUnmount, watch, type Ref } from 'vue'

import { getCellOverlayRect, resolveGridOverlayLayout } from './cell-coords'

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
