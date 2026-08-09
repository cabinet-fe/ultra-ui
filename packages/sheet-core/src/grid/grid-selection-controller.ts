import { ListTable } from '@visactor/vtable'

import type { CellAddress, CellRange } from '../core/address'
import { createRange } from '../core/address'
import { computeFillTargetRange, generateFill, type FillDirection } from '../core/fill'
import type { SelectionState } from '../core/selection'
import type { Sheet } from '../core/sheet'
import type { GridCoords } from './grid-coords'

export interface GridSelectionControllerOptions {
  interceptSelection?: () => boolean
  onSelectionIntercept?: (range: CellRange) => void
}

export class GridSelectionController {
  private readonly sheet: Sheet
  private readonly table: ListTable
  private readonly coords: GridCoords
  private readonly interceptSelection?: () => boolean
  private readonly onSelectionIntercept?: (range: CellRange) => void

  public syncingSelection = false
  public selectionIntercepted = false
  public fillSourceRange: CellRange | null = null

  constructor(
    sheet: Sheet,
    table: ListTable,
    coords: GridCoords,
    options: GridSelectionControllerOptions = {}
  ) {
    this.sheet = sheet
    this.table = table
    this.coords = coords
    this.interceptSelection = options.interceptSelection
    this.onSelectionIntercept = options.onSelectionIntercept
  }

  bindTableEvents(getRows: () => number, getCols: () => number, isReadonly: boolean): void {
    this.table.on(ListTable.EVENT_TYPE.SELECTED_CELL, (args) => {
      if (this.syncingSelection) return
      this.selectionIntercepted = false
      const range = this.readSelectedModelRange()
      if (range) {
        if (this.tryInterceptSelection(range)) {
          this.selectionIntercepted = true
          return
        }
        this.sheet.selectRange(range, this.resolveSelectionActive(range, getRows(), getCols()))
        return
      }
      const addr = this.coords.toSheetAddr(this.table, args.col, args.row)
      if (addr) {
        const single = createRange(addr, addr)
        if (this.tryInterceptSelection(single)) {
          this.selectionIntercepted = true
          return
        }
        this.sheet.selectCell(addr)
      }
    })

    this.table.on(ListTable.EVENT_TYPE.DRAG_SELECT_END, () => {
      const range = this.readSelectedModelRange()
      if (!range) return
      if (this.selectionIntercepted) {
        this.selectionIntercepted = false
        return
      }
      if (this.tryInterceptSelection(range)) return
      this.sheet.selectRange(range, this.resolveSelectionActive(range, getRows(), getCols()))
    })

    if (!isReadonly) {
      this.table.on(ListTable.EVENT_TYPE.MOUSEDOWN_FILL_HANDLE, () => {
        this.fillSourceRange = this.readSelectedModelRange()
      })

      this.table.on(ListTable.EVENT_TYPE.DRAG_FILL_HANDLE_END, (args) => {
        const source = this.fillSourceRange
        this.fillSourceRange = null
        const direction = args.direction as FillDirection | undefined
        if (!source || !direction) return
        const expanded = this.readSelectedModelRange()
        if (!expanded) return
        const target = computeFillTargetRange(source, direction, expanded)
        if (!target) return
        const items = generateFill({
          source,
          target,
          direction,
          getCellData: (a) => this.sheet.getCellData(a)
        })
        if (items.length === 0) return
        this.sheet.setCells(items)
        this.sheet.selectRange(createRange(source.start, expanded.end))
      })
    }
  }

  pushSelectionToTable(state: SelectionState, rows: number, cols: number): void {
    const range =
      state.ranges[0] ??
      (state.activeCell ? { start: state.activeCell, end: state.activeCell } : null)
    if (!range) return
    const start = this.coords.toTableCoord(this.table, range.start)
    const end = this.coords.toTableCoord(this.table, range.end)
    const scrollAddr = state.activeCell ?? range.start
    const scrollTarget = this.coords.toTableCoord(this.table, scrollAddr)
    const clamp = (v: { col: number; row: number }): { col: number; row: number } => ({
      col: Math.min(Math.max(v.col, 1), cols),
      row: Math.min(Math.max(v.row, 1), rows)
    })
    const startClamped = clamp(start)
    const endClamped = clamp(end)
    const scrollClamped = clamp(scrollTarget)
    const eventManager = (this.table as unknown as { eventManager?: { isDraging: boolean } })
      .eventManager
    const wasDraging = eventManager?.isDraging === true
    if (wasDraging) eventManager!.isDraging = false
    this.syncingSelection = true
    try {
      this.clearSelectionOverlays()
      this.table.selectCells([{ start: startClamped, end: endClamped }])
      if (!this.isCellVisible(scrollClamped.col, scrollClamped.row)) {
        this.table.scrollToCell({ col: scrollClamped.col, row: scrollClamped.row })
      }
    } finally {
      if (wasDraging) eventManager!.isDraging = true
      this.syncingSelection = false
    }
  }

  clearSelectionOverlays(): void {
    const scene = (this.table as unknown as { scenegraph?: { [k: string]: unknown } }).scenegraph
    if (!scene) return
    const groups = [
      'bodySelectGroup',
      'rowHeaderSelectGroup',
      'colHeaderSelectGroup',
      'cornerHeaderSelectGroup',
      'rightFrozenSelectGroup',
      'bottomFrozenSelectGroup',
      'rightTopCornerSelectGroup',
      'leftBottomCornerSelectGroup',
      'rightBottomCornerSelectGroup'
    ]
    for (const name of groups) {
      const group = scene[name] as { removeAllChild?: (deep?: boolean) => void } | undefined
      group?.removeAllChild?.()
    }
    scene.selectedRangeComponents = new Map()
    scene.selectingRangeComponents = new Map()
    scene.customSelectedRangeComponents = new Map()
  }

  isCellVisible(col: number, row: number): boolean {
    const rect = this.table.getCellRelativeRect(col, row)
    const drawRange = this.table.getDrawRange()
    return (
      rect.left >= drawRange.left &&
      rect.top >= drawRange.top &&
      rect.right <= drawRange.right &&
      rect.bottom <= drawRange.bottom
    )
  }

  readSelectedModelRange(): CellRange | null {
    const ranges = this.table.getSelectedCellRanges()
    const range = ranges[ranges.length - 1]
    if (!range) return null
    const { colOffset, rowOffset } = this.coords.getOffsets(this.table)
    const minCol = Math.min(range.start.col, range.end.col)
    const maxCol = Math.max(range.start.col, range.end.col)
    const minRow = Math.min(range.start.row, range.end.row)
    const maxRow = Math.max(range.start.row, range.end.row)
    const startCol = Math.max(minCol, colOffset)
    const startRow = Math.max(minRow, rowOffset)
    const endCol = Math.max(maxCol, colOffset)
    const endRow = Math.max(maxRow, rowOffset)
    const start = this.coords.toSheetAddr(this.table, startCol, startRow)
    const end = this.coords.toSheetAddr(this.table, endCol, endRow)
    if (!start || !end) return null
    return createRange(start, end)
  }

  resolveSelectionActive(range: CellRange, rows: number, cols: number): CellAddress | undefined {
    const spansAllCols = range.start.col === 0 && range.end.col >= cols - 1
    const spansAllRows = range.start.row === 0 && range.end.row >= rows - 1
    if (!spansAllCols && !spansAllRows) return undefined
    return this.visibleEdgeInRange(range, spansAllCols, spansAllRows)
  }

  private visibleEdgeInRange(
    range: CellRange,
    useVisibleCol: boolean,
    useVisibleRow: boolean
  ): CellAddress {
    const { colOffset, rowOffset } = this.coords.getOffsets(this.table)
    const visible = this.table.getBodyVisibleCellRange()
    let leftCol = range.start.col
    let topRow = range.start.row
    if (visible) {
      if (useVisibleCol) {
        leftCol = this.sheet.frozen.cols > 0 ? 0 : Math.max(0, visible.colStart - colOffset)
      }
      if (useVisibleRow) {
        topRow = this.sheet.frozen.rows > 0 ? 0 : Math.max(0, visible.rowStart - rowOffset)
      }
    }
    return {
      row: Math.min(Math.max(topRow, range.start.row), range.end.row),
      col: Math.min(Math.max(leftCol, range.start.col), range.end.col)
    }
  }

  tryInterceptSelection(range: CellRange): boolean {
    if (!this.interceptSelection?.()) return false
    this.onSelectionIntercept?.(range)
    return true
  }
}
