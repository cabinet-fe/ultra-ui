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
   * 构造前把 wrap 估算写入模型（不进 undo）。
   * 只扫稀疏有数据的行/格，禁止按渲染行列做稠密双重循环——大表切 sheet
   * 重建时 O(rows×cols) 的 getEffectiveStyle 是主线程卡顿主因。
   * 样式池无 wrap 且无动态 hook 时整表跳过。
   */
  applyWrapEstimates(styleResolver: GridStyleResolver, defaultColWidth: number): void {
    if (!styleResolver.hasDynamicStyle() && !this.sheet.stylePool.hasAlignWrap()) return
    for (const row of this.sheet.store.rowKeys()) {
      if (row >= this.rows) continue
      const estimated = this.estimateWrapRowHeightForRow(row, defaultColWidth, styleResolver)
      if (estimated == null) continue
      const current = this.sheet.getRowHeight(row)
      const height = Math.max(current ?? SHEET_DEFAULT_ROW_HEIGHT, estimated)
      if (height !== current) this.sheet.setRowHeight(row, height)
    }
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
   * 扫描单行 wrap 格并求最大估算行高（共享扫描，列宽来源由调用方注入：
   * 构造期用默认列宽常量、动态期用 VTable 实测列宽——见 #32）。
   * 只迭代该行已存格，不扫空列。行内无 wrap 格返回 undefined。
   */
  scanWrapRowHeight(
    row: number,
    getColWidth: (col: number) => number,
    styleResolver: GridStyleResolver
  ): { maxHeight: number; hasWrap: boolean } | undefined {
    if (row < 0 || row >= this.rows) return undefined
    let maxHeight = 0
    let hasWrap = false
    for (const [col] of this.sheet.store.peekRow(row)) {
      if (col >= this.cols) continue
      const addr = { row, col }
      const metrics = styleResolver.getWrapMetrics(addr)
      if (!metrics.wrap) continue
      hasWrap = true
      const text = String(this.sheet.getDisplayValue(addr) ?? '')
      const height = estimateWrapRowHeight({
        text,
        colWidth: getColWidth(col),
        fontSizePt: metrics.fontSizePt
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

  /** table.setRowHeight（行高由 customComputeRowHeight 读模型，不再维护 rowHeightConfig 数组） */
  setTableRowHeight(table: ListTable, tableRow: number, height: number): void {
    table.setRowHeight(tableRow, height)
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
