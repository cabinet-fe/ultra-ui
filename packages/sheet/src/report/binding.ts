import type { CellAddress } from '@veltra/sheet-core'
import { formatAddress, parseAddress } from '@veltra/sheet-core'

import type {
  DatasetCatalogItem,
  ReportAggregate,
  ReportBinding,
  ReportExpand,
  ReportPreset
} from './types'

/** 字段 label 解析用的 catalog（由宿主注入） */
let bindingCatalog: DatasetCatalogItem[] = []

export function setBindingCatalog(catalog: DatasetCatalogItem[]): void {
  bindingCatalog = catalog
}

export const REPORT_META_NAMESPACE = 'report'

const AGGREGATE_PLACEHOLDER_TAG: Record<ReportAggregate, string> = {
  list: '明细',
  group: '分组',
  sum: '求和',
  avg: '平均',
  count: '计数',
  max: '最大',
  min: '最小'
}

/** 预设 → 绑定字段补丁（父格除 grandTotal 外均保留推断值） */
export function presetBindingPatch(
  preset: ReportPreset,
  options?: { transpose?: boolean }
): Partial<ReportBinding> {
  const expand: ReportExpand = options?.transpose ? 'right' : 'down'
  switch (preset) {
    case 'groupHeader':
      return { preset, expand, aggregate: 'group' }
    case 'detail':
      return { preset, expand, aggregate: 'list' }
    case 'subtotal':
      return { preset, expand: 'none', aggregate: 'sum' }
    case 'grandTotal':
      return {
        preset,
        expand: 'none',
        aggregate: 'sum',
        rowParent: undefined,
        colParent: undefined
      }
    case 'cross':
      return { preset, expand: 'none', aggregate: 'sum' }
  }
}

/** 将预设写入绑定（grandTotal 清空双父格；其余保留既有父格） */
export function applyReportPreset(
  binding: ReportBinding,
  preset: ReportPreset,
  options?: { transpose?: boolean }
): ReportBinding {
  const patch = presetBindingPatch(preset, options)
  const next: ReportBinding = { ...binding, ...patch }
  if (preset === 'grandTotal') {
    delete next.rowParent
    delete next.colParent
  }
  return next
}

function isVerticalExpandBinding(binding: ReportBinding): boolean {
  return (
    binding.expand === 'down' && (binding.aggregate === 'group' || binding.aggregate === 'list')
  )
}

function isHorizontalExpandBinding(binding: ReportBinding): boolean {
  return binding.expand === 'right' && binding.aggregate === 'group'
}

/** 同列向上找最近的纵向扩展绑定，作为 rowParent 候选 */
export function inferRowParentCandidate(
  addr: CellAddress,
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
): CellAddress | null {
  for (let row = addr.row - 1; row >= 0; row--) {
    const binding = getBindingAt({ row, col: addr.col })
    if (binding && isVerticalExpandBinding(binding)) {
      return { row, col: addr.col }
    }
  }
  for (let col = addr.col - 1; col >= 0; col--) {
    const binding = getBindingAt({ row: addr.row, col })
    if (binding?.expand === 'down' && binding.aggregate === 'group') {
      return { row: addr.row, col }
    }
  }
  return null
}

/** 同行向左找最近的横向扩展绑定，作为 colParent 候选 */
export function inferColParentCandidate(
  addr: CellAddress,
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
): CellAddress | null {
  for (let col = addr.col - 1; col >= 0; col--) {
    const binding = getBindingAt({ row: addr.row, col })
    if (binding && isHorizontalExpandBinding(binding)) {
      return { row: addr.row, col }
    }
  }
  return null
}

/** 从绑定字段推断预设；不匹配任何预设时返回 null（自定义） */
export function inferReportPreset(binding: ReportBinding): ReportPreset | null {
  if (binding.preset) return binding.preset

  if (
    binding.expand === 'none' &&
    binding.aggregate === 'sum' &&
    binding.rowParent &&
    binding.colParent
  ) {
    return 'cross'
  }
  if (
    binding.expand === 'none' &&
    binding.aggregate === 'sum' &&
    !binding.rowParent &&
    !binding.colParent
  ) {
    return 'grandTotal'
  }
  if (
    binding.expand === 'none' &&
    binding.aggregate === 'sum' &&
    binding.rowParent &&
    !binding.colParent
  ) {
    return 'subtotal'
  }
  if (binding.aggregate === 'group' && (binding.expand === 'down' || binding.expand === 'right')) {
    return 'groupHeader'
  }
  if (binding.aggregate === 'list' && (binding.expand === 'down' || binding.expand === 'right')) {
    return 'detail'
  }
  return null
}

/** 默认明细 + 纵向扩展 */
export function createReportBinding(dataset: DatasetCatalogItem, fieldName: string): ReportBinding {
  return {
    dataset: dataset.id,
    field: fieldName,
    aggregate: 'list',
    expand: 'down',
    preset: 'detail',
    sort: 'none',
    conditionalRules: []
  }
}

/** 设计地址 → A1 标签（支持多字母列） */
export function formatCellAddress(addr: CellAddress): string {
  return formatAddress(addr)
}

/** A1 标签 → 设计地址；非法输入返回 null */
export function parseCellAddress(label: string): CellAddress | null {
  return parseAddress(label)
}

/** 解析字段中文标签（找不到时回退字段名）；可传入报表配置中的 label */
function resolveFieldLabel(
  datasetId: string,
  fieldName: string,
  resolveLabel?: (datasetId: string, fieldName: string) => string
): string {
  const override = resolveLabel?.(datasetId, fieldName)
  if (override) return override
  const dataset = bindingCatalog.find((d) => d.id === datasetId)
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
