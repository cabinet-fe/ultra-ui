import type { DataConnection } from '@veltra/sheet'

import type { StoredReportTemplate } from './template-validation'
import type { WorkspaceData, WorkspaceDataset } from './workspace-types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 模板入库前剥离连接与 SQL，仅保留数据集引用与覆盖项 */
export function stripTemplateForStorage(template: StoredReportTemplate): StoredReportTemplate {
  if (!Array.isArray(template.datasets)) return template
  const datasets = template.datasets.filter(isRecord).map((item) => {
    const next: Record<string, unknown> = { id: item.id, label: item.label }
    if (item.paramOverrides !== undefined) next.paramOverrides = item.paramOverrides
    if (item.fieldOverrides !== undefined) next.fieldOverrides = item.fieldOverrides
    return next
  })
  return { ...template, datasets }
}

function workspaceDatasetToTemplateDef(
  dataset: WorkspaceDataset,
  connection: DataConnection
): Record<string, unknown> {
  const next: Record<string, unknown> = {
    id: dataset.id,
    label: dataset.label,
    connection: { ...connection },
    sql: dataset.sql
  }
  if (dataset.paramOverrides) next.paramOverrides = dataset.paramOverrides
  if (dataset.fieldOverrides) next.fieldOverrides = dataset.fieldOverrides
  return next
}

/** 读取模板时用工作区数据集回填 connection / sql */
export function hydrateTemplateFromWorkspace(
  template: StoredReportTemplate,
  workspace: WorkspaceData
): StoredReportTemplate {
  if (!Array.isArray(template.datasets)) return template

  const connectionById = new Map(workspace.connections.map((item) => [item.id, item]))
  const datasetById = new Map(workspace.datasets.map((item) => [item.id, item]))

  const datasets = template.datasets.filter(isRecord).flatMap((item) => {
    const id = typeof item.id === 'string' ? item.id : ''
    if (!id) return []

    const workspaceDataset = datasetById.get(id)
    if (workspaceDataset) {
      const connection = connectionById.get(workspaceDataset.connectionId)
      if (!connection) return []
      const hydrated = workspaceDatasetToTemplateDef(workspaceDataset, connection)
      if (item.paramOverrides !== undefined) hydrated.paramOverrides = item.paramOverrides
      if (item.fieldOverrides !== undefined) hydrated.fieldOverrides = item.fieldOverrides
      return [hydrated]
    }

    // 兼容旧模板：仍内嵌 connection + sql
    if (isRecord(item.connection) && typeof item.sql === 'string') {
      return [item]
    }
    return []
  })

  return { ...template, datasets }
}
