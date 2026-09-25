import type { ListTable } from '@infinite-table/core'

import type { Sheet } from '../core/sheet'
import type { StyleId } from '../core/style/types'
import { estimateWrapRowHeight, getWrapMetrics } from './grid-style-map'
import { SHEET_DEFAULT_ROW_HEIGHT } from './grid-theme'

/**
 * wrap 行高引擎：估算含 wrap（含 `\n`）格的行高并写入模型（只升不降），
 * 引擎侧行高由 SheetGrid 应用模型覆盖值落地。渲染断行由引擎 textWrap 样式承担，
 * 本模块只负责行高几何。
 */
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
   * 短路：样式池不含 wrap 对齐时零全格遍历直接返回——十万级数据首帧挂载的
   * 全格稠密扫描（合并判定 + getEffectiveStyle + 显示值取串）是主线程卡顿主因。
   * 含 wrap 样式时只扫候选行：候选 = 格级 wrap 样式 / 行列默认 wrap 样式 /
   * 原始值含 `\n` 的格所在行（廉价识别，非候选格不做合并判定与显示值取串）。
   */
  applyWrapEstimates(defaultColWidth: number): void {
    if (!this.sheet.stylePool.hasAlignWrap()) return
    for (const row of this.collectWrapCandidateRows()) {
      if (row >= this.rows) continue
      const estimated = this.estimateWrapRowHeightForRow(row, defaultColWidth)
      if (estimated == null) continue
      const current = this.sheet.getRowHeight(row)
      const height = Math.max(current ?? SHEET_DEFAULT_ROW_HEIGHT, estimated)
      if (height !== current) this.sheet.setRowHeight(row, height)
    }
  }

  /**
   * 收集 wrap 候选行（构造期一次）：行列默认样式经稀疏 id 表直查；格级样式与
   * 原始值换行经已存格廉价遍历（只读 s id 与原始 v，不取生效样式、不取显示值、
   * 不判合并）。s → wrap 判定按 StyleId 记忆化，池定义数恒小于格数。
   */
  private collectWrapCandidateRows(): Set<number> {
    const rows = new Set<number>()
    const sheet = this.sheet
    const wrapMemo = new Map<StyleId, boolean>()
    const isWrapStyle = (id: StyleId): boolean => {
      let wrap = wrapMemo.get(id)
      if (wrap === undefined) {
        wrap = sheet.stylePool.peek(id)?.align?.wrap === true
        wrapMemo.set(id, wrap)
      }
      return wrap
    }
    // 行默认样式带 wrap：整行候选；列默认样式带 wrap：经稀疏 rowsForColumn 找行
    for (const [row, id] of sheet.getRowStyleIds()) {
      if (isWrapStyle(id)) rows.add(row)
    }
    for (const [col, id] of sheet.getColStyleIds()) {
      if (!isWrapStyle(id)) continue
      for (const row of sheet.store.rowsForColumn(col)) rows.add(row)
    }
    for (const row of sheet.store.rowKeys()) {
      for (const [, data] of sheet.store.peekRow(row)) {
        if (data.s != null && isWrapStyle(data.s)) {
          rows.add(row)
          break
        }
        const value = data.v
        if (typeof value === 'string' && value.includes('\n')) {
          rows.add(row)
          break
        }
      }
    }
    return rows
  }

  /** 构造前单行 wrap 行高估算（不依赖 table：优先取模型列宽，缺失时用 defaultColWidth）；行内无 wrap 格返回 undefined */
  estimateWrapRowHeightForRow(row: number, colWidth: number): number | undefined {
    const scanned = this.scanWrapRowHeight(row, (col) => this.sheet.getColWidth(col) ?? colWidth)
    return scanned?.hasWrap ? Math.max(SHEET_DEFAULT_ROW_HEIGHT, scanned.maxHeight) : undefined
  }

  /**
   * 扫描单行 wrap 格并求最大估算行高（共享扫描，列宽来源由调用方注入：
   * 构造期用默认列宽常量、动态期用引擎实测列宽）。
   * 只迭代该行已存格，不扫空列。行内无 wrap 格返回 undefined。
   */
  scanWrapRowHeight(
    row: number,
    getColWidth: (col: number) => number
  ): { maxHeight: number; hasWrap: boolean } | undefined {
    if (row < 0 || row >= this.rows) return undefined
    let maxHeight = 0
    let hasWrap = false
    for (const [col] of this.sheet.store.peekRow(row)) {
      if (col >= this.cols) continue
      const addr = { row, col }
      const merge = this.sheet.merges.getMergeAt(addr)
      // 如果属于合并格且不是锚点（左上角），跳过
      if (merge && (merge.start.row !== row || merge.start.col !== col)) continue
      // 如果合并格跨多行，单行不独占全量高度，跳过
      if (merge && merge.start.row !== merge.end.row) continue

      const metrics = getWrapMetrics(this.sheet, addr)
      const text = String(this.sheet.getDisplayValue(addr) ?? '')
      const hasNewline = text.includes('\n')
      if (!metrics.wrap && !hasNewline) continue
      hasWrap = true

      let cellWidth = getColWidth(col)
      if (merge && merge.start.col !== merge.end.col) {
        cellWidth = 0
        for (let c = merge.start.col; c <= merge.end.col; c++) {
          cellWidth += getColWidth(c)
        }
      }

      const height = estimateWrapRowHeight({
        text,
        colWidth: cellWidth,
        fontSizePt: metrics.fontSizePt
      })
      if (height > maxHeight) maxHeight = height
    }
    return hasWrap ? { maxHeight, hasWrap } : undefined
  }

  /**
   * 单行 wrap 行高估算（动态：值写入 / wrap 切换 / 列宽拖拽后）；
   * 行内无 wrap 格则跳过（保留手动/默认行高）。只升不降：
   * 已有自定义行高（导入 / 拖拽）不低于估算时保留，避免压矮。
   */
  syncWrapRowHeight(row: number, table: ListTable): void {
    const scanned = this.scanWrapRowHeight(row, (col) => table.getColWidth(col))
    if (!scanned?.hasWrap) return
    const estimated = Math.max(SHEET_DEFAULT_ROW_HEIGHT, scanned.maxHeight)
    const current = this.sheet.getRowHeight(row)
    const next = current != null ? Math.max(current, estimated) : estimated
    if (current === next && table.getRowHeight(row) === next) return
    this.sheet.setRowHeight(row, next)
    table.setRowHeight(row, next)
  }
}
