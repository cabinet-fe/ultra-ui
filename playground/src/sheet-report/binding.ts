import type { CellAddress } from '@veltra/sheet-core'

import { DATASET_CATALOG } from './dataset-hub'
import type { MockDataset, ReportAggregate, ReportBinding, ReportRole } from './types'

export const REPORT_META_NAMESPACE = 'report'

const AGGREGATE_PLACEHOLDER_TAG: Record<ReportAggregate, string> = {
  select: '明细',
  group: '分组',
  sum: '求和',
  avg: '平均',
  count: '计数'
}

/** 从旧版 aggregate/expand 推导语义角色（快照向下兼容） */
export function resolveReportRole(binding: ReportBinding): ReportRole {
  if (binding.role) return binding.role
  if (binding.aggregate === 'group') return 'group'
  if (
    (binding.aggregate === 'sum' || binding.aggregate === 'avg' || binding.aggregate === 'count') &&
    binding.expand === 'none'
  ) {
    return 'subtotal'
  }
  return 'detail'
}

/** 默认列表 + 纵向扩展 + 默认左父格 */
export function createReportBinding(dataset: MockDataset, fieldName: string): ReportBinding {
  return {
    dataset: dataset.id,
    field: fieldName,
    role: 'detail',
    aggregate: 'select',
    expand: 'down',
    leftParent: 'default',
    sort: 'none',
    conditionalRules: []
  }
}

/** 绑定是否沿纵向扩展 */
export function isExpandingBinding(binding: ReportBinding): boolean {
  return binding.expand === 'down'
}

/** 同行向左扫描最近的可扩展绑定格，作为默认左父格 */
export function findDefaultLeftParent(
  addr: CellAddress,
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
): CellAddress | null {
  for (let col = addr.col - 1; col >= 0; col--) {
    const binding = getBindingAt({ row: addr.row, col })
    if (binding && isExpandingBinding(binding)) {
      return { row: addr.row, col }
    }
  }
  return null
}

/** 解析有效左父格设计地址；无左父格时返回 null */
export function resolveLeftParent(
  binding: ReportBinding,
  addr: CellAddress,
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
): CellAddress | null {
  if (binding.leftParent === 'none') return null
  if (binding.leftParent === 'default') {
    return findDefaultLeftParent(addr, getBindingAt)
  }
  return binding.leftParent
}

/** 设计地址 → A1 标签（列仅支持 A–Z） */
export function formatCellAddress(addr: CellAddress): string {
  return `${String.fromCharCode(65 + addr.col)}${addr.row + 1}`
}

/** A1 标签 → 设计地址；非法输入返回 null */
export function parseCellAddress(label: string): CellAddress | null {
  const match = /^([A-Z])(\d+)$/i.exec(label.trim())
  if (!match) return null

  const col = match[1]!.toUpperCase().charCodeAt(0) - 65
  const row = Number(match[2]) - 1
  if (col < 0 || row < 0 || Number.isNaN(row)) return null

  return { row, col }
}

/** 解析字段中文标签（找不到时回退字段名）；可传入报表配置中的 label */
function resolveFieldLabel(
  datasetId: string,
  fieldName: string,
  resolveLabel?: (datasetId: string, fieldName: string) => string
): string {
  const override = resolveLabel?.(datasetId, fieldName)
  if (override) return override
  const dataset = DATASET_CATALOG.find((d) => d.id === datasetId)
  const field = dataset?.fields.find((f) => f.name === fieldName)
  return field?.label ?? fieldName
}

/** Binding Placeholder 中文可读文案（如「分组 · 客户」） */
export function formatBindingPlaceholder(
  binding: ReportBinding,
  resolveLabel?: (datasetId: string, fieldName: string) => string
): string {
  const tag = AGGREGATE_PLACEHOLDER_TAG[binding.aggregate]
  return `${tag} · ${resolveFieldLabel(binding.dataset, binding.field, resolveLabel)}`
}

/** sum / avg / count 聚合默认不扩展 */
export function aggregateDefaultExpand(aggregate: ReportAggregate): ReportBinding['expand'] {
  return aggregate === 'sum' || aggregate === 'avg' || aggregate === 'count' ? 'none' : 'down'
}
