import type { SheetSnapshot } from '@veltra/sheet-core'

import { REPORT_META_NAMESPACE } from './binding'
import type { DataConnection, DataConnector, Result } from './connector'
import { buildParamDefs } from './params'
import type {
  DatasetField,
  DatasetRecords,
  ParamValues,
  QueryParamDef,
  ReportBinding
} from './types'

/**
 * 模板内嵌的数据集定义（Dataset = Data Connection + SQL，ADR-0002 决策 2）。
 * 与 playground DatasetDef 同构，connectionId 替换为内嵌的完整连接对象。
 */
export interface ReportDatasetDef {
  id: string
  label: string
  connection: DataConnection
  sql: string
  /** 参数元数据覆盖（label / 类型 / 默认值 / 选项） */
  paramOverrides?: Record<string, Partial<Omit<QueryParamDef, 'id'>>>
  /** 字段中文名覆盖（name → label）；查看器不消费，随模板序列化往返供设计器还原 */
  fieldOverrides?: Record<string, Partial<Pick<DatasetField, 'label'>>>
}

/** 当前支持的报表模板版本（ADR-0005 决策 4） */
export const REPORT_TEMPLATE_VERSION = 1

/** 模板版本不兼容时抛出 */
export class IncompatibleTemplateVersionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IncompatibleTemplateVersionError'
  }
}

/**
 * 自包含 Report Template：SheetSnapshot + 内嵌数据集定义 + 版本段。
 * 查看器仅凭 `template` + `connector` 即可完成「参数提取 → 取数 → 展开渲染」闭环；
 * 模板可 JSON 序列化流转（凭据随之流转，持久化与安全存储由下游负责，ADR-0003 决策 4）。
 *
 * 注意：`Sheet.snapshot()` 不产生 `datasets` / `version` 字段，经 `restore()`/`snapshot()` 往返会丢失，
 * 由设计器 `getTemplate()` 在吐出快照时重新附加。
 */
export interface ReportTemplate extends SheetSnapshot {
  /** 模板结构版本；当前值为 `REPORT_TEMPLATE_VERSION` */
  version?: number
  datasets?: ReportDatasetDef[]
}

/** 载入模板前校验版本：缺失或高于当前支持版本时抛可读错误 */
export function assertCompatibleTemplateVersion(template: ReportTemplate): void {
  if (template.version === undefined) {
    throw new IncompatibleTemplateVersionError(
      '报表模板缺少 version 字段，请在设计器中重建模板后重试'
    )
  }
  if (template.version > REPORT_TEMPLATE_VERSION) {
    throw new IncompatibleTemplateVersionError(
      `报表模板版本 ${template.version} 高于当前支持的版本 ${REPORT_TEMPLATE_VERSION}，请升级组件库后重试`
    )
  }
}

/** 由工作簿快照构造带版本段的 Report Template */
export function createReportTemplate(
  snapshot: SheetSnapshot,
  datasets?: ReportDatasetDef[]
): ReportTemplate {
  return { ...snapshot, version: REPORT_TEMPLATE_VERSION, datasets }
}

/** 读取模板内嵌的数据集定义（旧模板未内嵌时回退空数组） */
export function getTemplateDatasets(template: ReportTemplate): ReportDatasetDef[] {
  return Array.isArray(template.datasets) ? template.datasets : []
}

/** 模板实际绑定的数据集 id（按绑定在 meta 中的出现顺序去重；绑定即真相，ADR-0002 决策 4） */
export function getBoundDatasetIds(template: SheetSnapshot): string[] {
  const ids: string[] = []
  for (const item of template.meta ?? []) {
    if (item.namespace !== REPORT_META_NAMESPACE) continue
    const dataset = (item.payload as ReportBinding).dataset
    if (typeof dataset === 'string' && dataset && !ids.includes(dataset)) ids.push(dataset)
  }
  return ids
}

/**
 * Filter Bar 参数来源（ADR-0002 决策 4）：模板实际绑定的数据集的查询参数并集，
 * 同名参数合并、先见数据集为准；绑定引用了模板未定义的数据集时跳过。
 */
export function resolveTemplateParams(template: ReportTemplate): QueryParamDef[] {
  const datasets = getTemplateDatasets(template)
  const map = new Map<string, QueryParamDef>()
  for (const datasetId of getBoundDatasetIds(template)) {
    const dataset = datasets.find((item) => item.id === datasetId)
    if (!dataset) continue
    for (const param of buildParamDefs(dataset.sql, dataset.paramOverrides)) {
      if (!map.has(param.id)) map.set(param.id, param)
    }
  }
  return Array.from(map.values())
}

/** 以参数定义的默认值生成 Filter Bar 初始运行时值 */
export function resolveParamDefaults(params: readonly QueryParamDef[]): ParamValues {
  const values: ParamValues = {}
  for (const param of params) values[param.id] = param.defaultValue
  return values
}

/**
 * 经数据连接器为模板实际绑定的数据集取数（并行），按数据集 id 折叠为 DatasetRecords。
 * 任一数据集返回业务错误（`ok: false`）则整体透传该错误；绑定但未定义的数据集跳过。
 */
export async function fetchTemplateRecords(
  connector: DataConnector,
  template: ReportTemplate,
  values: ParamValues
): Promise<Result<DatasetRecords>> {
  const datasets = getTemplateDatasets(template)
  const targets = getBoundDatasetIds(template)
    .map((datasetId) => datasets.find((item) => item.id === datasetId))
    .filter((dataset): dataset is ReportDatasetDef => dataset !== undefined)

  const results = await Promise.all(
    targets.map((dataset) => connector.query(dataset.connection, dataset.sql, values))
  )

  const records: DatasetRecords = {}
  for (let i = 0; i < targets.length; i++) {
    const result = results[i]!
    if (!result.ok) return result
    records[targets[i]!.id] = result.data.rows
  }
  return { ok: true, data: records }
}
