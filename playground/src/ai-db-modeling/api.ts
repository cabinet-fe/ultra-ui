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
  /** 所属中文业务模块名（如「商品」「采购」「会员」），缺省即未分组 */
  module?: string
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

/** 展示列：name 原列名，label 中文标题（comment 缺省回退列名） */
export interface DisplayColumn {
  name: string
  label: string
}

/** 行查询展示投影（镜像 server/ai-db.ts）：columns 不含主键列，外键列的值为关联名称 */
export interface QueryDisplay {
  columns: DisplayColumn[]
  rows: RowData[]
}

/** 统计展示投影（镜像 server/ai-db.ts）：中文标签 + 分组展示行 + 明细行投影 */
export interface StatsDisplay {
  /** 维度列名 → 中文标题 */
  dimensionLabels: Record<string, string>
  /** 聚合键（count / sum__列 …）→ 中文标签 */
  aggregationLabels: Record<string, string>
  /** 每组一行的展示对象，键为中文（维度标题 + 聚合标签），维度值为外键时已解析 */
  groupRows: RowData[]
  /** 明细行的展示投影 */
  detail: QueryDisplay
}

/** GET /tables/:name/rows 响应（display 为用户可见展示投影） */
export interface RowsResponse {
  rows: RowData[]
  total: number
  display: QueryDisplay
}

/** POST /stats 响应（聚合在服务端完成，display 为用户可见展示投影） */
export interface StatsResponse extends StatsResult {
  display: StatsDisplay
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

/** queryData 入参：明细查询（table + filter）或聚合查询（再带 groupBy / aggregations） */
export interface QueryDataParams {
  table: string
  /** 受控等值过滤（列名 → 值，null 匹配空值） */
  filter?: Record<string, RowValue>
  /** 分组维度列 */
  groupBy?: string[]
  /** 聚合列表（聚合计算在服务端完成） */
  aggregations?: AggregationSpec[]
}

/**
 * 查询数据：带 groupBy / aggregations 时走 `POST /stats`（服务端聚合，返回 StatsResponse），
 * 否则走 `GET /tables/:name/rows`（明细查询，返回 RowsResponse）。前端不做任何聚合计算。
 */
export function queryData(
  params: QueryDataParams,
  signal?: AbortSignal
): Promise<RowsResponse | StatsResponse> {
  if (params.groupBy?.length || params.aggregations?.length) {
    const query: StatsQuery = {
      table: params.table,
      filter: params.filter,
      groupBy: params.groupBy,
      aggregations: params.aggregations ?? []
    }
    return request<StatsResponse>('/stats', { ...jsonBody(query, 'POST'), signal })
  }
  const search =
    params.filter && Object.keys(params.filter).length > 0
      ? `?filter=${encodeURIComponent(JSON.stringify(params.filter))}`
      : ''
  return request<RowsResponse>(`/tables/${encodeURIComponent(params.table)}/rows${search}`, {
    signal
  })
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
