import { ListTable, register } from '@visactor/vtable'
import type { ListTableConstructorOptions } from '@visactor/vtable'
import { InputEditor } from '@visactor/vtable-editors'

import type { CellAddress } from '../core/address'
import { colIndexToName } from '../core/address'
import type { CellValue } from '../core/cell-store'
import type { Sheet } from '../core/sheet'

/**
 * VTable 适配层：数据模型完全自持有，ListTable 只做渲染与输入。
 *
 * - 模型 → VTable：records 由 store 行视图桥接；customMergeCell 闭包直读 MergeManager
 *   （VTable 逐格动态求值、无缓存，合并变更后 setRecords 重建场景树即生效）
 * - VTable → 模型：change_cell_value 回写 store；selected_cell 经 resolveAnchor 更新选区
 * - 坐标换算：行号列不计入 rowHeaderLevelCount，偏移量在首个表格实例上
 *   用 columnHeaderLevelCount + isSeriesNumber 实测并缓存（见 getOffsets）
 */

export interface SheetGridOptions {
  container: HTMLElement
  sheet: Sheet
  /** 渲染行数，默认 100 */
  rows?: number
  /** 渲染列数，默认 26（A..Z） */
  cols?: number
}

const EDITOR_NAME = 'veltra-sheet-input'
let editorRegistered = false

function ensureEditorRegistered(): void {
  if (editorRegistered) return
  register.editor(EDITOR_NAME, new InputEditor())
  editorRegistered = true
}

export class SheetGrid {
  private readonly sheet: Sheet
  private readonly table: ListTable
  private readonly rows: number
  private readonly cols: number
  private readonly disposers: (() => void)[] = []
  /** 表格事件正在回写模型，阻断模型事件回流造成的循环 */
  private syncingFromTable = false
  /** 实测坐标偏移（行号列数 / 列头行数），首次使用时测量 */
  private offsets?: { colOffset: number; rowOffset: number }

  constructor(options: SheetGridOptions) {
    ensureEditorRegistered()
    this.sheet = options.sheet
    this.rows = options.rows ?? 100
    this.cols = options.cols ?? 26

    this.table = new ListTable(options.container, this.buildOptions())
    this.bindTableEvents()
    this.bindSheetEvents()
  }

  /** 底层 ListTable 实例（调试与测试用） */
  getTable(): ListTable {
    return this.table
  }

  /** 全量刷新（合并结构变化、批量数据变更后调用） */
  refresh(): void {
    this.table.setRecords(this.buildRecords())
  }

  release(): void {
    for (const dispose of this.disposers) dispose()
    this.disposers.length = 0
    this.table.release()
  }

  // ─── 坐标换算 ─────────────────────────────────────────────

  /**
   * 实测偏移：列头行数取 columnHeaderLevelCount；
   * 行号列不被计入 rowHeaderLevelCount，用 isSeriesNumber 逐列探测。
   * 结果缓存（表格实例不变，布局不变）。
   */
  private getOffsets(table: ListTable): { colOffset: number; rowOffset: number } {
    if (!this.offsets) {
      const rowOffset = table.columnHeaderLevelCount
      let colOffset = 0
      while (colOffset < table.colCount && table.isSeriesNumber(colOffset, rowOffset)) colOffset++
      this.offsets = { colOffset, rowOffset }
    }
    return this.offsets
  }

  /** VTable 坐标 → 模型地址；行号列/列头返回 null */
  private toSheetAddr(table: ListTable, col: number, row: number): CellAddress | null {
    const { colOffset, rowOffset } = this.getOffsets(table)
    const addr = { row: row - rowOffset, col: col - colOffset }
    if (addr.row < 0 || addr.col < 0) return null
    return addr
  }

  /** 模型地址 → VTable 坐标 */
  private toTableCoord(table: ListTable, addr: CellAddress): { col: number; row: number } {
    const { colOffset, rowOffset } = this.getOffsets(table)
    return { col: addr.col + colOffset, row: addr.row + rowOffset }
  }

  // ─── 模型 → VTable ────────────────────────────────────────

  private buildColumns() {
    return Array.from({ length: this.cols }, (_, col) => ({
      field: String(col),
      title: colIndexToName(col)
    }))
  }

  private buildRecords(): Record<string, CellValue>[] {
    const records: Record<string, CellValue>[] = Array.from({ length: this.rows }, () => ({}))
    for (const [addr, data] of this.sheet.store.entries()) {
      if (addr.row < this.rows && addr.col < this.cols && data.v != null) {
        records[addr.row]![String(addr.col)] = data.v
      }
    }
    return records
  }

  private buildOptions(): ListTableConstructorOptions {
    return {
      records: this.buildRecords(),
      columns: this.buildColumns(),
      widthMode: 'standard',
      rowSeriesNumber: { width: 46 },
      editor: EDITOR_NAME,
      editCellTrigger: 'doubleclick',
      keyboardOptions: {
        moveFocusCellOnTab: true,
        editCellOnEnter: true,
        moveFocusCellOnEnter: true,
        moveEditCellOnArrowKeys: true,
        selectAllOnCtrlA: true
      },
      customMergeCell: (col, row, table) => {
        const addr = this.toSheetAddr(table as ListTable, col, row)
        if (!addr) return undefined
        const merge = this.sheet.merges.getMergeAt(addr)
        if (!merge) return undefined
        const anchorCoord = this.toTableCoord(table as ListTable, merge.start)
        const recordValue = (table as ListTable).getCellOriginValue(
          anchorCoord.col,
          anchorCoord.row
        )
        return {
          range: { start: anchorCoord, end: this.toTableCoord(table as ListTable, merge.end) },
          // 关键 1：必须携带 text。VTable 的 getCellRange 仅在 text/customLayout/
          // customRender 有效时才认这个自定义合并——没有 text 时选区与编辑不会
          // 扩展为整个合并区域，且合并格渲染为空。
          // 关键 2：text 必须读 VTable records 而非模型。编辑提交的顺序是
          // 先更新 record → 重绘 → 最后才发 change_cell_value 回写模型；
          // 若此时读模型，拿到的还是回写前的旧值（合并格显示旧文本）。
          text: recordValue == null ? '' : String(recordValue)
        }
      }
    }
  }

  // ─── 事件桥接 ─────────────────────────────────────────────

  private bindTableEvents(): void {
    this.table.on(ListTable.EVENT_TYPE.CHANGE_CELL_VALUE, (args) => {
      const addr = this.toSheetAddr(this.table, args.col, args.row)
      if (addr == null) return
      this.syncingFromTable = true
      try {
        this.sheet.setCellValue(addr, args.changedValue ?? null)
      } finally {
        this.syncingFromTable = false
      }
    })

    this.table.on(ListTable.EVENT_TYPE.SELECTED_CELL, (args) => {
      const addr = this.toSheetAddr(this.table, args.col, args.row)
      if (addr == null) return
      this.sheet.selectCell(addr)
    })
  }

  private bindSheetEvents(): void {
    this.disposers.push(
      this.sheet.on('cell-change', ({ addr }) => {
        if (this.syncingFromTable) return
        const { col, row } = this.toTableCoord(this.table, addr)
        const value = this.sheet.getDisplayValue(addr)
        this.table.changeCellValue(col, row, value as string | number | null, false, false)
      })
    )

    this.disposers.push(
      this.sheet.on('merge-change', () => {
        this.refresh()
      })
    )
  }
}
