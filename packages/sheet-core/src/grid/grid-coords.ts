import type { ListTable } from '@visactor/vtable'

import type { CellAddress } from '../core/address'

/** 右键落点区域：body 格 / 行号列 / 列头行（角点归 body，addr 为 null） */
export type SheetGridContextMenuKind = 'body' | 'row-header' | 'col-header'

/** 右键菜单回调参数（vue 层弹 UContextmenu；grid 不依赖 desktop） */
export interface SheetGridContextMenuInfo {
  x: number
  y: number
  /** 落点区域 */
  kind: SheetGridContextMenuKind
  /** body 格为模型地址；header / 角点为 null */
  addr: CellAddress | null
  /** row-header：模型行号 */
  row?: number
  /** col-header：模型列号 */
  col?: number
}

/** 从 VTable 事件载荷提取 viewport 坐标（兼容 nativeEvent 嵌套） */
export function clientPointFromEvent(event: unknown): { x: number; y: number } | null {
  let current: unknown = event
  for (let i = 0; i < 3 && current && typeof current === 'object'; i++) {
    if ('clientX' in current && typeof (current as { clientX: unknown }).clientX === 'number') {
      const { clientX, clientY } = current as { clientX: number; clientY: number }
      return { x: clientX, y: clientY }
    }
    current = 'nativeEvent' in current ? (current as { nativeEvent: unknown }).nativeEvent : null
  }
  return null
}

export class GridCoords {
  /** 实测坐标偏移（行号列数 / 列头行数），首次使用时测量 */
  private offsets?: { colOffset: number; rowOffset: number }

  /**
   * 实测偏移：列头行数取 columnHeaderLevelCount；
   * 行号列不被计入 rowHeaderLevelCount，用 isSeriesNumber 逐列探测。
   * 结果缓存（表格实例不变，布局不变）。
   */
  getOffsets(table: ListTable): { colOffset: number; rowOffset: number } {
    if (!this.offsets) {
      const rowOffset = table.columnHeaderLevelCount
      let colOffset = 0
      while (colOffset < table.colCount && table.isSeriesNumber(colOffset, rowOffset)) colOffset++
      this.offsets = { colOffset, rowOffset }
    }
    return this.offsets
  }

  /** VTable 坐标 → 模型地址；行号列/列头返回 null */
  toSheetAddr(table: ListTable, col: number, row: number): CellAddress | null {
    const { colOffset, rowOffset } = this.getOffsets(table)
    const addr = { row: row - rowOffset, col: col - colOffset }
    if (addr.row < 0 || addr.col < 0) return null
    return addr
  }

  /** 模型地址 → VTable 坐标 */
  toTableCoord(table: ListTable, addr: CellAddress): { col: number; row: number } {
    const { colOffset, rowOffset } = this.getOffsets(table)
    return { col: addr.col + colOffset, row: addr.row + rowOffset }
  }

  /**
   * 容器内相对坐标 → 模型地址（行号/列头返回 null）。
   * 供宿主拖放等场景命中单元格。
   */
  hitTestSheetAddr(table: ListTable, relativeX: number, relativeY: number): CellAddress | null {
    const cell = table.getCellAtRelativePosition(relativeX, relativeY)
    if (!cell) return null
    return this.toSheetAddr(table, cell.col, cell.row)
  }

  /**
   * 右键坐标 → ContextMenuInfo：行号列 / 列头行 / body 分流。
   * 角点（行号×列头）归 body（addr null），与「保留当前选区」语义一致。
   */
  buildContextMenuInfo(
    table: ListTable,
    tableCol: number,
    tableRow: number,
    x: number,
    y: number
  ): SheetGridContextMenuInfo {
    const { colOffset, rowOffset } = this.getOffsets(table)
    const modelRow = tableRow - rowOffset
    const modelCol = tableCol - colOffset
    const isSeries = table.isSeriesNumber(tableCol, tableRow)
    const isColHeader = tableRow < rowOffset

    if (isSeries && modelRow >= 0) {
      return { x, y, kind: 'row-header', addr: null, row: modelRow }
    }
    if (isColHeader && modelCol >= 0) {
      return { x, y, kind: 'col-header', addr: null, col: modelCol }
    }
    return { x, y, kind: 'body', addr: this.toSheetAddr(table, tableCol, tableRow) }
  }
}
