import type { ConnectorError, DataConnection, DatasetField, ParamValues } from '@veltra/sheet'
/**
 * playground 内置 hono + TS 契约参考服务（ADR-0003 决策 3）。
 * - 通用契约三端点：POST /test、/describe、/query（无版本段，供 BYO 对齐）；
 * - playground 演示专用 Hub 端点：连接 / 数据集持久化于 SQLite，查询只传 datasetId；
 * - 业务错误（连接失败 / SQL 报错 / 参数缺失）一律 `200 + { ok: false, error: { code, message } }`；
 * - 传输层错误（请求形状不合法 / 不支持的连接类型）用 HTTP 400；
 * - GET / 返回契约活体文档（含端点、错误码与 curl 示例）。
 */
import { Hono } from 'hono'
import type { Context } from 'hono'
import { logger } from 'hono/logger'

import { listDataEntryCells, saveDataEntryCells, type DataEntryCell } from './data-entry'
import { ERROR_CODES } from './errors'
import { runMysqlDescribe, runMysqlQuery, runMysqlTest } from './mysql'
import { runPgDescribe, runPgQuery, runPgTest } from './pg'
import { hydrateTemplateFromWorkspace, stripTemplateForStorage } from './template-hydration'
import { validateStoredTemplate } from './template-validation'
import {
  createReportTemplate,
  deleteReportTemplate,
  getReportTemplate,
  listReportTemplates,
  updateReportTemplate
} from './templates'
import { getConnectionById, getDatasetById, loadWorkspace, saveWorkspace } from './workspace'
import type { WorkspaceDataset } from './workspace-types'

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

/** 内核 DatasetField → 契约字段 `{ name, label?, type? }` */
function toContractFields(
  fields: DatasetField[]
): { name: string; label?: string; type?: DatasetField['type'] }[] {
  return fields.map(({ name, label, type }) => {
    const field: { name: string; label?: string; type?: DatasetField['type'] } = { name }
    if (label !== name) field.label = label
    if (type) field.type = type
    return field
  })
}

function validateTemplateName(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const name = input.trim()
  if (!name) return null
  return name
}

/** 填报表单 id 校验（路径参数） */
function validateFormId(input: string): string | null {
  const formId = input.trim()
  if (!formId || formId.length > 128) return null
  return formId
}

/** 在线填报演示单批上限（填报单次保存通常只有零星几格） */
const MAX_DATA_ENTRY_CELLS = 10_000

/** 校验填报单元格数组：sheet 1~128 字符；row/col 非负整数；value 仅 JSON 标量（null/'' = 删除该格） */
function validateDataEntryCells(
  input: unknown
): { ok: true; value: DataEntryCell[] } | { ok: false; error: ConnectorError } {
  if (!Array.isArray(input)) return { ok: false, error: invalid('cells 必须是数组') }
  if (input.length > MAX_DATA_ENTRY_CELLS) {
    return { ok: false, error: invalid(`cells 一次最多 ${MAX_DATA_ENTRY_CELLS} 条`) }
  }
  const cells: DataEntryCell[] = []
  for (const item of input) {
    if (!isRecord(item)) return { ok: false, error: invalid('cell 必须是 JSON 对象') }
    const { sheet, row, col, value } = item
    if (typeof sheet !== 'string' || sheet.trim() === '' || sheet.length > 128) {
      return { ok: false, error: invalid('cell.sheet 必须是 1~128 字符') }
    }
    if (!Number.isInteger(row) || (row as number) < 0) {
      return { ok: false, error: invalid('cell.row 必须是非负整数') }
    }
    if (!Number.isInteger(col) || (col as number) < 0) {
      return { ok: false, error: invalid('cell.col 必须是非负整数') }
    }
    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      return { ok: false, error: invalid('cell.value 只支持 string / number / boolean / null') }
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return { ok: false, error: invalid('cell.value 必须是有限数字') }
    }
    cells.push({ sheet, row: row as number, col: col as number, value })
  }
  return { ok: true, value: cells }
}

/** 校验工作区数据集定义 */
function validateWorkspaceDataset(
  input: unknown,
  connectionIds: Set<string>
): { ok: true; value: WorkspaceDataset } | { ok: false; error: ConnectorError } {
  if (!isRecord(input)) return { ok: false, error: invalid('dataset 必须是 JSON 对象') }
  const { id, connectionId, label, sql } = input
  if (typeof id !== 'string' || id === '') {
    return { ok: false, error: invalid('dataset.id 必须是非空字符串') }
  }
  if (typeof connectionId !== 'string' || connectionId === '') {
    return { ok: false, error: invalid('dataset.connectionId 必须是非空字符串') }
  }
  if (!connectionIds.has(connectionId)) {
    return { ok: false, error: invalid(`dataset.connectionId 未找到对应连接：${connectionId}`) }
  }
  if (typeof label !== 'string' || label === '') {
    return { ok: false, error: invalid('dataset.label 必须是非空字符串') }
  }
  if (typeof sql !== 'string') {
    return { ok: false, error: invalid('dataset.sql 必须是字符串') }
  }
  const dataset: WorkspaceDataset = { id, connectionId, label, sql }
  if (input.paramOverrides !== undefined) {
    if (!isRecord(input.paramOverrides)) {
      return { ok: false, error: invalid('dataset.paramOverrides 必须是 JSON 对象') }
    }
    dataset.paramOverrides = input.paramOverrides
  }
  if (input.fieldOverrides !== undefined) {
    if (!isRecord(input.fieldOverrides)) {
      return { ok: false, error: invalid('dataset.fieldOverrides 必须是 JSON 对象') }
    }
    dataset.fieldOverrides = input.fieldOverrides
  }
  return { ok: true, value: dataset }
}

function notFound(message: string): ConnectorError {
  return { code: ERROR_CODES.INVALID_REQUEST, message }
}

function resolveDatasetContext(
  datasetId: string
):
  | { ok: true; dataset: WorkspaceDataset; connection: DataConnection }
  | { ok: false; error: ConnectorError } {
  const dataset = getDatasetById(datasetId)
  if (!dataset) return { ok: false, error: notFound(`数据集不存在：${datasetId}`) }
  const connection = getConnectionById(dataset.connectionId)
  if (!connection) {
    return { ok: false, error: notFound(`数据集所属连接不存在：${dataset.connectionId}`) }
  }
  return { ok: true, dataset, connection }
}

async function runDescribe(connection: DataConnection, sql: string) {
  return connection.type === 'mysql'
    ? runMysqlDescribe(connection, sql)
    : runPgDescribe(connection, sql)
}

async function runQuery(connection: DataConnection, sql: string, values: ParamValues) {
  return connection.type === 'mysql'
    ? runMysqlQuery(connection, sql, values)
    : runPgQuery(connection, sql, values)
}

async function runTest(connection: DataConnection) {
  return connection.type === 'mysql' ? runMysqlTest(connection) : runPgTest(connection)
}

function hydrateTemplateRecord<
  T extends { template: NonNullable<ReturnType<typeof validateStoredTemplate>> }
>(item: T): T {
  return { ...item, template: hydrateTemplateFromWorkspace(item.template, loadWorkspace()) }
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
        success: { ok: true, fields: '[{ name, label?, type? }]，type: string | number | date' },
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
        success: {
          ok: true,
          fields: '[{ name, label?, type? }]',
          rows: 'Record<string, unknown>[]'
        },
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
      load: {
        method: 'GET',
        path: '/workspace',
        success: '{ ok: true, connections, datasets }',
        note: '连接与数据集（含 SQL）持久化于 SQLite；playground 前端经此同步工作区'
      },
      save: {
        method: 'PUT',
        path: '/workspace',
        request: '{ connections: DataConnection[], datasets: WorkspaceDataset[] }',
        success: '{ ok: true }'
      },
      hub: {
        testConnection: {
          method: 'POST',
          path: '/connections/:id/test',
          request: '无（凭据从 SQLite 读取）',
          success: '{ ok: true }'
        },
        describeDataset: {
          method: 'POST',
          path: '/datasets/:id/describe',
          request: '无（SQL 与连接从 SQLite 读取）',
          success: '{ ok: true, fields }'
        },
        queryDataset: {
          method: 'POST',
          path: '/datasets/:id/query',
          request: '{ values?: Record<string, unknown> }',
          success: '{ ok: true, fields, rows }'
        }
      },
      storage:
        'SQLite（Bun 内置 bun:sqlite），默认 playground/server/data/report-hub.db，可用 REPORT_HUB_DB 覆盖'
    },
    templates: {
      list: {
        method: 'GET',
        path: '/templates',
        success: '{ ok: true, items: [{ id, name, createdAt, updatedAt }] }'
      },
      get: {
        method: 'GET',
        path: '/templates/:id',
        success: '{ ok: true, item: { id, name, template, createdAt, updatedAt } }'
      },
      create: {
        method: 'POST',
        path: '/templates',
        request: '{ name: string, template: ReportTemplate }',
        success: '{ ok: true, item }'
      },
      update: {
        method: 'PUT',
        path: '/templates/:id',
        request: '{ name?: string, template?: ReportTemplate }',
        success: '{ ok: true, item }'
      },
      delete: { method: 'DELETE', path: '/templates/:id', success: '{ ok: true }' }
    },
    dataEntry: {
      note: '在线填报演示：按「sheet + 单元格」稀疏存储（SQLite 表 data_entry_cells），空值删除该格记录',
      load: {
        method: 'GET',
        path: '/data-entry/forms/:formId/cells',
        success: '{ ok: true, cells: [{ sheet, row, col, value }] }'
      },
      save: {
        method: 'PUT',
        path: '/data-entry/forms/:formId/cells',
        request: '{ cells: [{ sheet, row, col, value }] }（value 仅 string/number/boolean/null）',
        success: '{ ok: true, saved: number }'
      }
    },
    usage: {
      devProxy:
        'vite dev 下 playground 用 createHubConnector({ endpoint: "/report-api" })，经 vite proxy 转发到本服务',
      direct: `本服务独立监听 REPORT_SERVER_PORT（默认 8787），可直接 curl 调用`,
      example: {
        test: `curl -X POST http://localhost:8787/connections/c1/test`,
        describe: `curl -X POST http://localhost:8787/datasets/ds-orders/describe`,
        query: `curl -X POST http://localhost:8787/datasets/ds-orders/query -H "Content-Type: application/json" -d '{"values":{"status":"paid"}}'`,
        legacyTest: `curl -X POST http://localhost:8787/test -H "Content-Type: application/json" -d '{"connection":{...}}'`
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
  if (!Array.isArray(rawConnections)) {
    return c.json({ ok: false, error: invalid('connections 必须是数组') }, 400)
  }
  const rawDatasets = body.value.datasets
  if (!Array.isArray(rawDatasets)) {
    return c.json({ ok: false, error: invalid('datasets 必须是数组') }, 400)
  }

  const connections: DataConnection[] = []
  for (const item of rawConnections) {
    const connection = validateConnection(item)
    if (!connection.ok) return c.json({ ok: false, error: connection.error }, 400)
    connections.push(connection.value)
  }

  const connectionIds = new Set(connections.map((item) => item.id))
  const datasets: WorkspaceDataset[] = []
  for (const item of rawDatasets) {
    const dataset = validateWorkspaceDataset(item, connectionIds)
    if (!dataset.ok) return c.json({ ok: false, error: dataset.error }, 400)
    datasets.push(dataset.value)
  }

  saveWorkspace({ connections, datasets })
  return c.json({ ok: true })
})

/** GET /templates — 列出已入库的报表模板 */
reportApp.get('/templates', (c) => {
  return c.json({ ok: true, items: listReportTemplates() })
})

/** GET /templates/:id — 读取单个报表模板（数据集由工作区回填） */
reportApp.get('/templates/:id', (c) => {
  const item = getReportTemplate(c.req.param('id'))
  if (!item) {
    return c.json({ ok: false, error: invalid('报表模板不存在') }, 404)
  }
  return c.json({ ok: true, item: hydrateTemplateRecord(item) })
})

/** POST /templates — 新建报表模板 */
reportApp.post('/templates', async (c) => {
  const body = await readJsonBody(c)
  if (!body.ok) return body.response

  const name = validateTemplateName(body.value.name)
  if (!name) {
    return c.json({ ok: false, error: invalid('name 必须是非空字符串') }, 400)
  }
  const template = validateStoredTemplate(body.value.template)
  if (!template) {
    return c.json({ ok: false, error: invalid('template 形状不合法') }, 400)
  }

  const item = createReportTemplate(name, stripTemplateForStorage(template))
  return c.json({ ok: true, item: hydrateTemplateRecord(item) }, 201)
})

/** PUT /templates/:id — 更新报表模板 */
reportApp.put('/templates/:id', async (c) => {
  const body = await readJsonBody(c)
  if (!body.ok) return body.response

  const patch: {
    name?: string
    template?: NonNullable<ReturnType<typeof validateStoredTemplate>>
  } = {}
  if ('name' in body.value) {
    const name = validateTemplateName(body.value.name)
    if (!name) {
      return c.json({ ok: false, error: invalid('name 必须是非空字符串') }, 400)
    }
    patch.name = name
  }
  if ('template' in body.value) {
    const template = validateStoredTemplate(body.value.template)
    if (!template) {
      return c.json({ ok: false, error: invalid('template 形状不合法') }, 400)
    }
    patch.template = stripTemplateForStorage(template)
  }
  if (!('name' in patch) && !('template' in patch)) {
    return c.json({ ok: false, error: invalid('请求体需包含 name 和/或 template') }, 400)
  }

  const item = updateReportTemplate(c.req.param('id'), patch)
  if (!item) {
    return c.json({ ok: false, error: invalid('报表模板不存在') }, 404)
  }
  return c.json({ ok: true, item: hydrateTemplateRecord(item) })
})

/** DELETE /templates/:id — 删除报表模板 */
reportApp.delete('/templates/:id', (c) => {
  const deleted = deleteReportTemplate(c.req.param('id'))
  if (!deleted) {
    return c.json({ ok: false, error: invalid('报表模板不存在') }, 404)
  }
  return c.json({ ok: true })
})

/** POST /connections/:id/test — 按已持久化连接测试（不传凭据） */
reportApp.post('/connections/:id/test', async (c) => {
  const connection = getConnectionById(c.req.param('id'))
  if (!connection) {
    return c.json({ ok: false, error: notFound('连接不存在') }, 404)
  }
  const result = await runTest(connection)
  return result.ok ? c.json({ ok: true }) : c.json({ ok: false, error: result.error })
})

/** POST /datasets/:id/describe — 按已持久化数据集解析字段（不传 SQL / 连接） */
reportApp.post('/datasets/:id/describe', async (c) => {
  const context = resolveDatasetContext(c.req.param('id'))
  if (!context.ok) return c.json({ ok: false, error: context.error }, 404)
  const result = await runDescribe(context.connection, context.dataset.sql)
  return result.ok
    ? c.json({ ok: true, fields: toContractFields(result.data) })
    : c.json({ ok: false, error: result.error })
})

/** POST /datasets/:id/query — 按已持久化数据集取数（只传 values） */
reportApp.post('/datasets/:id/query', async (c) => {
  const context = resolveDatasetContext(c.req.param('id'))
  if (!context.ok) return c.json({ ok: false, error: context.error }, 404)

  const body = await readJsonBody(c)
  if (!body.ok) return body.response
  const { values } = body.value
  if (values !== undefined && !isRecord(values)) {
    return c.json({ ok: false, error: invalid('values 必须是 JSON 对象') }, 400)
  }
  const paramValues: ParamValues = values === undefined ? {} : values
  const result = await runQuery(context.connection, context.dataset.sql, paramValues)
  return result.ok
    ? c.json({ ok: true, fields: toContractFields(result.data.fields), rows: result.data.rows })
    : c.json({ ok: false, error: result.error })
})

/** GET /data-entry/forms/:formId/cells — 读取表单全部已存单元格（在线填报演示） */
reportApp.get('/data-entry/forms/:formId/cells', (c) => {
  const formId = validateFormId(c.req.param('formId'))
  if (!formId) {
    return c.json({ ok: false, error: invalid('formId 必须是 1~128 字符') }, 400)
  }
  return c.json({ ok: true, cells: listDataEntryCells(formId) })
})

/** PUT /data-entry/forms/:formId/cells — 按单元格批量 upsert（空值删除该格记录） */
reportApp.put('/data-entry/forms/:formId/cells', async (c) => {
  const formId = validateFormId(c.req.param('formId'))
  if (!formId) {
    return c.json({ ok: false, error: invalid('formId 必须是 1~128 字符') }, 400)
  }
  const body = await readJsonBody(c)
  if (!body.ok) return body.response
  const cells = validateDataEntryCells(body.value.cells)
  if (!cells.ok) return c.json({ ok: false, error: cells.error }, 400)
  return c.json({ ok: true, saved: saveDataEntryCells(formId, cells.value) })
})

/** POST /test — 通用契约：测试连接（草稿连接或未入库场景） */

reportApp.post('/test', async (c) => {
  const body = await readJsonBody(c)
  if (!body.ok) return body.response
  const connection = validateConnection(body.value.connection)
  if (!connection.ok) return c.json({ ok: false, error: connection.error }, 400)
  const result = await runTest(connection.value)
  return result.ok ? c.json({ ok: true }) : c.json({ ok: false, error: result.error })
})

/** POST /describe — 通用契约：按连接 + SQL 解析字段 */
reportApp.post('/describe', async (c) => {
  const body = await readJsonBody(c)
  if (!body.ok) return body.response
  const connection = validateConnection(body.value.connection)
  if (!connection.ok) return c.json({ ok: false, error: connection.error }, 400)
  const { sql } = body.value
  if (typeof sql !== 'string' || sql.trim() === '') {
    return c.json({ ok: false, error: invalid('sql 必须是非空字符串') }, 400)
  }
  const result = await runDescribe(connection.value, sql)
  return result.ok
    ? c.json({ ok: true, fields: toContractFields(result.data) })
    : c.json({ ok: false, error: result.error })
})

/** POST /query — 通用契约：按连接 + SQL 取数 */
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
  const result = await runQuery(connection.value, sql, paramValues)
  return result.ok
    ? c.json({ ok: true, fields: toContractFields(result.data.fields), rows: result.data.rows })
    : c.json({ ok: false, error: result.error })
})
