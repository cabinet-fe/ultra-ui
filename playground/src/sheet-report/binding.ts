import type { CellAddress } from '@veltra/sheet-core'

import { MOCK_DATASETS } from './mock-dataset'
import type { MockDataset, ReportAggregate, ReportBinding } from './types'

export const REPORT_META_NAMESPACE = 'report'

const AGGREGATE_PLACEHOLDER_TAG: Record<ReportAggregate, string> = {
  select: '明细',
  group: '分组',
  sum: '求和'
}

/** 默认列表 + 纵向扩展 + 默认左父格 */
export function createReportBinding(dataset: MockDataset, fieldName: string): ReportBinding {
  return {
    dataset: dataset.id,
    field: fieldName,
    aggregate: 'select',
    expand: 'down',
    leftParent: 'default'
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

/** 解析字段中文标签（找不到时回退字段名） */
function resolveFieldLabel(datasetId: string, fieldName: string): string {
  const dataset = MOCK_DATASETS.find((d) => d.id === datasetId)
  const field = dataset?.fields.find((f) => f.name === fieldName)
  return field?.label ?? fieldName
}

/** Binding Placeholder 中文可读文案（如「分组 · 客户」） */
export function formatBindingPlaceholder(binding: ReportBinding): string {
  const tag = AGGREGATE_PLACEHOLDER_TAG[binding.aggregate]
  return `${tag} · ${resolveFieldLabel(binding.dataset, binding.field)}`
}

/** sum 聚合默认不扩展 */
export function aggregateDefaultExpand(aggregate: ReportAggregate): ReportBinding['expand'] {
  return aggregate === 'sum' ? 'none' : 'down'
}
