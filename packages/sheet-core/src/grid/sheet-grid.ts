import { CustomLayout, ListTable } from '@visactor/vtable'
import type { ListTableConstructorOptions } from '@visactor/vtable'
import type { CustomRenderFunctionArg } from '@visactor/vtable/es/ts-types/customElement'
import type { ICustomLayoutFuc, ICustomLayoutObj } from '@visactor/vtable/es/ts-types/customLayout'

import type { CellAddress, CellRange } from '../core/address'
import { colIndexToName } from '../core/address'
import type { CellValue } from '../core/cell-store'
import type { FrozenState, Sheet } from '../core/sheet'
import {
  GridCoords,
  type SheetGridContextMenuInfo,
  type SheetGridContextMenuKind
} from './grid-coords'
import { EDITOR_NAME, registerGridEditor, unregisterGridEditor } from './grid-editor-router'
import { GridRowHeightEngine, estimateWrapRowHeight } from './grid-row-height-engine'
import { GridSelectionController } from './grid-selection-controller'
import {
  GridStyleResolver,
  cellStyleToVTableStyle,
  fontSizePtToPx,
  type ResolveCellStyleHook
} from './grid-style-resolver'
import { GridSyncManager, applyColWidthsFromModel } from './grid-sync-manager'
import { ImageLayer } from './image-layer'
import {
  SHEET_DEFAULT_COL_WIDTH,
  SHEET_DEFAULT_ROW_HEIGHT,
  sheetRowSeriesNumberStyle,
  sheetVTableTheme
} from './vtable-theme'

export {
  CustomLayout,
  cellStyleToVTableStyle,
  estimateWrapRowHeight,
  fontSizePtToPx,
  type ICustomLayoutObj,
  type ResolveCellStyleHook,
  type SheetGridContextMenuInfo,
  type SheetGridContextMenuKind
}

export type ResolveDisplayValue = (
  addr: CellAddress,
  base: CellValue | undefined
) => CellValue | undefined

/**
 * 动态单元格渲染 Hook（ADR-0004）：视口单元格布局时按格触发。
 * 返回 VTable customLayout 布局对象以自定义该格渲染形态（`renderDefault`
 * 控制是否叠加默认文本）；返回 `undefined` 回落默认渲染。
 * `base` 为 record 显示值（即经 `resolveDisplayValue` 覆盖后的值，空串格为
 * undefined，与 VTable 收到的一致）；合并区域非锚点格 base 为该格自身的空值
 * （值只存锚点），宿主如需合并文本应自行读锚点。纯函数、同步返回、O(1) 查找，
 * 禁止异步操作与大对象分配（见 AGENTS.md「cell hook 性能契约」）。不写模型、
 * 不进快照。布局构建用 `CustomLayout`（Container/Text/Rect…，本模块已
 * re-export）。
 */
export type ResolveCellRenderer = (
  addr: CellAddress,
  base: CellValue | undefined
) => ICustomLayoutObj | undefined

export interface SheetGridOptions {
  container: HTMLElement
  sheet: Sheet
  rows?: number
  cols?: number
  resolveDisplayValue?: ResolveDisplayValue
  resolveCellStyle?: ResolveCellStyleHook
  resolveCellRenderer?: ResolveCellRenderer
  onContextMenu?: (info: SheetGridContextMenuInfo) => void
  onEditStart?: (addr: CellAddress) => void
  onEditEnd?: (addr: CellAddress) => void
  interceptSelection?: () => boolean
  onSelectionIntercept?: (range: CellRange) => void
  readonly?: boolean
  /** 是否显示行号列，默认 true */
  showRowHeader?: boolean
  /** 是否显示列字母表头，默认 true */
  showColHeader?: boolean
}

/** VTable 适配层 Facade 入口类 */
export class SheetGrid {
  private readonly sheet: Sheet
  private readonly table: ListTable
  private readonly container: HTMLElement
  private rows: number
  private cols: number
  private readonly onContextMenu?: (info: SheetGridContextMenuInfo) => void
  private readonly onEditStart?: (addr: CellAddress) => void
  private readonly onEditEnd?: (addr: CellAddress) => void
  private readonly resolveDisplayValue?: ResolveDisplayValue
  private readonly resolveCellRenderer?: ResolveCellRenderer
  private readonly isReadonly: boolean
  private readonly showRowHeader: boolean
  private readonly showColHeader: boolean
  private readonly disposers: (() => void)[] = []
  private editingAddr: CellAddress | null = null

  private readonly coords: GridCoords
  private readonly styleResolver: GridStyleResolver
  private readonly rowHeightEngine: GridRowHeightEngine
  private readonly selectionController: GridSelectionController
  private readonly syncManager: GridSyncManager
  private readonly imageLayer: ImageLayer

  constructor(options: SheetGridOptions) {
    this.sheet = options.sheet
    this.container = options.container
    // options 仅扩张：已声明更小的模型尺寸（删行后）不被 props 下限撑回
    this.sheet.ensureTableSize(options.rows ?? 100, options.cols ?? 26)
    this.sheet.ensureTableSize(this.sheet.rowCount, this.sheet.colCount)
    this.rows = Math.max(this.sheet.rows, 1)
    this.cols = Math.max(this.sheet.cols, 1)
    this.onContextMenu = options.onContextMenu
    this.onEditStart = options.onEditStart
    this.onEditEnd = options.onEditEnd
    this.resolveDisplayValue = options.resolveDisplayValue
    this.resolveCellRenderer = options.resolveCellRenderer
    this.isReadonly = options.readonly ?? false
    this.showRowHeader = options.showRowHeader ?? true
    this.showColHeader = options.showColHeader ?? true

    this.coords = new GridCoords()
    this.styleResolver = new GridStyleResolver(this.sheet, this.cols, this.rows, {
      resolveCellStyle: options.resolveCellStyle
    })
    this.rowHeightEngine = new GridRowHeightEngine(this.sheet, this.rows, this.cols)
    this.syncManager = new GridSyncManager()

    this.table = new ListTable(options.container, this.buildOptions())
    registerGridEditor(this.table, this)
    this.selectionController = new GridSelectionController(this.sheet, this.table, this.coords, {
      interceptSelection: options.interceptSelection,
      onSelectionIntercept: options.onSelectionIntercept
    })

    this.rowHeightEngine.restrictRowResizeToSeriesNumber(this.table)
    this.selectionController.bindTableEvents(
      () => this.rows,
      () => this.cols,
      this.isReadonly
    )
    this.syncManager.bindTableSyncEvents({
      table: this.table,
      sheet: this.sheet,
      coords: this.coords,
      rowHeightEngine: this.rowHeightEngine,
      styleResolver: this.styleResolver,
      cols: this.cols,
      getRows: () => this.rows,
      isReadonly: this.isReadonly,
      onContextMenu: this.onContextMenu,
      getTableCellValue: (addr) => this.getTableCellValue(addr)
    })
    const sheetDisposers = this.syncManager.bindSheetEvents(
      this.sheet,
      this.table,
      this.coords,
      this.rowHeightEngine,
      this.styleResolver,
      this.selectionController,
      () => this.rows,
      () => this.cols,
      () => this.refresh(),
      (addr) => this.getTableCellValue(addr),
      () => this.applyFrozen()
    )
    this.disposers.push(...sheetDisposers)
    this.bindKeyboard()

    this.imageLayer = new ImageLayer({
      container: this.container,
      table: this.table,
      sheet: this.sheet,
      toTableCoord: (addr) => this.coords.toTableCoord(this.table, addr),
      toSheetAddr: (col, row) => this.coords.toSheetAddr(this.table, col, row),
      readonly: this.isReadonly
    })
    this.disposers.push(() => this.imageLayer.dispose())
    this.applyFrozen()
    applyColWidthsFromModel(this.table, this.sheet, this.coords)
    this.selectionController.pushSelectionToTable(this.sheet.getSelection(), this.rows, this.cols)
  }

  getTable(): ListTable {
    return this.table
  }
  getImageLayer(): ImageLayer {
    return this.imageLayer
  }
  refresh(): void {
    this.table.setRecords(this.buildRecords())
  }
  hitTestSheetAddr(x: number, y: number): CellAddress | null {
    return this.coords.hitTestSheetAddr(this.table, x, y)
  }

  flushPending(): void {
    this.syncManager.flushPending(
      () => this.refresh(),
      () => this.flushCellBatch(),
      () => this.imageLayer.flush()
    )
  }

  syncFromModel(): void {
    this.syncManager.syncFromModel(
      () => this.refresh(),
      (r) => this.syncWrapRowHeight(r),
      () => this.applyFrozen(),
      () =>
        this.selectionController.pushSelectionToTable(
          this.sheet.getSelection(),
          this.rows,
          this.cols
        ),
      (v) => this.imageLayer.setVisible(v),
      () => applyColWidthsFromModel(this.table, this.sheet, this.coords)
    )
  }

  setVisible(on: boolean): void {
    this.syncManager.setVisible(
      on,
      () => this.refresh(),
      (r) => this.syncWrapRowHeight(r),
      (v) => this.imageLayer.setVisible(v)
    )
  }

  resolveEditTextForEditor(col: number, row: number): string | undefined {
    const addr = this.coords.toSheetAddr(this.table, col, row)
    if (!addr) return undefined
    const data = this.sheet.getCellData(this.sheet.merges.resolveAnchor(addr))
    return data?.f ? `=${data.f}` : undefined
  }

  notifyEditorEditStart(col: number, row: number): void {
    const addr = this.coords.toSheetAddr(this.table, col, row)
    if (addr) {
      this.editingAddr = addr
      this.onEditStart?.(addr)
    }
  }

  notifyEditorEditEnd(): void {
    const addr = this.editingAddr
    this.editingAddr = null
    if (addr) {
      this.syncManager.refreshCellStyle(this.table, this.sheet, addr, this.coords)
      this.syncManager.refreshFacingConsumers(
        this.table,
        this.sheet,
        addr,
        this.coords,
        this.cols,
        this.rows,
        (a) => this.syncManager.refreshCellStyle(this.table, this.sheet, a, this.coords)
      )
      this.onEditEnd?.(addr)
    }
  }

  undo(): boolean {
    return this.sheet.undo()
  }
  redo(): boolean {
    return this.sheet.redo()
  }

  release(): void {
    if (this.syncManager.isReleased()) return
    this.syncManager.markReleased()
    for (const dispose of this.disposers) dispose()
    this.disposers.length = 0
    unregisterGridEditor(this.table)
    this.table.release()
  }

  private static frozenToVTableCounts(
    frozen: FrozenState,
    rows: number,
    cols: number,
    showColHeader: boolean,
    showRowHeader: boolean
  ) {
    const headerRows = showColHeader ? 1 : 0
    const headerCols = showRowHeader ? 1 : 0
    return {
      frozenRowCount: Math.min(frozen.rows + headerRows, Math.max(rows, 1)),
      frozenColCount: Math.min(frozen.cols + headerCols, Math.max(cols, 1))
    }
  }

  private applyFrozen(): void {
    const { frozenRowCount, frozenColCount } = SheetGrid.frozenToVTableCounts(
      this.sheet.frozen,
      this.rows,
      this.cols,
      this.showColHeader,
      this.showRowHeader
    )
    if (this.table.frozenRowCount !== frozenRowCount) this.table.frozenRowCount = frozenRowCount
    if (this.table.frozenColCount !== frozenColCount) this.table.frozenColCount = frozenColCount
  }

  private buildColumns() {
    return Array.from({ length: this.cols }, (_, col) => ({
      field: String(col),
      title: colIndexToName(col),
      style: (styleArg: any) => this.styleResolver.resolveCellStyle(styleArg, this.coords),
      // 仅宿主提供 hook 时安装分发器：customLayout 存在会使 VTable 对该列
      // 关闭 fast-update 快路径，默认场景必须保持零差异（ADR-0004）。
      // 分发器返回 undefined 回落默认渲染（VTable 运行时支持 falsy 返回值，
      // 但其声明类型不含 undefined，故以 ICustomLayoutFuc 收敛）
      ...(this.resolveCellRenderer
        ? {
            customLayout: ((args: CustomRenderFunctionArg) =>
              this.resolveCellLayout(args)) as ICustomLayoutFuc
          }
        : {})
    }))
  }

  /**
   * customLayout 按格分发器（ADR-0004）：表格坐标 → 模型地址，仅 body 格
   * 回调宿主 hook（合并格 VTable 传入锚点坐标，天然落锚）；行号列/列头或
   * hook 返回 undefined 时回落默认渲染（VTable 对 falsy 返回值走默认绘制）。
   */
  private resolveCellLayout(args: CustomRenderFunctionArg): ICustomLayoutObj | undefined {
    const addr = this.coords.toSheetAddr(args.table as ListTable, args.col, args.row)
    if (!addr) return undefined
    return this.resolveCellRenderer?.(addr, args.dataValue)
  }

  private getTableCellValue(addr: CellAddress): CellValue | undefined {
    const base = this.sheet.getDisplayValue(addr)
    if (!this.resolveDisplayValue) return base
    const resolved = this.resolveDisplayValue(addr, base)
    return resolved !== undefined ? resolved : base
  }

  private buildRecords(): Record<string, CellValue>[] {
    const records: Record<string, CellValue>[] = Array.from({ length: this.rows }, () => ({}))
    const writeCell = (addr: CellAddress): void => {
      if (addr.row >= this.rows || addr.col >= this.cols) return
      const val = this.getTableCellValue(addr)
      if (val != null && val !== '') records[addr.row]![String(addr.col)] = val
    }
    for (const [addr] of this.sheet.store.entries()) writeCell(addr)
    if (this.resolveDisplayValue) {
      for (const [addr] of this.sheet.entriesCellMeta()) {
        if (this.sheet.store.peekCell(addr)?.v == null) writeCell(addr)
      }
    }
    return records
  }

  private buildOptions(): ListTableConstructorOptions {
    return {
      records: this.buildRecords(),
      columns: this.buildColumns(),
      widthMode: 'standard',
      defaultRowHeight: SHEET_DEFAULT_ROW_HEIGHT,
      rowHeightConfig: this.rowHeightEngine.buildRowHeightConfig(
        this.styleResolver,
        SHEET_DEFAULT_COL_WIDTH
      ),
      resize: this.isReadonly
        ? { columnResizeMode: 'none', rowResizeMode: 'none' }
        : { columnResizeMode: 'header', rowResizeMode: 'all' },
      theme: sheetVTableTheme,
      showHeader: this.showColHeader,
      ...(this.showRowHeader
        ? { rowSeriesNumber: { width: 46, style: sheetRowSeriesNumberStyle } }
        : {}),
      excelOptions: { fillHandle: !this.isReadonly },
      eventOptions: { preventDefaultContextMenu: true },
      hover: { disableHover: true },
      ...(this.isReadonly ? {} : { editor: EDITOR_NAME, editCellTrigger: 'doubleclick' as const }),
      ...SheetGrid.frozenToVTableCounts(
        this.sheet.frozen,
        this.rows,
        this.cols,
        this.showColHeader,
        this.showRowHeader
      ),
      keyboardOptions: {
        moveFocusCellOnTab: true,
        editCellOnEnter: !this.isReadonly,
        moveFocusCellOnEnter: true,
        moveEditCellOnArrowKeys: false,
        selectAllOnCtrlA: true,
        ctrlMultiSelect: false
      },
      customMergeCell: (col, row, table) => {
        const addr = this.coords.toSheetAddr(table as ListTable, col, row)
        if (!addr) return undefined
        const merge = this.sheet.merges.getMergeAt(addr)
        if (!merge) return undefined
        const anchorCoord = this.coords.toTableCoord(table as ListTable, merge.start)
        const recordValue = (table as ListTable).getCellOriginValue(
          anchorCoord.col,
          anchorCoord.row
        )
        return {
          range: {
            start: anchorCoord,
            end: this.coords.toTableCoord(table as ListTable, merge.end)
          },
          text: recordValue == null ? '' : String(recordValue)
        }
      }
    }
  }

  private syncWrapRowHeight(row: number): void {
    this.rowHeightEngine.syncWrapRowHeight(row, this.table, this.coords, this.styleResolver)
  }

  private flushCellBatch(): void {
    this.syncManager.flushCellBatch(
      () => this.refresh(),
      (a) =>
        this.syncManager.pushCellToTable(
          this.table,
          a,
          (addr) => this.getTableCellValue(addr),
          this.coords
        ),
      (a) => this.syncManager.refreshCellStyle(this.table, this.sheet, a, this.coords),
      (a) =>
        this.syncManager.refreshFacingConsumers(
          this.table,
          this.sheet,
          a,
          this.coords,
          this.cols,
          this.rows,
          (target) => this.syncManager.refreshCellStyle(this.table, this.sheet, target, this.coords)
        ),
      (r) => this.syncWrapRowHeight(r)
    )
  }

  private bindKeyboard(): void {
    if (this.isReadonly) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
        return
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        if (this.undo()) event.preventDefault()
      } else if ((key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey)) {
        if (this.redo()) event.preventDefault()
      }
    }
    this.container.addEventListener('keydown', onKeyDown)
    this.disposers.push(() => this.container.removeEventListener('keydown', onKeyDown))
  }
}
