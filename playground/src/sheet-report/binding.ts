import type { MockDataset, ReportBinding } from './types'

export const REPORT_META_NAMESPACE = 'report'

/** 默认列表 + 纵向扩展绑定 */
export function createReportBinding(dataset: MockDataset, fieldName: string): ReportBinding {
  return { dataset: dataset.id, field: fieldName, aggregate: 'select', expand: 'down' }
}

/** Binding Placeholder 可读文案（如 orders.amount） */
export function formatBindingPlaceholder(binding: ReportBinding): string {
  return `${binding.dataset}.${binding.field}`
}
