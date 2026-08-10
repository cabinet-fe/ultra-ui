import type {
  ConnectorError,
  DataConnection,
  DatasetField,
  ParamValues,
  QueryResult,
  Result
} from '@veltra/sheet'
import { createConnection } from 'mysql2/promise'
import type { Connection, FieldPacket, QueryValues } from 'mysql2/promise'

import { ERROR_CODES } from './errors'
import { checkParams, coerceNumericRows, PARAM_PATTERN, toDescribeSql } from './params'

/** 建连超时：死主机不无限挂起 */
const CONNECT_TIMEOUT_MS = 10_000

/** 数值列协议类型（mysql2 ColumnDefinition.type）：DECIMAL TINY SHORT LONG FLOAT DOUBLE LONGLONG INT24 NEWDECIMAL YEAR */
const MYSQL_NUMBER_TYPES = new Set([0, 1, 2, 3, 4, 5, 8, 9, 13, 246])
/** 日期列协议类型：TIMESTAMP DATE DATETIME NEWDATE */
const MYSQL_DATE_TYPES = new Set([7, 10, 12, 14])

function connectionFailed(conn: DataConnection, error: unknown): ConnectorError {
  return {
    code: ERROR_CODES.CONNECTION_FAILED,
    message: `连接 MySQL 失败（${conn.host}:${conn.port}/${conn.database}）：${error instanceof Error ? error.message : String(error)}`
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
async function withMysql<T>(
  conn: DataConnection,
  run: (client: Connection) => Promise<T>
): Promise<Result<T>> {
  let client: Connection | undefined
  try {
    client = await createConnection({
      host: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.username,
      password: conn.password,
      connectTimeout: CONNECT_TIMEOUT_MS
    })
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

function mapFieldType(type: number | undefined): DatasetField['type'] {
  if (type !== undefined && MYSQL_NUMBER_TYPES.has(type)) return 'number'
  if (type !== undefined && MYSQL_DATE_TYPES.has(type)) return 'date'
  return 'string'
}

function toDatasetFields(fields: FieldPacket[]): DatasetField[] {
  return fields.map((field) => ({
    name: field.name,
    label: field.name,
    type: mapFieldType(field.type)
  }))
}

/**
 * `${param}` → mysql2 命名占位符 `:param`（query 支持命名占位符 + 对象 values）。
 * 已知边界：mysql2 命名占位符不识别字符串字面量内的同名文本。
 */
function toNamedPlaceholders(sql: string): string {
  return sql.replace(PARAM_PATTERN, ':$1')
}

export function runMysqlTest(conn: DataConnection): Promise<Result<void>> {
  return withMysql(conn, async (client) => {
    await client.query('SELECT 1')
  })
}

export function runMysqlDescribe(
  conn: DataConnection,
  sql: string
): Promise<Result<DatasetField[]>> {
  return withMysql(conn, async (client) => {
    const [, fields] = await client.query(toDescribeSql(sql))
    return toDatasetFields(fields)
  })
}

export async function runMysqlQuery(
  conn: DataConnection,
  sql: string,
  values: ParamValues
): Promise<Result<QueryResult>> {
  const params = checkParams(sql, values)
  if (!params.ok) return params
  return withMysql(conn, async (client) => {
    const [rows, fields] = await client.query({
      sql: toNamedPlaceholders(sql),
      values: values as QueryValues
    })
    const datasetFields = toDatasetFields(fields)
    return {
      fields: datasetFields,
      rows: coerceNumericRows(datasetFields, rows as Record<string, unknown>[])
    }
  })
}
