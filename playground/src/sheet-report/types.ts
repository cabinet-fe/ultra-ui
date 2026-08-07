import type { CellAddress } from '@veltra/sheet-core'

/** 报表绑定聚合方式（list = select） */
export type ReportAggregate = 'select' | 'group' | 'sum'

/** 报表绑定扩展方向 */
export type ReportExpand = 'down' | 'none'

/** 左父格：无 / 默认规则 / 指定设计地址 */
export type ReportLeftParent = 'none' | 'default' | CellAddress

/** 设计格上的报表绑定（存于 Cell Meta namespace `report`） */
export interface ReportBinding {
  dataset: string
  field: string
  aggregate: ReportAggregate
  expand: ReportExpand
  leftParent: ReportLeftParent
}

/** Mock 数据集字段 */
export interface DatasetField {
  name: string
  label: string
  type: 'string' | 'number' | 'date'
}

/** Mock 数据集 */
export interface MockDataset {
  id: string
  label: string
  fields: DatasetField[]
}

/** Dataset id → 行记录（渲染 Filled Report 用） */
export type DatasetRecords = Record<string, Record<string, unknown>[]>
