import type { ConnectorError, DataConnection, DatasetField, ParamValues } from '@veltra/sheet'
/**
 * playground 内置 hono + TS 契约参考服务（ADR-0003 决策 3）。
 * - 三端点镜像 `DataConnector` 三方法：POST /test、/describe、/query（无版本段）；
 * - 业务错误（连接失败 / SQL 报错 / 参数缺失）一律 `200 + { ok: false, error: { code, message } }`；
 * - 传输层错误（请求形状不合法 / 不支持的连接类型）用 HTTP 400；
 * - 服务无状态、不内置任何默认连接；每次调用按连接信息新建短连接；
 * - GET / 返回契约活体文档（含端点、错误码与 curl 示例）。
 */
import { Hono } from 'hono'
import type { Context } from 'hono'
import { logger } from 'hono/logger'

import { ERROR_CODES } from './errors'
import { runMysqlDescribe, runMysqlQuery, runMysqlTest } from './mysql'
import { runPgDescribe, runPgQuery, runPgTest } from './pg'
import { loadWorkspace, saveWorkspace, type StoredDataset } from './workspace'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalid(message: string): ConnectorError {
  return { code: ERROR_CODES.INVALID_REQUEST, message }
}

/** 校验并归一化连接对象（纯序列化对象，与 @veltra/sheet 的 DataConnection 一一对应） */
function validateConnection(
  input: unknown
): { ok: true; value: DataConnection } | { ok: false; error: ConnectorError } {
  if (!isRecord(input)) return { ok: false, error: invalid('connection 必须是 JSON 对象') }
  const { id, label, type, host, port, database, username, password } = input
  if (typeof id !== 'string' || id === '')
    return { ok: false, error: invalid('connection.id 必须是非空字符串') }
  if (typeof label !== 'string' || label === '') {
    return { ok: false, error: invalid('connection.label 必须是非空字符串') }
  }
  if (type !== 'mysql' && type !== 'postgresql') {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.UNSUPPORTED_TYPE,
        message: `不支持的连接类型：${String(type)}（仅支持 mysql / postgresql）`
      }
    }
  }
  if (typeof host !== 'string' || host === '') {
    return { ok: false, error: invalid('connection.host 必须是非空字符串') }
  }
  if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, error: invalid('connection.port 必须是 1~65535 的整数') }
  }
  if (typeof database !== 'string')
    return { ok: false, error: invalid('connection.database 必须是字符串') }
  if (typeof username !== 'string')
    return { ok: false, error: invalid('connection.username 必须是字符串') }
  if (typeof password !== 'string')
    return { ok: false, error: invalid('connection.password 必须是字符串') }
  return { ok: true, value: { id, label, type, host, port, database, username, password } }
}

/** 解析并校验 JSON 请求体；形状不合法已回 400，返回 `ok: false` 时直接返回 response */
async function readJsonBody(
  c: Context
): Promise<{ ok: true; value: Record<string, unknown> } | { ok: false; response: Response }> {
  let parsed: unknown
  try {
    parsed = await c.req.json()
  } catch {
    return {
      ok: false,
      response: c.json({ ok: false, error: invalid('请求体不是合法 JSON') }, 400)
    }
  }
  if (!isRecord(parsed)) {
    return {
      ok: false,
      response: c.json({ ok: false, error: invalid('请求体必须是 JSON 对象') }, 400)
    }
  }
  return { ok: true, value: parsed }
}

/** 内核 DatasetField → 契约字段 `{ name, type? }`（契约形状，label 不上行） */
function toContractFields(fields: DatasetField[]): { name: string; type?: DatasetField['type'] }[] {
  return fields.map(({ name, type }) => ({ name, type }))
}

function validateStoredDataset(input: unknown): StoredDataset | null {
  if (!isRecord(input)) return null
  const { id, label, connectionId, sql, paramOverrides, fieldOverrides } = input
  if (typeof id !== 'string' || id === '') return null
  if (typeof label !== 'string' || label === '') return null
  if (typeof connectionId !== 'string' || connectionId === '') return null
  if (typeof sql !== 'string') return null
  if (paramOverrides !== undefined && !isRecord(paramOverrides)) return null
  if (fieldOverrides !== undefined && !isRecord(fieldOverrides)) return null
  return {
    id,
    label,
    connectionId,
    sql,
    ...(paramOverrides ? { paramOverrides } : {}),
    ...(fieldOverrides ? { fieldOverrides } : {})
  }
}

export const reportApp = new Hono()

reportApp.use(logger())

/** GET / —— 契约活体文档（ADR-0003 决策 3：参考实现承担契约对齐基准职责） */
reportApp.get('/', (c) =>
  c.json({
    name: '@veltra/sheet report connector 参考实现（playground dev-only，不进发布产物）',
    contract:
      'ADR-0003 决策 3：三端点镜像 DataConnector 三方法，无版本段，随库版本演进；真实数据库访问由下游后端以任意语言实现（BYO）',
    endpoints: {
      test: {
        method: 'POST',
        path: '/test',
        request: {
          connection:
            'DataConnection（type: mysql | postgresql，含 host/port/database/username/password）'
        },
        success: { ok: true },
        error: '200 + { ok: false, error: { code, message } }'
      },
      describe: {
        method: 'POST',
        path: '/describe',
        request: {
          connection: 'DataConnection',
          sql: '含 ${param} 占位符的 SELECT（服务端以 NULL 替换占位符后只取字段元数据，不取数）'
        },
        success: { ok: true, fields: '[{ name, type? }]，type: string | number | date' },
        error: '200 + { ok: false, error: { code, message } }'
      },
      query: {
        method: 'POST',
        path: '/query',
        request: {
          connection: 'DataConnection',
          sql: '含 ${param} 占位符的 SELECT',
          values: 'Record<string, unknown>，与 SQL 参数一一对应'
        },
        success: { ok: true, fields: '[{ name, type? }]', rows: 'Record<string, unknown>[]' },
        error: '200 + { ok: false, error: { code, message } }'
      }
    },
    errorCodes: {
      INVALID_REQUEST: 'HTTP 400：请求体 / 连接对象形状不合法（传输层错误）',
      UNSUPPORTED_TYPE: 'HTTP 400：连接类型不是 mysql / postgresql',
      CONNECTION_FAILED: 'HTTP 200：数据库不可达 / 认证失败 / 连接被拒',
      SQL_ERROR: 'HTTP 200：SQL 语法或执行报错',
      MISSING_PARAM: 'HTTP 200：SQL 引用了 ${param} 但请求未提供对应值'
    },
    workspace: {
      load: { method: 'GET', path: '/workspace', success: '{ ok: true, connections, datasets }' },
      save: {
        method: 'PUT',
        path: '/workspace',
        request: '{ connections: DataConnection[], datasets: StoredDataset[] }',
        success: '{ ok: true }'
      },
      storage:
        'SQLite（Bun 内置 bun:sqlite），默认 playground/server/data/report-hub.db，可用 REPORT_HUB_DB 覆盖'
    },
    usage: {
      devProxy:
        'vite dev 下前端用 createHttpConnector({ endpoint: "/report-api" })，经 vite proxy 转发到本服务',
      direct: `本服务独立监听 REPORT_SERVER_PORT（默认 8787），可直接 curl 调用`,
      example: {
        test: `curl -X POST http://localhost:8787/test -H "Content-Type: application/json" -d '{"connection":{"id":"c1","label":"示例","type":"postgresql","host":"127.0.0.1","port":5432,"database":"demo","username":"postgres","password":""}}'`,
        describe: `curl -X POST http://localhost:8787/describe -H "Content-Type: application/json" -d '{"connection":{...},"sql":"SELECT * FROM orders WHERE status = \${status}"}'`,
        query: `curl -X POST http://localhost:8787/query -H "Content-Type: application/json" -d '{"connection":{...},"sql":"SELECT * FROM orders WHERE status = \${status}","values":{"status":"paid"}}'`
      }
    }
  })
)

/** GET /workspace — 读取持久化的连接与数据集（playground 演示用） */
reportApp.get('/workspace', (c) => {
  const workspace = loadWorkspace()
  return c.json({ ok: true, ...workspace })
})

/** PUT /workspace — 全量保存连接与数据集（playground 演示用） */
reportApp.put('/workspace', async (c) => {
  const body = await readJsonBody(c)
  if (!body.ok) return body.response

  const rawConnections = body.value.connections
  const rawDatasets = body.value.datasets
  if (!Array.isArray(rawConnections) || !Array.isArray(rawDatasets)) {
    return c.json({ ok: false, error: invalid('connections 与 datasets 必须是数组') }, 400)
  }

  const connections: DataConnection[] = []
  for (const item of rawConnections) {
    const connection = validateConnection(item)
    if (!connection.ok) return c.json({ ok: false, error: connection.error }, 400)
    connections.push(connection.value)
  }

  const datasets: StoredDataset[] = []
  for (const item of rawDatasets) {
    const dataset = validateStoredDataset(item)
    if (!dataset) {
      return c.json({ ok: false, error: invalid('datasets 项形状不合法') }, 400)
    }
    datasets.push(dataset)
  }

  const connectionIds = new Set(connections.map((item) => item.id))
  for (const dataset of datasets) {
    if (!connectionIds.has(dataset.connectionId)) {
      return c.json(
        {
          ok: false,
          error: invalid(`数据集 ${dataset.id} 引用了不存在的连接 ${dataset.connectionId}`)
        },
        400
      )
    }
  }

  saveWorkspace({ connections, datasets })
  return c.json({ ok: true })
})

reportApp.post('/test', async (c) => {
  const body = await readJsonBody(c)
  if (!body.ok) return body.response
  const connection = validateConnection(body.value.connection)
  if (!connection.ok) return c.json({ ok: false, error: connection.error }, 400)
  const result =
    connection.value.type === 'mysql'
      ? await runMysqlTest(connection.value)
      : await runPgTest(connection.value)
  return result.ok ? c.json({ ok: true }) : c.json({ ok: false, error: result.error })
})

reportApp.post('/describe', async (c) => {
  const body = await readJsonBody(c)
  if (!body.ok) return body.response
  const connection = validateConnection(body.value.connection)
  if (!connection.ok) return c.json({ ok: false, error: connection.error }, 400)
  const { sql } = body.value
  if (typeof sql !== 'string' || sql.trim() === '') {
    return c.json({ ok: false, error: invalid('sql 必须是非空字符串') }, 400)
  }
  const result =
    connection.value.type === 'mysql'
      ? await runMysqlDescribe(connection.value, sql)
      : await runPgDescribe(connection.value, sql)
  return result.ok
    ? c.json({ ok: true, fields: toContractFields(result.data) })
    : c.json({ ok: false, error: result.error })
})

reportApp.post('/query', async (c) => {
  const body = await readJsonBody(c)
  if (!body.ok) return body.response
  const connection = validateConnection(body.value.connection)
  if (!connection.ok) return c.json({ ok: false, error: connection.error }, 400)
  const { sql, values } = body.value
  if (typeof sql !== 'string' || sql.trim() === '') {
    return c.json({ ok: false, error: invalid('sql 必须是非空字符串') }, 400)
  }
  if (values !== undefined && !isRecord(values)) {
    return c.json({ ok: false, error: invalid('values 必须是 JSON 对象') }, 400)
  }
  const paramValues: ParamValues = values === undefined ? {} : values
  const result =
    connection.value.type === 'mysql'
      ? await runMysqlQuery(connection.value, sql, paramValues)
      : await runPgQuery(connection.value, sql, paramValues)
  return result.ok
    ? c.json({ ok: true, fields: toContractFields(result.data.fields), rows: result.data.rows })
    : c.json({ ok: false, error: result.error })
})
