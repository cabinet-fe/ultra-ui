/**
 * `/ai-db-api` REST 封装（vite proxy `/ai-db-api` → 参考服务 `/ai-db`，见 vite.config.ts）。
 * 9 个端点对应 server/ai-db.ts 的 Hono 子应用；契约类型镜像服务端定义，
 * 不直接 import 服务端模块（hono 只在参考服务侧使用，不进前端产物）。
 */

/** REST 基址 */
const AI_DB_API = '/ai-db-api'

/** 列类型全集（镜像 server/ai-db.ts 的 COLUMN_TYPES） */
export const COLUMN_TYPES = ['string', 'number', 'boolean', 'date'] as const
export type ColumnType = (typeof COLUMN_TYPES)[number]

export interface ColumnDef {
  name: string
  type: ColumnType
  /** 主键列（一表至多一个，隐含非空 + 行值唯一） */
  primaryKey?: boolean
  /** 可空（默认不可空） */
  nullable?: boolean
  /** 备注 */
  comment?: string
}

export interface TableDef {
  name: string
  columns: ColumnDef[]
}

/** 关系类型全集（镜像 server/ai-db.ts 的 RELATIONSHIP_TYPES） */
export const RELATIONSHIP_TYPES = ['1-1', '1-n', 'n-n'] as const
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number]

export interface RelationshipEndpoint {
  table: string
  column: string
}

export interface RelationshipDef {
  type: RelationshipType
  from: RelationshipEndpoint
  to: RelationshipEndpoint
}

/** 行数据：列名 → 标量值（null = 空） */
export type RowValue = string | number | boolean | null
export type RowData = Record<string, RowValue>

/** 聚合函数全集（镜像 server/ai-db.ts 的 AGGREGATION_FUNCS） */
export const AGGREGATION_FUNCS = ['count', 'sum', 'avg', 'min', 'max'] as const
export type AggregationFunc = (typeof AGGREGATION_FUNCS)[number]

export interface AggregationSpec {
  func: AggregationFunc
  /** 聚合列（count 可省略：统计行数） */
  column?: string
}

export interface StatsQuery {
  table: string
  /** 受控等值过滤（列名 → 值，null 匹配空值） */
  filter?: Record<string, RowValue>
  /** 分组维度列（缺省即整表一组） */
  groupBy?: string[]
  aggregations: AggregationSpec[]
}

export interface StatsGroup {
  /** 分组维度值（无 groupBy 时为空对象） */
  key: Record<string, RowValue>
  count: number
  /** 聚合结果：键为 count 或 `${func}__${column}` */
  values: Record<string, number | null>
}

export interface StatsResult {
  groups: StatsGroup[]
  /** 命中过滤条件的明细行 */
  rows: RowData[]
}

/** 响应壳：ok 时携带数据字段，失败时 error.message 透出给调用方（工具错误会回灌模型） */
interface DbEnvelope {
  ok: boolean
  error?: { code?: string; message?: string }
}

/** 统一请求：非 2xx 或 ok=false 时抛出服务端 error.message（缺省回退 HTTP 状态码） */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  let data: (DbEnvelope & Partial<T>) | null = null
  try {
    response = await fetch(`${AI_DB_API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init
    })
    data = (await response.json().catch(() => null)) as (DbEnvelope & Partial<T>) | null
  } catch (reason) {
    // fetch 主动 abort 时保留 AbortError（对话框架按中断处理，不当业务错误回灌）
    if (reason instanceof DOMException && reason.name === 'AbortError') throw reason
    throw new Error('AI 建模内存库不可达，请确认参考服务已启动（bun run server）')
  }
  if (!response.ok || !data?.ok) {
    const message = data?.error?.message
    throw new Error(message && message !== '' ? message : `请求失败（HTTP ${response.status}）`)
  }
  // ok 响应的外层形状由各端点函数声明，这里只剥壳透传
  return data as T
}

function jsonBody(body: unknown, method: 'POST' | 'PUT' = 'PUT'): RequestInit {
  return { method, body: JSON.stringify(body) }
}

/** GET /tables — 全部表（含列定义） */
export function getTables(signal?: AbortSignal) {
  return request<{ tables: TableDef[] }>('/tables', { signal })
}

/** POST /tables — 新建表（表名不可重复） */
export function createTable(table: TableDef, signal?: AbortSignal) {
  return request<{ table: TableDef }>('/tables', {
    method: 'POST',
    body: JSON.stringify(table),
    signal
  })
}

/** PUT /tables/:name — 更新表定义（table.name 不同于 name 即改名，级联更新关系引用） */
export function updateTable(name: string, table: TableDef, signal?: AbortSignal) {
  return request<{ table: TableDef; prunedRelationships: number }>(
    `/tables/${encodeURIComponent(name)}`,
    { ...jsonBody(table), signal }
  )
}

/** DELETE /tables/:name — 删除表（连带行数据与引用它的关系） */
export function deleteTable(name: string, signal?: AbortSignal) {
  return request<{ removedRelationships: number }>(`/tables/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    signal
  })
}

/** POST /tables/:name/rows — 批量插入行数据 */
export function insertRows(name: string, rows: RowData[], signal?: AbortSignal) {
  return request<{ inserted: number; total: number }>(`/tables/${encodeURIComponent(name)}/rows`, {
    ...jsonBody({ rows }, 'POST'),
    signal
  })
}

/** GET /tables/:name/rows — 查询行数据（受控等值过滤，null 匹配空值） */
export function queryRows(name: string, filter?: Record<string, RowValue>, signal?: AbortSignal) {
  const query =
    filter && Object.keys(filter).length > 0
      ? `?filter=${encodeURIComponent(JSON.stringify(filter))}`
      : ''
  return request<{ rows: RowData[]; total: number }>(
    `/tables/${encodeURIComponent(name)}/rows${query}`,
    { signal }
  )
}

/** POST /stats — 统计分析（过滤 + 分组维度 + 聚合，返回分组序列与明细行） */
export function analyzeStats(query: StatsQuery, signal?: AbortSignal) {
  return request<StatsResult>('/stats', { ...jsonBody(query, 'POST'), signal })
}

/** GET /relationships — 全部实体关系 */
export function getRelationships(signal?: AbortSignal) {
  return request<{ relationships: RelationshipDef[] }>('/relationships', { signal })
}

/** PUT /relationships — 全量覆盖实体关系（两端引用的表/列必须已存在） */
export function replaceRelationships(relationships: RelationshipDef[], signal?: AbortSignal) {
  return request<{ relationships: RelationshipDef[] }>('/relationships', {
    ...jsonBody({ relationships }),
    signal
  })
}
