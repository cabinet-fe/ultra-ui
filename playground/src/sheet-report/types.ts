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

/**
 * 字段 schema（来自数据集配置，非运行时推断）。
 * - `name`：绑定键（写入 Binding.field，英文标识）
 * - `label`：中文显示名（字段面板与占位可读名）
 */
export interface DatasetField {
  name: string
  label: string
  type: 'string' | 'number' | 'date'
}

/**
 * 全局数据集目录项（catalog）：系统里可用的数据集定义（demo mock 源）。
 * 与「本报表选用哪些」无关。
 */
export interface DatasetCatalogItem {
  id: string
  label: string
  fields: DatasetField[]
}

/** @deprecated 使用 DatasetCatalogItem；保留别名以免测试/旧引用断裂 */
export type MockDataset = DatasetCatalogItem

/**
 * 本报表对某数据集的选用与字段配置。
 * 从 catalog 拷贝；可改显示名与字段中文 label；`selected` 控制是否进入字段面板。
 */
export interface ReportDatasetConfig {
  id: string
  /** 数据集显示名（可覆盖 catalog） */
  label: string
  /** 是否选用到本报表（出现在左侧字段面板） */
  selected: boolean
  /** 字段 schema 配置（可编辑中文 label；name 为绑定键） */
  fields: DatasetField[]
  rowCount: number
}

/** Dataset id → 行记录（渲染 Filled Report 用） */
export type DatasetRecords = Record<string, Record<string, unknown>[]>
