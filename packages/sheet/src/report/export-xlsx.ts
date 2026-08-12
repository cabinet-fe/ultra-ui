import type { Sheet } from '@veltra/sheet-core'
import { rangeToHucre, styleToHucre } from '@veltra/sheet-core/core/io/export'
import type { Cell, CellValue, ColumnDef, RowDef, WriteSheet } from 'hucre'
import { writeXlsx } from 'hucre/xlsx'

/** 列宽条目：模型列索引 → 像素宽（与 SheetSnapshot.colWidths 同构） */
export type ReportColWidthEntry = readonly [number, number]

/** 像素 → Excel points */
function pxToPt(px: number): number {
  return px * 0.75
}

/** VTable 像素列宽 → Excel 字符宽度（近似换算） */
export function pxToExcelColWidth(px: number): number {
  return Math.max(1, Math.round((px - 5) / 7))
}

/** 从列宽条目构建 hucre ColumnDef */
export function buildColumnDefs(colWidths: ReadonlyArray<ReportColWidthEntry>): ColumnDef[] {
  if (colWidths.length === 0) return []
  const maxCol = Math.max(...colWidths.map(([col]) => col))
  const columns: ColumnDef[] = Array.from({ length: maxCol + 1 }, () => ({}))
  for (const [col, width] of colWidths) {
    columns[col] = { width: pxToExcelColWidth(width) }
  }
  return columns
}

/**
 * 将已填充的 Sheet（Filled Report）导出为保真 XLSX（合并 / 样式 / 行高 / 列宽）。
 * 条件样式颜色已在 renderReport 展开阶段打平进 StylePool（ADR-0001 决策 2）。
 * 列宽取自 sheet 模型（`getColWidths`）。
 */
export async function exportFilledReportXlsx(sheet: Sheet): Promise<Uint8Array> {
  const widths: ReportColWidthEntry[] = [...sheet.getColWidths()]

  let maxRow = -1
  let maxCol = -1
  for (const [addr] of sheet.store.entries()) {
    if (addr.row > maxRow) maxRow = addr.row
    if (addr.col > maxCol) maxCol = addr.col
  }
  for (const [row] of sheet.getRowHeights()) {
    if (row > maxRow) maxRow = row
  }
  for (const [col] of widths) {
    if (col > maxCol) maxCol = col
  }

  const rows =
    maxRow < 0
      ? []
      : Array.from({ length: maxRow + 1 }, () =>
          Array.from({ length: maxCol + 1 }, () => null as CellValue)
        )
  const cells = new Map<string, Partial<Cell>>()

  for (const [addr, data] of sheet.store.entries()) {
    const row = rows[addr.row]!
    const key = `${addr.row},${addr.col}`
    const cell: Partial<Cell> = {}
    const style = sheet.getEffectiveStyle(addr)
    if (style) cell.style = styleToHucre(style)
    if (data.f != null && data.f !== '') {
      cell.formula = data.f
      if (data.v != null) cell.formulaResult = data.v as CellValue
      row[addr.col] = (data.v as CellValue) ?? null
      cells.set(key, cell)
      continue
    }
    if (data.t === 'e') {
      cell.value = data.v as string
      cell.type = 'error'
      row[addr.col] = null
      cells.set(key, cell)
      continue
    }
    if (data.t === 'd') {
      cell.value = data.v as number
      cell.type = 'number'
      cell.style = { ...cell.style, numFmt: 'yyyy-mm-dd' }
      row[addr.col] = null
      cells.set(key, cell)
      continue
    }
    row[addr.col] = (data.v as CellValue) ?? null
    if (Object.keys(cell).length > 0) cells.set(key, cell)
  }

  const writeSheet: WriteSheet = {
    name: sheet.name || '报表',
    rows,
    ...(cells.size > 0 ? { cells } : {}),
    ...(sheet.merges.size > 0
      ? { merges: sheet.merges.getMerges().map((range) => rangeToHucre(range)) }
      : {}),
    ...(widths.length > 0 ? { columns: buildColumnDefs(widths) } : {})
  }

  const frozen = sheet.frozen
  if (frozen.rows > 0 || frozen.cols > 0) {
    writeSheet.freezePane = { rows: frozen.rows, columns: frozen.cols }
  }

  const rowDefs = new Map<number, RowDef>()
  for (const [row, height] of sheet.getRowHeights()) {
    rowDefs.set(row, { height: pxToPt(height) })
  }
  if (rowDefs.size > 0) writeSheet.rowDefs = rowDefs

  return writeXlsx({ sheets: [writeSheet], activeSheet: 0 })
}
