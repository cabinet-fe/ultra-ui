import type {
  DataConnection,
  DataConnector,
  DatasetField,
  ParamValues,
  QueryResult,
  ReportTemplate,
  Result
} from '@veltra/sheet'

const API_BASE = '/report-api'

export interface WorkspaceDataset {
  id: string
  connectionId: string
  label: string
  sql: string
  paramOverrides?: Record<string, unknown>
  fieldOverrides?: Record<string, unknown>
}

export interface WorkspaceData {
  connections: DataConnection[]
  datasets: WorkspaceDataset[]
}

export interface ReportTemplateSummary {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface ReportTemplateRecord extends ReportTemplateSummary {
  template: ReportTemplate
}

interface ApiError {
  ok: false
  error: { code: string; message: string }
}

async function readJson<T>(response: Response): Promise<T> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    throw new Error('响应不是合法 JSON')
  }
  if (typeof payload === 'object' && payload !== null && 'ok' in payload && payload.ok === false) {
    throw new Error((payload as ApiError).error.message)
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return payload as T
}

export async function fetchWorkspace(): Promise<WorkspaceData> {
  const payload = await readJson<{ ok: true } & WorkspaceData>(await fetch(`${API_BASE}/workspace`))
  return { connections: payload.connections ?? [], datasets: payload.datasets ?? [] }
}

export async function saveWorkspace(data: WorkspaceData): Promise<void> {
  await readJson<{ ok: true }>(
    await fetch(`${API_BASE}/workspace`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  )
}

export async function listReportTemplates(): Promise<ReportTemplateSummary[]> {
  const payload = await readJson<{ ok: true; items: ReportTemplateSummary[] }>(
    await fetch(`${API_BASE}/templates`)
  )
  return payload.items ?? []
}

export async function fetchReportTemplate(id: string): Promise<ReportTemplateRecord> {
  const payload = await readJson<{ ok: true; item: ReportTemplateRecord }>(
    await fetch(`${API_BASE}/templates/${encodeURIComponent(id)}`)
  )
  return payload.item
}

/**
 * 宿主 `resolveTemplate(ref)`：按模板 id 从模板库取回 `ReportTemplate`。
 * 失败抛可读错误（供查看器 / 设计器预览停留当前报并提示）。
 */
export async function resolveReportTemplate(ref: string): Promise<ReportTemplate> {
  try {
    const record = await fetchReportTemplate(ref)
    return record.template
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`无法解析报表模板「${ref}」：${message}`)
  }
}

export async function createReportTemplateRecord(
  name: string,
  template: ReportTemplate
): Promise<ReportTemplateRecord> {
  const payload = await readJson<{ ok: true; item: ReportTemplateRecord }>(
    await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, template })
    })
  )
  return payload.item
}

export async function updateReportTemplateRecord(
  id: string,
  patch: { name?: string; template?: ReportTemplate }
): Promise<ReportTemplateRecord> {
  const payload = await readJson<{ ok: true; item: ReportTemplateRecord }>(
    await fetch(`${API_BASE}/templates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    })
  )
  return payload.item
}

export async function deleteReportTemplateRecord(id: string): Promise<void> {
  await readJson<{ ok: true }>(
    await fetch(`${API_BASE}/templates/${encodeURIComponent(id)}`, { method: 'DELETE' })
  )
}

/** 从设计器模板提取工作区数据集（不含连接对象） */
export function extractWorkspaceDatasets(template: ReportTemplate | undefined): WorkspaceDataset[] {
  if (!template?.datasets?.length) return []
  return template.datasets.map((dataset) => ({
    id: dataset.id,
    connectionId: dataset.connection.id,
    label: dataset.label,
    sql: dataset.sql,
    ...(dataset.paramOverrides ? { paramOverrides: dataset.paramOverrides } : {}),
    ...(dataset.fieldOverrides ? { fieldOverrides: dataset.fieldOverrides } : {})
  }))
}

/** 将工作区数据集合并进连接列表（模板内嵌连接仅作缺省追加） */
export function mergeConnectionsFromTemplate(
  template: ReportTemplate,
  existing: DataConnection[]
): DataConnection[] {
  const map = new Map(existing.map((item) => [item.id, item]))
  for (const dataset of template.datasets ?? []) {
    const connection = dataset.connection
    if (!map.has(connection.id)) {
      map.set(connection.id, { ...connection })
    }
  }
  return [...map.values()]
}

export function serializeTemplateDocument(
  id: string | null,
  name: string,
  template: ReportTemplate | undefined
): string {
  return JSON.stringify({ id, name, template: template ?? null })
}

export interface HubConnectorContext {
  /** 已持久化到后端的连接 id 集合 */
  isConnectionSaved: (connectionId: string) => boolean
  /** 按 connectionId + sql 查找已持久化的数据集 id */
  findDatasetId: (connectionId: string, sql: string) => string | undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toConnectorError(value: unknown): { code: string; message: string } {
  if (isRecord(value)) {
    const { code, message } = value
    if (typeof code === 'string' && typeof message === 'string') {
      return { code, message }
    }
  }
  return { code: 'SERVER_ERROR', message: '服务端返回未知错误' }
}

function badResponse(message: string): Result<never> {
  return { ok: false, error: { code: 'BAD_RESPONSE', message } }
}

interface ContractField {
  name: string
  label?: string
  type?: DatasetField['type']
}

function normalizeField(field: ContractField): DatasetField {
  return { name: field.name, label: field.label ?? field.name, type: field.type ?? 'string' }
}

function normalizeFields(fields: unknown): DatasetField[] | null {
  if (!Array.isArray(fields)) return null
  const normalized: DatasetField[] = []
  for (const field of fields) {
    if (!isRecord(field) || typeof field.name !== 'string') return null
    normalized.push(normalizeField(field as unknown as ContractField))
  }
  return normalized
}

/**
 * playground 专用连接器：已入库的连接 / 数据集走 Hub 端点（不传凭据与 SQL），
 * 草稿连接仍回落通用契约端点。
 */
export function createHubConnector(
  context: HubConnectorContext,
  endpoint = API_BASE
): DataConnector {
  async function postJson<TBody>(path: string, body?: unknown): Promise<Result<TBody>> {
    let response: Response
    try {
      response = await fetch(`${endpoint}${path}`, {
        method: 'POST',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
      })
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : String(error)
        }
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        error: { code: `HTTP_${response.status}`, message: `请求失败（HTTP ${response.status}）` }
      }
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      return badResponse('响应不是合法 JSON')
    }
    if (!isRecord(payload)) return badResponse('响应不是 JSON 对象')
    return { ok: true, data: payload as TBody }
  }

  return {
    async test(connection) {
      if (context.isConnectionSaved(connection.id)) {
        const result = await postJson<{ ok: true } | ApiError>(
          `/connections/${encodeURIComponent(connection.id)}/test`
        )
        if (!result.ok) return result
        if (result.data.ok === true) return { ok: true, data: undefined }
        return { ok: false, error: toConnectorError((result.data as ApiError).error) }
      }

      const result = await postJson<{ ok: true } | ApiError>('/test', { connection })
      if (!result.ok) return result
      if (result.data.ok === true) return { ok: true, data: undefined }
      return { ok: false, error: toConnectorError((result.data as ApiError).error) }
    },

    async describe(connection, sql) {
      const datasetId = context.findDatasetId(connection.id, sql)
      const result = datasetId
        ? await postJson<{ ok: true; fields: ContractField[] } | ApiError>(
            `/datasets/${encodeURIComponent(datasetId)}/describe`
          )
        : await postJson<{ ok: true; fields: ContractField[] } | ApiError>('/describe', {
            connection,
            sql
          })
      if (!result.ok) return result
      if (result.data.ok !== true) {
        return { ok: false, error: toConnectorError((result.data as ApiError).error) }
      }
      const fields = normalizeFields(result.data.fields)
      if (!fields) return badResponse('describe 响应缺少合法的 fields 数组')
      return { ok: true, data: fields }
    },

    async query(connection, sql, values: ParamValues): Promise<Result<QueryResult>> {
      const datasetId = context.findDatasetId(connection.id, sql)
      const result = datasetId
        ? await postJson<
            { ok: true; fields: ContractField[]; rows: Record<string, unknown>[] } | ApiError
          >(`/datasets/${encodeURIComponent(datasetId)}/query`, { values })
        : await postJson<
            { ok: true; fields: ContractField[]; rows: Record<string, unknown>[] } | ApiError
          >('/query', { connection, sql, values })
      if (!result.ok) return result
      if (result.data.ok !== true) {
        return { ok: false, error: toConnectorError((result.data as ApiError).error) }
      }
      const fields = normalizeFields(result.data.fields)
      if (!fields) return badResponse('query 响应缺少合法的 fields 数组')
      if (!Array.isArray(result.data.rows)) return badResponse('query 响应缺少 rows 数组')
      return { ok: true, data: { fields, rows: result.data.rows } }
    }
  }
}
