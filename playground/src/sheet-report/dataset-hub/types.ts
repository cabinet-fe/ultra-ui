import type {
  DatasetCatalogItem,
  DatasetField,
  DatasetRecords,
  ParamValues,
  QueryParamDef,
  QueryParamOption,
  QueryParamType
} from '@veltra/sheet'

// 数据集模型类型（DatasetCatalogItem / DatasetField / DatasetRecords / 查询参数族）
// 单一事实源在 @veltra/sheet 的 report 模块；本 mock hub 仅 re-export。
export type {
  DatasetCatalogItem,
  DatasetField,
  DatasetRecords,
  ParamValues,
  QueryParamDef,
  QueryParamOption,
  QueryParamType
} from '@veltra/sheet'

/** 数据连接类型（mock hub 暂留 'api'；产品化连接器收敛为 mysql / postgresql） */
export type ConnectionType = 'mysql' | 'postgresql' | 'api'

/** 数据连接 */
export interface DataConnection {
  id: string
  label: string
  type: ConnectionType
  host: string
  port: number
  database: string
  username: string
  password: string
}

/** @deprecated 别名，兼容旧引用 */
export type DatasetQueryParamValues = ParamValues

/** 表列 schema */
export interface TableColumn {
  name: string
  label: string
  type: 'string' | 'number' | 'date'
}

/** Mock 库表 schema */
export interface TableSchema {
  name: string
  label: string
  columns: TableColumn[]
}

/** 数据集定义 = 连接 + SQL */
export interface DatasetDef {
  id: string
  label: string
  connectionId: string
  sql: string
  /** 参数元数据覆盖（label / 类型 / 默认值 / 选项） */
  paramOverrides?: Record<string, Partial<Omit<QueryParamDef, 'id'>>>
  /** 字段中文名覆盖（name → label） */
  fieldOverrides?: Record<string, Partial<Pick<DatasetField, 'label'>>>
}

/** describe(sql) 结果 */
export interface SqlDescribeResult {
  fields: DatasetField[]
  params: QueryParamDef[]
  error?: string
}

/** query 执行错误 */
export interface SqlExecuteError {
  error: string
}

export type DataHubListener = () => void

/** Data Hub 统一访问接口 */
export interface DataHub {
  readonly connections: DataConnection[]
  readonly datasets: DatasetDef[]
  readonly tables: TableSchema[]

  subscribe(listener: DataHubListener): () => void

  getConnection(id: string): DataConnection | undefined
  addConnection(conn: DataConnection): void
  updateConnection(id: string, patch: Partial<DataConnection>): void
  removeConnection(id: string): void
  testConnection(id: string): Promise<{ ok: boolean; message: string }>

  getDataset(id: string): DatasetDef | undefined
  addDataset(dataset: DatasetDef): void
  updateDataset(id: string, patch: Partial<DatasetDef>): void
  removeDataset(id: string): void

  describe(
    sql: string,
    paramOverrides?: DatasetDef['paramOverrides'],
    fieldOverrides?: DatasetDef['fieldOverrides']
  ): SqlDescribeResult
  query(datasetId: string, values?: ParamValues): Record<string, unknown>[] | SqlExecuteError

  getCatalog(): DatasetCatalogItem[]
  getRecords(values?: ParamValues): DatasetRecords

  getParamValues(): ParamValues
  setParamValues(patch: Partial<ParamValues>): void
  resetParamValues(): void
  getQueryParams(datasetIds?: readonly string[]): QueryParamDef[]
}

/** @deprecated 使用 QueryParamDef */
export type DatasetQueryParam = QueryParamDef

/** @deprecated 使用 QueryParamOption */
export type DatasetQueryParamOption = QueryParamOption

/** @deprecated 使用 QueryParamType */
export type DatasetQueryParamType = QueryParamType

/** @deprecated 使用 DataHub */
export interface MockDataHub {
  readonly catalog: DatasetCatalogItem[]
  readonly queryParams: QueryParamDef[]
  getParamValues(): ParamValues
  setParamValues(patch: Partial<ParamValues>): void
  resetParamValues(): void
  getRecords(): DatasetRecords
}
