import type { DatabaseSync } from 'node:sqlite'

import type { DataConnection } from '@veltra/sheet'

import { getDb } from './db'
import type { WorkspaceData, WorkspaceDataset } from './workspace-types'

function rowToConnection(row: Record<string, unknown>): DataConnection {
  return {
    id: String(row.id),
    label: String(row.label),
    type: row.type as DataConnection['type'],
    host: String(row.host),
    port: Number(row.port),
    database: String(row.database),
    username: String(row.username),
    password: String(row.password)
  }
}

function parseJsonObject(raw: unknown): Record<string, unknown> | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  if (typeof raw !== 'string') return undefined
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    return undefined
  }
  return undefined
}

function rowToDataset(row: Record<string, unknown>): WorkspaceDataset {
  const rawSql = row.sql
  const sql = typeof rawSql === 'string' ? rawSql : ''
  const dataset: WorkspaceDataset = {
    id: String(row.id),
    connectionId: String(row.connection_id),
    label: String(row.label),
    sql
  }
  const paramOverrides = parseJsonObject(row.param_overrides)
  if (paramOverrides) dataset.paramOverrides = paramOverrides
  const fieldOverrides = parseJsonObject(row.field_overrides)
  if (fieldOverrides) dataset.fieldOverrides = fieldOverrides
  return dataset
}

function selectAll(database: DatabaseSync, sql: string): Record<string, unknown>[] {
  return database.prepare(sql).all() as Record<string, unknown>[]
}

/** 读取工作区（连接 + 数据集） */
export function loadWorkspace(): WorkspaceData {
  const database = getDb()
  const connections = selectAll(database, 'SELECT * FROM connections ORDER BY created_at ASC').map(
    rowToConnection
  )
  const datasets = selectAll(database, 'SELECT * FROM datasets ORDER BY created_at ASC').map(
    rowToDataset
  )
  return { connections, datasets }
}

/** 按 id 读取连接 */
export function getConnectionById(id: string): DataConnection | undefined {
  const database = getDb()
  const row = database.prepare('SELECT * FROM connections WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  return row ? rowToConnection(row) : undefined
}

/** 按 id 读取数据集 */
export function getDatasetById(id: string): WorkspaceDataset | undefined {
  const database = getDb()
  const row = database.prepare('SELECT * FROM datasets WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  return row ? rowToDataset(row) : undefined
}

/** 全量替换工作区连接与数据集（事务） */
export function saveWorkspace(data: WorkspaceData): void {
  const database = getDb()
  const replaceConnections = database.prepare(`
    INSERT INTO connections (id, label, type, host, port, database, username, password, updated_at)
    VALUES ($id, $label, $type, $host, $port, $database, $username, $password, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      type = excluded.type,
      host = excluded.host,
      port = excluded.port,
      database = excluded.database,
      username = excluded.username,
      password = excluded.password,
      updated_at = datetime('now')
  `)
  const replaceDatasets = database.prepare(`
    INSERT INTO datasets (id, connection_id, label, sql, param_overrides, field_overrides, updated_at)
    VALUES ($id, $connection_id, $label, $sql, $param_overrides, $field_overrides, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      connection_id = excluded.connection_id,
      label = excluded.label,
      sql = excluded.sql,
      param_overrides = excluded.param_overrides,
      field_overrides = excluded.field_overrides,
      updated_at = datetime('now')
  `)
  const deleteConnection = database.prepare('DELETE FROM connections WHERE id = ?')
  const deleteDataset = database.prepare('DELETE FROM datasets WHERE id = ?')

  database.exec('BEGIN IMMEDIATE')
  try {
    const incomingConnIds = new Set(data.connections.map((item) => item.id))
    const incomingDatasetIds = new Set(data.datasets.map((item) => item.id))

    for (const conn of data.connections) {
      replaceConnections.run({
        id: conn.id,
        label: conn.label,
        type: conn.type,
        host: conn.host,
        port: conn.port,
        database: conn.database,
        username: conn.username,
        password: conn.password
      })
    }

    for (const dataset of data.datasets) {
      replaceDatasets.run({
        id: dataset.id,
        connection_id: dataset.connectionId,
        label: dataset.label,
        sql: dataset.sql,
        param_overrides: dataset.paramOverrides ? JSON.stringify(dataset.paramOverrides) : null,
        field_overrides: dataset.fieldOverrides ? JSON.stringify(dataset.fieldOverrides) : null
      })
    }

    for (const row of selectAll(database, 'SELECT id FROM connections')) {
      const id = String(row.id)
      if (!incomingConnIds.has(id)) deleteConnection.run(id)
    }

    for (const row of selectAll(database, 'SELECT id FROM datasets')) {
      const id = String(row.id)
      if (!incomingDatasetIds.has(id)) deleteDataset.run(id)
    }

    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}
