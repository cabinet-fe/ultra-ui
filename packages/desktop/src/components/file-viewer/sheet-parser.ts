import { readWorkbook } from '@cat-kit/excel'

import type { FileViewerItem } from '../../types/file-viewer'
import { getExtension, parseCsv, toArrayBuffer } from './helper'

export interface SheetPreview {
  name: string
  headers: string[]
  rows: string[][]
}

function cellToString(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toLocaleString()
  if (typeof v === 'object' && 'formula' in v) {
    const f = v as { formula: string; result?: unknown }
    return f.result != null ? cellToString(f.result) : `=${f.formula}`
  }
  return JSON.stringify(v)
}

/** 解析 CSV / Excel 为表格预览数据 */
export async function parseSheetFile(
  file: FileViewerItem,
  signal?: AbortSignal
): Promise<SheetPreview[]> {
  const ext = getExtension(file.name)
  const buf = await toArrayBuffer(file.src, signal)
  if (signal?.aborted) return []

  if (ext === 'csv') {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    const parsed = parseCsv(text).filter((row) => row.some((c) => c.length > 0))
    const headers = (parsed[0] ?? []).map((h, i) => String(h) || `Column ${i + 1}`)
    return [{ name: file.name, headers, rows: parsed.slice(1) }]
  }

  const workbook = await readWorkbook(new Uint8Array(buf))
  if (signal?.aborted) return []

  return workbook.worksheets.map((ws) => {
    const wsRows = ws.getRows()
    const firstRow = wsRows[0]
    const headers = (firstRow ? firstRow.toValues().map(cellToString) : []).map(
      (h, i) => h || `Column ${i + 1}`
    )
    const rows = wsRows.slice(1).map((r) => r.toValues().map(cellToString))
    return { name: ws.name, headers, rows }
  })
}
