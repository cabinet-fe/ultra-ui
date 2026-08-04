import type {
  Cell as HucreCell,
  CellStyle as HucreCellStyle,
  CellValue as HucreCellValue,
  MergeRange as HucreMergeRange,
  RowDef as HucreRowDef,
  WriteSheet as HucreWriteSheet
} from 'hucre'
import { writeCsv } from 'hucre/csv'
import { writeXlsx } from 'hucre/xlsx'

import type { Sheet } from '../sheet'
import { BORDER_SIDES, type CellStyle } from '../style/types'
import type { Workbook } from '../workbook'

/**
 * 导入导出（Phase 5）：模型 → hucre（XLSX / CSV）。
 *
 * 映射约定：
 * - 单元格：v/t → hucre 值（数字/字符串/布尔直写，错误 t='e' 写 error 类型格）；
 *   f → formula（不带 '='，与 hucre 约定一致），v（计算缓存）→ formulaResult
 * - 日期 t='d'：模型存 1900 系统序列数，导出为数字 + 日期 numFmt（hucre 读回判为 Date，
 *   导入端再转回序列数——round-trip 保真）
 * - 合并：模型 CellRange（闭区间 start/end）→ hucre MergeRange（startRow/startCol/endRow/endCol）
 * - 样式：模型 { fill, border, font, align } → hucre CellStyle（fill=solid pattern +
 *   fgColor（去 '#'），四边 border { style, color }；hucre 无边宽字段，width 丢弃；
 *   font.size pt 直存；align.vertical middle ↔ hucre center；wrap ↔ wrapText）
 * - 冻结：Sheet.frozen → freezePane { rows, columns }
 * - 行高：模型像素 → hucre RowDef.height（points，×0.75）
 * - CSV：活动表从 A1 到最后一个有值行/列的矩形，公式格导计算缓存值（getDisplayValue），
 *   合并格显示锚点值（同 Excel），带 UTF-8 BOM
 */

/** 像素 → Excel points（96dpi / 72pt 精确比 0.75） */
function pxToPt(px: number): number {
  return px * 0.75
}

/** 模型样式 → hucre 单元格样式（fill / border / font / alignment；无边宽字段） */
export function styleToHucre(style: CellStyle): HucreCellStyle {
  const hucre: HucreCellStyle = {}
  if (style.fill?.color) {
    hucre.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: style.fill.color.slice(1) } }
  }
  const border: NonNullable<HucreCellStyle['border']> = {}
  for (const side of BORDER_SIDES) {
    const edge = style.border?.[side]
    if (!edge) continue
    border[side] = { style: edge.style, color: { rgb: edge.color.slice(1) } }
  }
  if (Object.keys(border).length > 0) hucre.border = border
  if (style.font) {
    const font: NonNullable<HucreCellStyle['font']> = {}
    if (style.font.color) font.color = { rgb: style.font.color.slice(1) }
    if (style.font.bold) font.bold = true
    if (style.font.italic) font.italic = true
    if (style.font.underline) font.underline = true
    if (style.font.strikethrough) font.strikethrough = true
    if (typeof style.font.size === 'number') font.size = style.font.size
    if (Object.keys(font).length > 0) hucre.font = font
  }
  if (style.align) {
    const alignment: NonNullable<HucreCellStyle['alignment']> = {}
    if (style.align.horizontal) alignment.horizontal = style.align.horizontal
    if (style.align.vertical) {
      // 模型 middle ↔ hucre/Excel center
      alignment.vertical = style.align.vertical === 'middle' ? 'center' : style.align.vertical
    }
    if (style.align.wrap) alignment.wrapText = true
    if (Object.keys(alignment).length > 0) hucre.alignment = alignment
  }
  return hucre
}

/** 模型合并区域 → hucre MergeRange */
export function rangeToHucre(range: {
  start: { row: number; col: number }
  end: { row: number; col: number }
}): HucreMergeRange {
  return {
    startRow: range.start.row,
    startCol: range.start.col,
    endRow: range.end.row,
    endCol: range.end.col
  }
}

/** 单元格数据 → hucre 写侧 Cell 覆盖项（rows 网格已承载普通值） */
function cellToHucreCell(
  sheet: Sheet,
  data: NonNullable<ReturnType<Sheet['getCellData']>>
): Partial<HucreCell> | undefined {
  const cell: Partial<HucreCell> = {}
  if (data.s != null) {
    const style = sheet.stylePool.get(data.s)
    if (style) cell.style = styleToHucre(style)
  }
  if (data.f != null && data.f !== '') {
    cell.formula = data.f
    if (data.v != null) cell.formulaResult = data.v as HucreCellValue
    return cell
  }
  if (data.t === 'e') {
    cell.value = data.v as string
    cell.type = 'error'
    return cell
  }
  if (data.t === 'd') {
    // 模型日期序列（1900 系统）→ 数字 + 日期 numFmt（hucre 读回判为 Date，导入端转回）
    cell.value = data.v as number
    cell.type = 'number'
    cell.style = { ...cell.style, numFmt: 'yyyy-mm-dd' }
    return cell
  }
  return Object.keys(cell).length > 0 ? cell : undefined
}

/**
 * 导出整个工作簿为 XLSX（多 sheet：值 / 公式 / 合并 / 样式（fill+border）/ 冻结 / 行高）。
 * 纯 TS，可无头测试；返回 ZIP 字节。
 */
export async function exportWorkbookXlsx(workbook: Workbook): Promise<Uint8Array> {
  const sheets: HucreWriteSheet[] = workbook.getSheets().map((sheet) => {
    // 行范围 = 数据行 ∪ rowDefs 行；稠密数组（hucre 写侧只遍历 rows 范围内的行，
    // rowDefs 覆盖的无数据行必须出现在 rows 中，否则行高丢失）
    let maxRow = -1
    for (const [addr] of sheet.store.entries()) {
      if (addr.row > maxRow) maxRow = addr.row
    }
    for (const [row] of sheet.getRowHeights()) {
      if (row > maxRow) maxRow = row
    }
    const rows: HucreCellValue[][] = maxRow < 0 ? [] : Array.from({ length: maxRow + 1 }, () => [])
    const cells = new Map<string, Partial<HucreCell>>()
    for (const [addr, data] of sheet.store.entries()) {
      const row = rows[addr.row]!
      const key = `${addr.row},${addr.col}`
      const detail = cellToHucreCell(sheet, data)
      if (data.f != null && data.f !== '') {
        // 公式格：计算值进 rows，公式/样式进 cells
        row[addr.col] = (data.v as HucreCellValue) ?? null
        if (detail) cells.set(key, detail)
        continue
      }
      if (data.t === 'd' || data.t === 'e') {
        // 日期 / 错误格：值由 cells 覆盖（rows 置 null，避免双写歧义）
        row[addr.col] = null
        if (detail) cells.set(key, detail)
        continue
      }
      row[addr.col] = (data.v as HucreCellValue) ?? null
      if (detail) cells.set(key, detail)
    }

    const sheetOut: HucreWriteSheet = Object.assign(
      { name: sheet.name, rows },
      cells.size > 0 ? { cells } : {},
      sheet.merges.size > 0
        ? { merges: sheet.merges.getMerges().map((range) => rangeToHucre(range)) }
        : {}
    )
    const frozen = sheet.frozen
    if (frozen.rows > 0 || frozen.cols > 0) {
      sheetOut.freezePane = { rows: frozen.rows, columns: frozen.cols }
    }
    const rowDefs = new Map<number, HucreRowDef>()
    for (const [row, height] of sheet.getRowHeights()) {
      rowDefs.set(row, { height: pxToPt(height) })
    }
    if (rowDefs.size > 0) sheetOut.rowDefs = rowDefs
    return sheetOut
  })
  return writeXlsx({ sheets, activeSheet: workbook.activeSheetIndex })
}

/**
 * 导出活动表为 CSV 字符串（UTF-8 BOM；公式格导计算缓存值，合并覆盖格为空——同 Excel）。
 * 范围 = 从 A1 到最后一个真实存在格的行/列（裁剪高水位空行空列）。
 */
export function exportSheetCsv(sheet: Sheet): string {
  let maxRow = -1
  let maxCol = -1
  for (const [addr] of sheet.store.entries()) {
    if (addr.row > maxRow) maxRow = addr.row
    if (addr.col > maxCol) maxCol = addr.col
  }
  if (maxRow < 0) return writeCsv([], { bom: true })
  const rows: HucreCellValue[][] = []
  for (let r = 0; r <= maxRow; r++) {
    const row: HucreCellValue[] = []
    for (let c = 0; c <= maxCol; c++) {
      // 原始存储语义：合并覆盖格无数据 → 空（Excel CSV 导出行为）；公式格取计算缓存
      const value = sheet.getCellData({ row: r, col: c })?.v
      row.push(value ?? null)
    }
    rows.push(row)
  }
  return writeCsv(rows, { bom: true })
}
