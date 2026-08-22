import { getDb } from './db'

/**
 * 在线填报演示的按单元格存取（SQLite 稀疏存储，与 workbook 多 sheet 模型同构）：
 * 每个可编辑单元格一行记录，维度 = (form_id, sheet_key, row, col)，value_json 为 JSON 标量；
 * 空值（null / ''）即删除该行。
 */

export type DataEntryCellScalar = string | number | boolean | null

export interface DataEntryCell {
  /** sheet 名（workbook 内唯一） */
  sheet: string
  row: number
  col: number
  value: DataEntryCellScalar
}

/** 读取表单全部已存单元格（按 sheet/row/col 升序，便于前端稳定回放） */
export function listDataEntryCells(formId: string): DataEntryCell[] {
  const rows = getDb()
    .prepare(
      `SELECT sheet_key, row_index, col_index, value_json FROM data_entry_cells
       WHERE form_id = ? ORDER BY sheet_key, row_index, col_index`
    )
    .all(formId) as Record<string, unknown>[]
  const cells: DataEntryCell[] = []
  for (const row of rows) {
    let value: DataEntryCellScalar
    try {
      value = JSON.parse(String(row.value_json)) as DataEntryCellScalar
    } catch {
      continue // 坏数据行跳过，不阻断整张表单
    }
    cells.push({
      sheet: String(row.sheet_key),
      row: Number(row.row_index),
      col: Number(row.col_index),
      value
    })
  }
  return cells
}

/** 批量 upsert（空值删除）；返回实际写入条数 */
export function saveDataEntryCells(formId: string, cells: DataEntryCell[]): number {
  const database = getDb()
  const upsert = database.prepare(
    `INSERT INTO data_entry_cells (form_id, sheet_key, row_index, col_index, value_json, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT (form_id, sheet_key, row_index, col_index)
     DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`
  )
  const remove = database.prepare(
    'DELETE FROM data_entry_cells WHERE form_id = ? AND sheet_key = ? AND row_index = ? AND col_index = ?'
  )
  let saved = 0
  for (const cell of cells) {
    if (cell.value === null || cell.value === '') {
      remove.run(formId, cell.sheet, cell.row, cell.col)
    } else {
      upsert.run(formId, cell.sheet, cell.row, cell.col, JSON.stringify(cell.value))
      saved++
    }
  }
  return saved
}
