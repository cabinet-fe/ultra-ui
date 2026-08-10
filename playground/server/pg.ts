import type {
  ConnectorError,
  DataConnection,
  DatasetField,
  ParamValues,
  QueryResult,
  Result
} from '@veltra/sheet'
import { Client } from 'pg'
import type { FieldDef } from 'pg'

import { ERROR_CODES } from './errors'
import { checkParams, coerceNumericRows, PARAM_PATTERN, toDescribeSql } from './params'

/** 建连超时：死主机不无限挂起 */
const CONNECT_TIMEOUT_MS = 10_000

/** 数值列 OID：int8 int2 int4 float4 float8 numeric（不含 regproc/oid 等非数值类型） */
const PG_NUMBER_OIDS = new Set([20, 21, 23, 700, 701, 1700])
/** 日期列 OID：date timestamp timestamptz */
const PG_DATE_OIDS = new Set([1082, 1114, 1184])

function connectionFailed(conn: DataConnection, error: unknown): ConnectorError {
  return {
    code: ERROR_CODES.CONNECTION_FAILED,
    message: `连接 PostgreSQL 失败（${conn.host}:${conn.port}/${conn.database}）：${error instanceof Error ? error.message : String(error)}`
  }
}

function sqlFailed(error: unknown): ConnectorError {
  return {
    code: ERROR_CODES.SQL_ERROR,
    message: `SQL 执行失败：${error instanceof Error ? error.message : String(error)}`
  }
}

/**
 * 每次调用按连接信息新建短连接：连接阶段错误 → CONNECTION_FAILED，
 * 执行阶段错误 → SQL_ERROR，连接最终必然释放。
 */
async function withPg<T>(
  conn: DataConnection,
  run: (client: Client) => Promise<T>
): Promise<Result<T>> {
  const client = new Client({
    host: conn.host,
    port: conn.port,
    database: conn.database,
    user: conn.username,
    password: conn.password,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS
  })
  try {
    await client.connect()
  } catch (error) {
    return { ok: false, error: connectionFailed(conn, error) }
  }
  try {
    return { ok: true, data: await run(client) }
  } catch (error) {
    return { ok: false, error: sqlFailed(error) }
  } finally {
    await client.end().catch(() => {})
  }
}

function mapFieldType(dataTypeID: number): DatasetField['type'] {
  if (PG_NUMBER_OIDS.has(dataTypeID)) return 'number'
  if (PG_DATE_OIDS.has(dataTypeID)) return 'date'
  return 'string'
}

function toDatasetFields(fields: FieldDef[]): DatasetField[] {
  return fields.map((field) => ({
    name: field.name,
    label: field.name,
    type: mapFieldType(field.dataTypeID)
  }))
}

/**
 * `${param}` → pg 位置占位符 `$1/$2…`（同名参数复用同一序号），
 * values 按参数首次出现顺序取值为数组。
 */
function toPositionalPlaceholders(
  sql: string,
  values: ParamValues
): { sql: string; values: unknown[] } {
  const indexByName = new Map<string, number>()
  const ordered: unknown[] = []
  const transformed = sql.replace(PARAM_PATTERN, (_match: string, name: string) => {
    let index = indexByName.get(name)
    if (index === undefined) {
      index = ordered.push(values[name])
      indexByName.set(name, index)
    }
    return `$${index}`
  })
  return { sql: transformed, values: ordered }
}

export function runPgTest(conn: DataConnection): Promise<Result<void>> {
  return withPg(conn, async (client) => {
    await client.query('SELECT 1')
  })
}

export function runPgDescribe(conn: DataConnection, sql: string): Promise<Result<DatasetField[]>> {
  return withPg(conn, async (client) => {
    const result = await client.query(toDescribeSql(sql))
    return toDatasetFields(result.fields)
  })
}

export async function runPgQuery(
  conn: DataConnection,
  sql: string,
  values: ParamValues
): Promise<Result<QueryResult>> {
  const params = checkParams(sql, values)
  if (!params.ok) return params
  return withPg(conn, async (client) => {
    const { sql: text, values: ordered } = toPositionalPlaceholders(sql, values)
    const result = await client.query({ text, values: ordered })
    const datasetFields = toDatasetFields(result.fields)
    return {
      fields: datasetFields,
      rows: coerceNumericRows(datasetFields, result.rows as Record<string, unknown>[])
    }
  })
}
