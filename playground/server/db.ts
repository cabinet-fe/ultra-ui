import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const serverDir = dirname(fileURLToPath(import.meta.url))
const defaultDbPath = join(serverDir, 'data', 'report-hub.db')

/** SQLite 文件路径，可用 REPORT_HUB_DB 覆盖 */
export const DB_PATH = process.env.REPORT_HUB_DB ?? defaultDbPath

let db: DatabaseSync | undefined

function ensureSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('mysql', 'postgresql')),
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      database TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      sql TEXT NOT NULL DEFAULT '',
      param_overrides TEXT,
      field_overrides TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
