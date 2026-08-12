import type { CellAddress, CellStylePatch } from '@veltra/sheet-core'

/** 报表绑定扩展方向 */
export type ReportExpand = 'down' | 'right' | 'none'

/** 报表绑定聚合方式 */
export type ReportAggregate = 'list' | 'group' | 'sum' | 'avg' | 'count' | 'max' | 'min'

/** 报表绑定排序 */
export type ReportSort = 'asc' | 'desc' | 'none'

/**
 * 设计器预设标签：引擎不读，仅用于 UI 展示与一键切换。
 * 缺失时 Action Pill 显示「自定义」。
 */
export type ReportPreset = 'groupHeader' | 'detail' | 'subtotal' | 'grandTotal' | 'cross'

/** 条件样式比较运算符 */
export type ConditionalOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between' | 'contains'

/** 条件样式规则：命中后叠加 CellStyle 增量 */
export interface ConditionalRule {
  operator: ConditionalOperator
  /** 单值比较用标量；`between` 用 `[min, max]`（含端点） */
  value: unknown
  style: CellStylePatch
  /** 求值字段；缺省取绑定格自身字段 */
  field?: string
  /** 作用范围；缺省 `'cell'` */
  scope?: 'cell' | 'row'
}

/** 设计格上的报表绑定（存于 Cell Meta namespace `report`） */
export interface ReportBinding {
  dataset: string
  field: string
  expand: ReportExpand
  aggregate: ReportAggregate
  /** 纵向从属父格：本格数据受该格当前行实例的值约束 */
  rowParent?: CellAddress
  /** 横向从属父格：本格数据受该格当前列实例的值约束 */
  colParent?: CellAddress
  /** 扩展实例是否合并为单个单元格；缺省 true */
  mergeSpan?: boolean
  /** 分组/明细排序；缺省视为 none */
  sort?: ReportSort
  /** 条件样式规则（按数组顺序优先级依次求值并合并样式） */
  conditionalRules?: ConditionalRule[]
  /** 设计器预设；引擎不读 */
  preset?: ReportPreset
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
 * 全局数据集目录项（catalog）：系统里可用的数据集定义。
 * 与「本报表选用哪些」无关。
 */
export interface DatasetCatalogItem {
  id: string
  label: string
  fields: DatasetField[]
}

/** Dataset id → 行记录（渲染 Filled Report 用） */
export type DatasetRecords = Record<string, Record<string, unknown>[]>

/** 查询参数控件类型 */
export type QueryParamType = 'text' | 'number' | 'date' | 'date-range' | 'select'

/** 下拉选项 */
export interface QueryParamOption {
  label: string
  value: string
}

/** 查询参数定义（从 SQL `${param}` 提取，可在数据集编辑器覆盖元数据） */
export interface QueryParamDef {
  id: string
  label: string
  type: QueryParamType
  defaultValue: unknown
  options?: QueryParamOption[]
}

/** 运行时参数值 */
export type ParamValues = Record<string, unknown>
