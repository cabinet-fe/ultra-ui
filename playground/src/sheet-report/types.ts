/** 报表绑定聚合方式 */
export type ReportAggregate = 'select' | 'group' | 'sum'

/** 报表绑定扩展方向 */
export type ReportExpand = 'down' | 'none'

/** 设计格上的报表绑定（存于 Cell Meta namespace `report`） */
export interface ReportBinding {
  dataset: string
  field: string
  aggregate: ReportAggregate
  expand: ReportExpand
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
