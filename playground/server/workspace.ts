import type { DatabaseSync } from 'node:sqlite'

import type { DataConnection } from '@veltra/sheet'

import { getDb } from './db'

/** 持久化的数据集（不含 describe 字段缓存） */
export interface StoredDataset {
  id: string
  label: string
  connectionId: string
  sql: string
  paramOverrides?: Record<string, unknown>
  fieldOverrides?: Record<string, unknown>
}

export interface WorkspaceData {
  connections: DataConnection[]
  datasets: StoredDataset[]
}

function parseJson<T>(raw: string | null): T | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

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

function rowToDataset(row: Record<string, unknown>): StoredDataset {
  const paramOverrides = parseJson<StoredDataset['paramOverrides']>(
    row.param_overrides as string | null
  )
  const fieldOverrides = parseJson<StoredDataset['fieldOverrides']>(
    row.field_overrides as string | null
  )
  return {
    id: String(row.id),
    label: String(row.label),
    connectionId: String(row.connection_id),
    sql: String(row.sql),
    ...(paramOverrides ? { paramOverrides } : {}),
    ...(fieldOverrides ? { fieldOverrides } : {})
  }
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

/** 全量替换工作区（事务） */
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
  const replaceDataset = database.prepare(`
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

    for (const row of selectAll(database, 'SELECT id FROM connections')) {
      const id = String(row.id)
      if (!incomingConnIds.has(id)) deleteConnection.run(id)
    }

    for (const dataset of data.datasets) {
      replaceDataset.run({
        id: dataset.id,
        connection_id: dataset.connectionId,
        label: dataset.label,
        sql: dataset.sql,
        param_overrides: dataset.paramOverrides ? JSON.stringify(dataset.paramOverrides) : null,
        field_overrides: dataset.fieldOverrides ? JSON.stringify(dataset.fieldOverrides) : null
      })
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
