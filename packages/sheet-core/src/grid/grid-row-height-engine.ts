import type { ListTable } from '@visactor/vtable'

import type { Sheet } from '../core/sheet'
import type { GridCoords } from './grid-coords'
import {
  DEFAULT_FONT_SIZE_PT,
  fontSizePtToPx,
  CHAR_WIDTH_RATIO,
  LINE_HEIGHT_RATIO,
  type GridStyleResolver
} from './grid-style-resolver'
import { SHEET_CELL_PADDING, SHEET_DEFAULT_ROW_HEIGHT } from './vtable-theme'

/**
 * 估算含 wrap 格的行高（px）：按列宽 ÷ 字宽近似折行数 × 行距。
 * 估算偏差与合并格 wrap 为已知边界（见 AGENTS.md）。
 */
export function estimateWrapRowHeight(params: {
  text: string
  colWidth: number
  fontSizePt?: number
}): number {
  const fontPx = fontSizePtToPx(params.fontSizePt ?? DEFAULT_FONT_SIZE_PT)
  const padX = SHEET_CELL_PADDING[1] + SHEET_CELL_PADDING[3]
  const padY = SHEET_CELL_PADDING[0] + SHEET_CELL_PADDING[2]
  const available = Math.max(fontPx, params.colWidth - padX)
  const charWidth = fontPx * CHAR_WIDTH_RATIO
  const lineHeight = fontPx * LINE_HEIGHT_RATIO
  let lines = 0
  for (const paragraph of params.text.split('\n')) {
    const chars = paragraph.length || 1
    lines += Math.max(1, Math.ceil((chars * charWidth) / available))
  }
  if (lines === 0) lines = 1
  return Math.max(SHEET_DEFAULT_ROW_HEIGHT, Math.ceil(lines * lineHeight + padY))
}

export class GridRowHeightEngine {
  private readonly sheet: Sheet
  private rows: number
  private cols: number

  constructor(sheet: Sheet, rows: number, cols: number) {
    this.sheet = sheet
    this.rows = rows
    this.cols = cols
  }

  /**
   * 构造期行高配置（rowHeightConfig，全行覆盖）：
   * - 模型稀疏 rowHeights（导入 / 拖拽 / 历史 wrap 估算）优先；
   * - wrap 格按默认列宽估算（列宽不持久化，重建后恒为默认值，见 SHEET_DEFAULT_COL_WIDTH）；
   * - 未命中行走默认行高——**必须覆盖所有行**：rowHeightConfig 使 isAutoRowHeight
   *   生效后，未覆盖的行会走文本高度测量路径（行高变自适应）。
   * wrap 估算结果写入模型（与构造后 syncWrapRowHeight 同语义：不进 undo、随快照持久化）。
   * key = 表格行号（模型行 + 1：列头行偏移）。
   */
  buildRowHeightConfig(
    styleResolver: GridStyleResolver,
    defaultColWidth: number
  ): { key: number; height: number }[] {
    const config: { key: number; height: number }[] = [{ key: 0, height: SHEET_DEFAULT_ROW_HEIGHT }]
    const dataRows = new Set<number>()
    for (const [addr] of this.sheet.store.entries()) {
      if (addr.row < this.rows) dataRows.add(addr.row)
    }
    for (let row = 0; row < this.rows; row++) {
      let height = this.sheet.getRowHeight(row) ?? SHEET_DEFAULT_ROW_HEIGHT
      if (dataRows.has(row)) {
        const estimated = this.estimateWrapRowHeightForRow(row, defaultColWidth, styleResolver)
        if (estimated != null) {
          height = Math.max(height, estimated)
          if (height !== this.sheet.getRowHeight(row)) this.sheet.setRowHeight(row, height)
        }
      }
      config.push({ key: row + 1, height })
    }
    return config
  }

  /** 构造前单行 wrap 行高估算（不依赖 table：列宽以常量传入）；行内无 wrap 格返回 undefined */
  estimateWrapRowHeightForRow(
    row: number,
    colWidth: number,
    styleResolver: GridStyleResolver
  ): number | undefined {
    const scanned = this.scanWrapRowHeight(row, () => colWidth, styleResolver)
    return scanned?.hasWrap ? Math.max(SHEET_DEFAULT_ROW_HEIGHT, scanned.maxHeight) : undefined
  }

  /**
   * 扫描单行全部 wrap 格并求最大估算行高（共享扫描，列宽来源由调用方注入：
   * 构造期用默认列宽常量、动态期用 VTable 实测列宽——见 #32）。
   * 行内无 wrap 格返回 undefined。
   * 读取生效样式有效处理动态条件样式（resolveCellStyle）覆盖下的 wrap / font size。
   */
  scanWrapRowHeight(
    row: number,
    getColWidth: (col: number) => number,
    styleResolver: GridStyleResolver
  ): { maxHeight: number; hasWrap: boolean } | undefined {
    if (row < 0 || row >= this.rows) return undefined
    let maxHeight = 0
    let hasWrap = false
    for (let col = 0; col < this.cols; col++) {
      const addr = { row, col }
      const style = styleResolver.getEffectiveStyle(addr)
      if (!style?.align?.wrap) continue
      hasWrap = true
      const text = String(this.sheet.getDisplayValue(addr) ?? '')
      const height = estimateWrapRowHeight({
        text,
        colWidth: getColWidth(col),
        fontSizePt: style.font?.size
      })
      if (height > maxHeight) maxHeight = height
    }
    return hasWrap ? { maxHeight, hasWrap } : undefined
  }

  /**
   * 单行 wrap 行高估算（动态：cell-change / wrap 切换 / 列宽拖拽后）；
   * 行内无 wrap 格则跳过（保留手动/默认行高）。只升不降：
   * 已有自定义行高（导入 / 拖拽）不低于估算时保留，避免压矮。
   */
  syncWrapRowHeight(
    row: number,
    table: ListTable,
    coords: GridCoords,
    styleResolver: GridStyleResolver
  ): void {
    const scanned = this.scanWrapRowHeight(
      row,
      (col) => table.getColWidth(coords.toTableCoord(table, { row, col }).col),
      styleResolver
    )
    if (!scanned?.hasWrap) return
    const estimated = Math.max(SHEET_DEFAULT_ROW_HEIGHT, scanned.maxHeight)
    const current = this.sheet.getRowHeight(row)
    const next = current != null ? Math.max(current, estimated) : estimated
    if (current === next) {
      const tableRow = coords.toTableCoord(table, { row, col: 0 }).row
      if (table.getRowHeight(tableRow) !== next) this.setTableRowHeight(table, tableRow, next)
      return
    }
    this.sheet.setRowHeight(row, next)
    const tableRow = coords.toTableCoord(table, { row, col: 0 }).row
    this.setTableRowHeight(table, tableRow, next)
  }

  /**
   * table.setRowHeight + rowHeightConfig 同步。
   * rowHeightConfig 使 isAutoRowHeight 恒 true，滚动增量重算（computeRowsHeight）
   * 会按 config 值回写 rowHeightsMap——动态行高（拖拽 / wrap 更新）必须同步
   * config 数组内容，否则滚动后行高被旧 config 值覆盖（视觉跳动）。
   */
  setTableRowHeight(table: ListTable, tableRow: number, height: number): void {
    table.setRowHeight(tableRow, height)
    const config = (
      table as unknown as {
        internalProps?: { rowHeightConfig?: { key: number; height: number }[] }
      }
    ).internalProps?.rowHeightConfig
    if (!config) return
    const item = config.find((c) => c.key === tableRow)
    if (item) item.height = height
    else config.push({ key: tableRow, height })
  }

  /**
   * 行高只允许在行号列拖拽（Excel 语义）。
   * VTable 无 canResizeRow，且 'header' 不含 rowSeriesNumber body，故包装 _canResizeRow。
   */
  restrictRowResizeToSeriesNumber(table: ListTable): void {
    const base = table._canResizeRow.bind(table)
    table._canResizeRow = (col, row) => table.isSeriesNumber(col, row) && base(col, row)
  }
}
