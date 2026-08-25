/** 参考服务错误码：请求形状不合法用 HTTP 400 */
export const ERROR_CODES = { INVALID_REQUEST: 'INVALID_REQUEST' } as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export interface ConnectorError {
  code: ErrorCode
  message: string
}
