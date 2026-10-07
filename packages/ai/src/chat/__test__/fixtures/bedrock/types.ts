/**
 * Vendored from bedrock web/src/api（自包含快照，避免测试依赖仓库外绝对路径）。
 * 上游更新时同步此处；依赖面：@veltra/ai 类型 + ./http + ./types。
 */
/**
 * bedrock web 端 API 类型的最小子集（仅本仿真测试消费的 PageResult）。
 * 来源：bedrock 仓 web/src/api/types.ts，同步以字段演化为准。
 */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
