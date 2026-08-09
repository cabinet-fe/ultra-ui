import { ListTable } from '@visactor/vtable'

import type { CellAddress } from '../core/address'
import { cellKey, iterateRange } from '../core/address'
import type { CellValue } from '../core/cell-store'
import type { Sheet } from '../core/sheet'
import { GridCoords, clientPointFromEvent, type SheetGridContextMenuInfo } from './grid-coords'
import type { GridRowHeightEngine } from './grid-row-height-engine'
import type { GridSelectionController } from './grid-selection-controller'
import type { GridStyleResolver } from './grid-style-resolver'

export const BATCH_FULL_REBUILD_THRESHOLD = 64

export interface BindTableSyncOptions {
  table: ListTable
  sheet: Sheet
  coords: GridCoords
  rowHeightEngine: GridRowHeightEngine
  styleResolver: GridStyleResolver
  cols: number
  getRows: () => number
  isReadonly: boolean
  onContextMenu?: (info: SheetGridContextMenuInfo) => void
  getTableCellValue: (addr: CellAddress) => CellValue | undefined
}

export class GridSyncManager {
  private released = false
  private visible = true
  private batchDirty: Map<number, CellAddress> | null = null
  private batchScheduled = false
  private mergeRefreshScheduled = false
  private mergeDirty = false
  private pendingTableSync: Map<number, CellAddress> | null = null

  isReleased(): boolean {
    return this.released
  }

  /** 标记已释放并清空挂起批量队列（由 SheetGrid.release 在 dispose 回调前调用） */
  markReleased(): void {
    if (this.released) return
    this.released = true
    this.batchDirty = null
  }

  enqueueCellSync(addr: CellAddress, onFlush: () => void): void {
    if (this.released) return
    if (!this.batchDirty) this.batchDirty = new Map()
    this.batchDirty.set(cellKey(addr), addr)
    if (this.batchScheduled) return
    this.batchScheduled = true
    queueMicrotask(() => onFlush())
  }

  flushCellBatch(
    refresh: () => void,
    pushCellToTable: (addr: CellAddress) => void,
    refreshCellStyle: (addr: CellAddress) => void,
    refreshFacingConsumers: (addr: CellAddress) => void,
    syncWrapRowHeight: (row: number) => void
  ): void {
    this.batchScheduled = false
    const dirty = this.batchDirty
    if (!dirty || dirty.size === 0) return
    if (this.released || !this.visible) return
    this.batchDirty = null
    const rows = new Set<number>()
    for (const addr of dirty.values()) rows.add(addr.row)
    if (dirty.size > BATCH_FULL_REBUILD_THRESHOLD) {
      refresh()
      for (const row of rows) syncWrapRowHeight(row)
      return
    }
    for (const addr of dirty.values()) {
      pushCellToTable(addr)
      refreshCellStyle(addr)
      refreshFacingConsumers(addr)
    }
    for (const row of rows) syncWrapRowHeight(row)
  }

  flushPendingBatch(
    force: boolean,
    refresh: () => void,
    syncWrapRowHeight: (row: number) => void
  ): void {
    if (this.released || this.batchScheduled) return
    const dirty = this.batchDirty
    if (!dirty || dirty.size === 0) return
    if (!force && !this.visible) return
    this.batchDirty = null
    refresh()
    const rows = new Set<number>()
    for (const addr of dirty.values()) rows.add(addr.row)
    for (const row of rows) syncWrapRowHeight(row)
  }

  flushPending(refresh: () => void, flushCellBatch: () => void, flushImageLayer: () => void): void {
    if (this.released) return
    if (this.batchScheduled) {
      this.batchScheduled = false
      flushCellBatch()
    }
    if (this.mergeRefreshScheduled) {
      this.mergeRefreshScheduled = false
      if (!this.released) refresh()
    }
    if (this.mergeDirty) {
      this.mergeDirty = false
      if (!this.released) refresh()
    }
    flushImageLayer()
  }

  syncFromModel(
    refresh: () => void,
    syncWrapRowHeight: (r: number) => void,
    applyFrozen: () => void,
    pushSelection: () => void,
    setImageVisible: (v: boolean) => void
  ): void {
    if (this.released) return
    this.visible = true
    setImageVisible(true)
    applyFrozen()
    pushSelection()
    this.flushPendingBatch(true, refresh, syncWrapRowHeight)
    if (this.mergeDirty) {
      this.mergeDirty = false
      refresh()
    }
  }

  setVisible(
    on: boolean,
    refresh: () => void,
    syncWrapRowHeight: (r: number) => void,
    setImageVisible: (v: boolean) => void
  ): void {
    this.visible = on
    setImageVisible(on)
    if (on && !this.released) {
      this.flushPendingBatch(true, refresh, syncWrapRowHeight)
      if (this.mergeDirty) {
        this.mergeDirty = false
        refresh()
      }
    }
  }

  pushCellToTable(
    table: ListTable,
    addr: CellAddress,
    getTableCellValue: (addr: CellAddress) => CellValue | undefined,
    coords: GridCoords
  ): void {
    const { col, row } = coords.toTableCoord(table, addr)
    const value = getTableCellValue(addr)
    table.changeCellValue(col, row, value as string | number | null, false, false)
  }

  refreshCellStyle(table: ListTable, sheet: Sheet, addr: CellAddress, coords: GridCoords): void {
    const merge = sheet.merges.getMergeAt(addr)
    if (merge) {
      for (const pos of iterateRange(merge)) {
        const { col, row } = coords.toTableCoord(table, pos)
        table.updateCellContent(col, row)
      }
      return
    }
    const { col, row } = coords.toTableCoord(table, addr)
    table.updateCellContent(col, row)
  }

  refreshFacingConsumers(
    table: ListTable,
    sheet: Sheet,
    addr: CellAddress,
    coords: GridCoords,
    cols: number,
    rows: number,
    refreshCellStyle: (addr: CellAddress) => void
  ): void {
    const merge = sheet.merges.getMergeAt(addr)
    const endRow = merge?.end.row ?? addr.row
    const endCol = merge?.end.col ?? addr.col
    const targets: CellAddress[] = []
    for (let row = addr.row; row <= endRow; row++) {
      if (addr.col > 0) targets.push({ row, col: addr.col - 1 })
      if (endCol + 1 < cols) targets.push({ row, col: endCol + 1 })
    }
    for (let col = addr.col; col <= endCol; col++) {
      if (addr.row > 0) targets.push({ row: addr.row - 1, col })
      if (endRow + 1 < rows) targets.push({ row: endRow + 1, col })
    }
    const seen = new Set<number>()
    for (const target of targets) {
      const anchor = sheet.merges.resolveAnchor(target)
      const key = cellKey(anchor)
      if ((anchor.row === addr.row && anchor.col === addr.col) || seen.has(key)) continue
      seen.add(key)
      refreshCellStyle(anchor)
    }
  }

  bindTableSyncEvents(opts: BindTableSyncOptions): void {
    const {
      table,
      sheet,
      coords,
      rowHeightEngine,
      styleResolver,
      isReadonly,
      onContextMenu,
      getTableCellValue
    } = opts
    if (!isReadonly) {
      table.on(ListTable.EVENT_TYPE.CHANGE_CELL_VALUE, (args) => {
        const addr = coords.toSheetAddr(table, args.col, args.row)
        if (addr == null) return
        const next = args.changedValue ?? null
        const before = sheet.getCellData(sheet.merges.resolveAnchor(addr))
        const isEmptyCommit = next == null || next === ''
        const hadContent =
          before != null &&
          ((before.v != null && before.v !== '') || (before.f != null && before.f !== ''))
        this.pendingTableSync = new Map([[cellKey(addr), addr]])
        try {
          if (!(isEmptyCommit && !hadContent)) sheet.setCellValue(addr, next)
        } finally {
          const pending = this.pendingTableSync
          this.pendingTableSync = null
          if (pending) {
            const wrapRows = new Set<number>()
            for (const pendingAddr of pending.values()) {
              this.pushCellToTable(table, pendingAddr, getTableCellValue, coords)
              this.refreshCellStyle(table, sheet, pendingAddr, coords)
              this.refreshFacingConsumers(
                table,
                sheet,
                pendingAddr,
                coords,
                opts.cols,
                opts.getRows(),
                (a) => this.refreshCellStyle(table, sheet, a, coords)
              )
              wrapRows.add(pendingAddr.row)
            }
            for (const row of wrapRows)
              rowHeightEngine.syncWrapRowHeight(row, table, coords, styleResolver)
          }
        }
      })

      table.on(ListTable.EVENT_TYPE.RESIZE_ROW_END, (args) => {
        const addr = coords.toSheetAddr(table, coords.getOffsets(table).colOffset, args.row)
        if (!addr) return
        sheet.setRowHeight(addr.row, args.rowHeight)
        rowHeightEngine.setTableRowHeight(
          table,
          coords.toTableCoord(table, addr).row,
          args.rowHeight
        )
      })

      table.on(ListTable.EVENT_TYPE.RESIZE_COLUMN_END, (args) => {
        const col = args.col
        const addr = coords.toSheetAddr(table, col, coords.getOffsets(table).rowOffset)
        if (!addr) return
        for (const row of sheet.store.rowsForColumn(addr.col)) {
          rowHeightEngine.syncWrapRowHeight(row, table, coords, styleResolver)
        }
      })
    }

    table.on(ListTable.EVENT_TYPE.CONTEXTMENU_CELL, (args) => {
      const event = args.event
      if (event && typeof event === 'object' && 'preventDefault' in event) {
        ;(event as { preventDefault: () => void }).preventDefault()
      }
      if (!onContextMenu) return
      const point = clientPointFromEvent(event)
      const info = coords.buildContextMenuInfo(
        table,
        args.col,
        args.row,
        point?.x ?? 0,
        point?.y ?? 0
      )
      queueMicrotask(() => onContextMenu(info))
    })
  }

  bindSheetEvents(
    sheet: Sheet,
    table: ListTable,
    coords: GridCoords,
    rowHeightEngine: GridRowHeightEngine,
    styleResolver: GridStyleResolver,
    selectionController: GridSelectionController,
    getRows: () => number,
    getCols: () => number,
    refresh: () => void,
    getTableCellValue: (addr: CellAddress) => CellValue | undefined,
    applyFrozen: () => void
  ): (() => void)[] {
    const disposers: (() => void)[] = []

    const flushCellBatch = () => {
      this.flushCellBatch(
        refresh,
        (a) => this.pushCellToTable(table, a, getTableCellValue, coords),
        (a) => this.refreshCellStyle(table, sheet, a, coords),
        (a) =>
          this.refreshFacingConsumers(table, sheet, a, coords, getCols(), getRows(), (target) =>
            this.refreshCellStyle(table, sheet, target, coords)
          ),
        (r) => rowHeightEngine.syncWrapRowHeight(r, table, coords, styleResolver)
      )
    }

    disposers.push(
      sheet.on('cell-change', ({ addr }) => {
        if (this.pendingTableSync) {
          this.pendingTableSync.set(cellKey(addr), addr)
          return
        }
        this.enqueueCellSync(addr, flushCellBatch)
      })
    )

    disposers.push(
      sheet.on('merge-change', () => {
        if (this.released || this.mergeRefreshScheduled) return
        this.mergeRefreshScheduled = true
        queueMicrotask(() => {
          this.mergeRefreshScheduled = false
          if (this.released) return
          if (!this.visible) {
            this.mergeDirty = true
            return
          }
          refresh()
        })
      })
    )

    disposers.push(sheet.on('content-reset', () => refresh()))

    disposers.push(
      sheet.on('meta-change', ({ addr }) => {
        if (this.released) return
        if (!addr) {
          if (!this.visible) {
            this.mergeDirty = true
            return
          }
          refresh()
          return
        }
        this.enqueueCellSync(addr, flushCellBatch)
      })
    )

    disposers.push(
      sheet.on('frozen-change', () => {
        if (!this.released) applyFrozen()
      })
    )

    disposers.push(
      sheet.on('selection-change', (state) => {
        if (!this.released) {
          selectionController.pushSelectionToTable(state, getRows(), getCols())
        }
      })
    )

    return disposers
  }
}
