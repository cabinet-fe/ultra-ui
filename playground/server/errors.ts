/**
 * 契约业务错误码（ADR-0003 决策 3）：
 * - 传输层错误（请求形状不合法 / 不支持的连接类型）用 HTTP 状态码（400）；
 * - 业务错误（连接失败 / SQL 报错 / 参数缺失）一律 `200 + { ok: false, error: { code, message } }`。
 */
export const ERROR_CODES = {
  /** 请求体 / 连接对象形状不合法（→ HTTP 400） */
  INVALID_REQUEST: 'INVALID_REQUEST',
  /** 连接类型不是 mysql / postgresql（→ HTTP 400） */
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  /** 数据库不可达 / 认证失败 / 连接被拒（→ 200 业务错误） */
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  /** SQL 语法或执行报错（→ 200 业务错误） */
  SQL_ERROR: 'SQL_ERROR',
  /** SQL 引用了 `${param}` 但请求 values 未提供对应值（→ 200 业务错误） */
  MISSING_PARAM: 'MISSING_PARAM'
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
