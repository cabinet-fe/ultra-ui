import type { DatasetCatalogItem, DatasetRecords } from '../types'

/** 查询参数控件类型 */
export type DatasetQueryParamType = 'date' | 'select' | 'number'

/** 下拉选项 */
export interface DatasetQueryParamOption {
  label: string
  value: string
}

/** 数据集查询参数定义（模拟 SQL 参数） */
export interface DatasetQueryParam {
  id: string
  label: string
  type: DatasetQueryParamType
  defaultValue: unknown
  options?: DatasetQueryParamOption[]
  /** 影响的数据集 id；缺省表示全局参数 */
  appliesTo?: string[]
}

/** 运行时参数值 */
export type DatasetQueryParamValues = Record<string, unknown>

/** Mock Data Hub 统一访问接口 */
export interface MockDataHub {
  readonly catalog: DatasetCatalogItem[]
  readonly queryParams: DatasetQueryParam[]
  getParamValues(): DatasetQueryParamValues
  setParamValues(patch: Partial<DatasetQueryParamValues>): void
  resetParamValues(): void
  getRecords(): DatasetRecords
}
