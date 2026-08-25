import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const serverDir = dirname(fileURLToPath(import.meta.url))
const defaultDbPath = join(serverDir, 'data', 'report-hub.db')

/** SQLite 文件路径，可用 REPORT_HUB_DB 覆盖（历史环境变量名，填报演示沿用） */
export const DB_PATH = process.env.REPORT_HUB_DB ?? defaultDbPath

let db: DatabaseSync | undefined

function ensureSchema(database: DatabaseSync): void {
  // 在线填报演示：按「sheet + 单元格」稀疏存储（value_json 为 JSON 标量）。
  // dev-only 结构演进：旧表无 sheet_key 列时直接 DROP 重建（演示数据可弃）。
  const columns = database.prepare('PRAGMA table_info(data_entry_cells)').all() as Record<
    string,
    unknown
  >[]
  if (columns.length > 0 && !columns.some((col) => col.name === 'sheet_key')) {
    database.exec('DROP TABLE data_entry_cells')
  }
  database.exec(`
    CREATE TABLE IF NOT EXISTS data_entry_cells (
      form_id TEXT NOT NULL,
      sheet_key TEXT NOT NULL,
      row_index INTEGER NOT NULL,
      col_index INTEGER NOT NULL,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (form_id, sheet_key, row_index, col_index)
    );
  `)
}

/** 获取（懒初始化）SQLite 连接 */
export function getDb(): DatabaseSync {
  if (db) return db
  mkdirSync(dirname(DB_PATH), { recursive: true })
  db = new DatabaseSync(DB_PATH, { enableForeignKeyConstraints: true })
  ensureSchema(db)
  return db
}

/** 测试 / 独立进程退出时释放连接 */
export function closeDb(): void {
  db?.close()
  db = undefined
}
