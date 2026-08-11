import type { DatasetField, ParamValues } from './types'

/** 数据连接类型（ADR-0003 决策 3：收敛为 MySQL / PostgreSQL） */
export type ConnectionType = 'mysql' | 'postgresql'

/** 各连接类型的默认端口 */
export const DEFAULT_CONNECTION_PORTS: Record<ConnectionType, number> = {
  mysql: 3306,
  postgresql: 5432
}

/**
 * 切换连接类型时解析端口：若当前端口仍是上一类型的默认值（或 0），则切到新类型默认端口；
 * 用户已自定义的端口保持不变。
 */
export function resolvePortOnTypeChange(
  prevType: ConnectionType,
  nextType: ConnectionType,
  currentPort: number
): number {
  if (prevType === nextType) return currentPort
  if (currentPort === DEFAULT_CONNECTION_PORTS[prevType] || currentPort === 0) {
    return DEFAULT_CONNECTION_PORTS[nextType]
  }
  return currentPort
}

/**
 * 数据连接（纯序列化对象，仅驻留内存）。
 * 凭据持久化与安全存储由下游负责（ADR-0003 决策 4）。
 */
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

/** 业务错误（`200 + { ok: false, error }`）或客户端传输层错误 */
export interface ConnectorError {
  code: string
  message: string
}

/** 统一结果：成功携带 data；失败携带 error（连接器不抛异常，调用方只处理一条错误路径） */
export type Result<T> = { ok: true; data: T } | { ok: false; error: ConnectorError }

/** query 成功结果：字段 schema + 行记录（契约 `{ fields, rows }` 归一化后） */
export interface QueryResult {
  fields: DatasetField[]
  rows: Record<string, unknown>[]
}

/**
 * 数据连接器（词汇表：Data Connector）：test / describe / query 三方法镜像 HTTP 契约三端点。
 * 真实数据库访问由下游后端以任意语言实现（BYO）。
 */
export interface DataConnector {
  test(connection: DataConnection): Promise<Result<void>>
  describe(connection: DataConnection, sql: string): Promise<Result<DatasetField[]>>
  query(connection: DataConnection, sql: string, values: ParamValues): Promise<Result<QueryResult>>
}

export interface CreateHttpConnectorOptions {
  /** 契约端点前缀，如 `https://api.example.com/report`；三端点 = `{endpoint}/test|describe|query`（无版本段） */
  endpoint: string
}

// ---- HTTP 契约响应形状（ADR-0003 决策 3）----
// 传输层错误用 HTTP 状态码；业务错误一律 `200 + { ok: false, error }`。

/** 契约字段 schema：`{ name, type? }`（type 缺省视为 string） */
interface ContractField {
  name: string
  type?: DatasetField['type']
}

interface ContractErrorBody {
  ok: false
  error: ConnectorError
}

type TestResponseBody = { ok: true } | ContractErrorBody

type DescribeResponseBody = { ok: true; fields: ContractField[] } | ContractErrorBody

type QueryResponseBody =
  | { ok: true; fields: ContractField[]; rows: Record<string, unknown>[] }
  | ContractErrorBody

/** 客户端错误：网络不可达 / 非 2xx / 响应不可解析（业务错误由服务端 200 透传） */
function badResponse(message: string): Result<never> {
  return { ok: false, error: { code: 'BAD_RESPONSE', message } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toConnectorError(value: unknown): ConnectorError {
  if (isRecord(value)) {
    const { code, message } = value
    if (typeof code === 'string' && typeof message === 'string') {
      return { code, message }
    }
  }
  return { code: 'SERVER_ERROR', message: '服务端返回未知错误' }
}

/** 契约字段 → 内核 DatasetField（label 缺省回退 name，type 缺省 string） */
function normalizeField(field: ContractField): DatasetField {
  return { name: field.name, label: field.name, type: field.type ?? 'string' }
}

/** 校验并归一化契约 fields；形状不合法返回 null */
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
 * 创建 HTTP 数据连接器：三方法对应 `POST {endpoint}/test|describe|query`。
 * - 请求体 JSON 序列化，`Content-Type: application/json`；
 * - 网络异常与非 2xx（传输层错误）折叠为 `{ ok: false, error }`，不抛异常；
 * - 业务错误（连接失败 / SQL 报错）由服务端以 `200 + { ok: false, error: { code, message } }` 返回并原样透传；
 * - `describe` / `query` 的 fields 归一化为内核 `DatasetField`（label 回退 name，type 缺省 string）。
 */
export function createHttpConnector({ endpoint }: CreateHttpConnectorOptions): DataConnector {
  async function postJson<TBody>(path: string, body: unknown): Promise<Result<TBody>> {
    let response: Response
    try {
      response = await fetch(`${endpoint}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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
      const result = await postJson<TestResponseBody>('/test', { connection })
      if (!result.ok) return result
      if (result.data.ok === true) return { ok: true, data: undefined }
      return { ok: false, error: toConnectorError(result.data.error) }
    },

    async describe(connection, sql) {
      const result = await postJson<DescribeResponseBody>('/describe', { connection, sql })
      if (!result.ok) return result
      if (result.data.ok !== true) {
        return { ok: false, error: toConnectorError(result.data.error) }
      }
      const fields = normalizeFields(result.data.fields)
      if (!fields) return badResponse('describe 响应缺少合法的 fields 数组')
      return { ok: true, data: fields }
    },

    async query(connection, sql, values) {
      const result = await postJson<QueryResponseBody>('/query', { connection, sql, values })
      if (!result.ok) return result
      if (result.data.ok !== true) {
        return { ok: false, error: toConnectorError(result.data.error) }
      }
      const fields = normalizeFields(result.data.fields)
      if (!fields) return badResponse('query 响应缺少合法的 fields 数组')
      if (!Array.isArray(result.data.rows)) return badResponse('query 响应缺少 rows 数组')
      return { ok: true, data: { fields, rows: result.data.rows } }
    }
  }
}
