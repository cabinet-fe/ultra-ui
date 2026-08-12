import type { CellAddress } from '@veltra/sheet-core'

import type { DatasetRecords, ReportAggregate, ReportBinding } from '../types'
import { enumerateExpansionInstances } from './coordinate'
import type { PhysicalPlacement } from './coordinate'
import type { TemplateIndex } from './template-index'

function filterRows(
  rows: Record<string, unknown>[],
  filter: Record<string, unknown>
): Record<string, unknown>[] {
  if (Object.keys(filter).length === 0) return rows
  return rows.filter((row) =>
    Object.entries(filter).every(([field, value]) => row[field] === value)
  )
}

/** 对数值集求聚合；`avg` 空集返回 `undefined`，`sum` 空集仍为 `0` */
export function aggregateField(
  rows: Record<string, unknown>[],
  field: string,
  aggregate: ReportAggregate
): unknown {
  if (aggregate === 'count') return rows.length
  if (aggregate === 'list' || aggregate === 'group') {
    return rows[0]?.[field]
  }

  const numbers = rows
    .map((row) => row[field])
    .map((value) => (typeof value === 'number' ? value : Number(value)))
    .filter((value) => Number.isFinite(value))

  if (numbers.length === 0) {
    if (aggregate === 'avg') return undefined
    return 0
  }

  const sum = numbers.reduce((acc, value) => acc + value, 0)
  if (aggregate === 'avg') return sum / numbers.length
  if (aggregate === 'max') return Math.max(...numbers)
  if (aggregate === 'min') return Math.min(...numbers)
  return sum
}

function isRowExpanding(binding: ReportBinding): boolean {
  return (
    binding.expand === 'down' && (binding.aggregate === 'group' || binding.aggregate === 'list')
  )
}

function isColExpanding(binding: ReportBinding): boolean {
  return (
    binding.expand === 'right' && (binding.aggregate === 'group' || binding.aggregate === 'list')
  )
}

function rowExpandingAncestors(
  binding: ReportBinding,
  index: TemplateIndex
): Array<{ addr: CellAddress; binding: ReportBinding }> {
  const chain: Array<{ addr: CellAddress; binding: ReportBinding }> = []
  let current = binding.rowParent
  while (current) {
    const parentBinding = index.bindingAt(current)
    if (parentBinding) chain.unshift({ addr: current, binding: parentBinding })
    current = parentBinding?.rowParent
  }
  return chain.filter((item) => isRowExpanding(item.binding))
}

function colExpandingAncestors(
  binding: ReportBinding,
  index: TemplateIndex
): Array<{ addr: CellAddress; binding: ReportBinding }> {
  const chain: Array<{ addr: CellAddress; binding: ReportBinding }> = []
  let current = binding.colParent
  while (current) {
    const parentBinding = index.bindingAt(current)
    if (parentBinding) chain.unshift({ addr: current, binding: parentBinding })
    current = parentBinding?.colParent
  }
  return chain.filter((item) => isColExpanding(item.binding))
}

function mergeFilters(
  rowFilter: Record<string, unknown>,
  colFilter: Record<string, unknown>
): Record<string, unknown> {
  return { ...rowFilter, ...colFilter }
}

function resolveAncestorFilters(
  binding: ReportBinding,
  placement: PhysicalPlacement,
  index: TemplateIndex,
  data: DatasetRecords
): Record<string, unknown> {
  const rowFilter: Record<string, unknown> = {}
  const colFilter: Record<string, unknown> = {}
  let parentFilter: Record<string, unknown> = {}

  const rowAncestors = rowExpandingAncestors(binding, index)
  for (let i = 0; i < rowAncestors.length; i++) {
    const ancestor = rowAncestors[i]!
    if (ancestor.binding.dataset !== binding.dataset) continue
    const instances = enumerateExpansionInstances(ancestor.binding, data, parentFilter)
    const pathIndex = placement.rowPath[i]
    if (pathIndex === undefined) continue
    const instance = instances[pathIndex]
    if (!instance) continue
    Object.assign(rowFilter, instance.filter)
    parentFilter = instance.filter
  }

  parentFilter = {}
  const colAncestors = colExpandingAncestors(binding, index)
  for (let i = 0; i < colAncestors.length; i++) {
    const ancestor = colAncestors[i]!
    if (ancestor.binding.dataset !== binding.dataset) continue
    const instances = enumerateExpansionInstances(ancestor.binding, data, parentFilter)
    const pathIndex = placement.colPath[i]
    if (pathIndex === undefined) continue
    const instance = instances[pathIndex]
    if (!instance) continue
    Object.assign(colFilter, instance.filter)
    parentFilter = instance.filter
  }

  return mergeFilters(rowFilter, colFilter)
}

function resolveOwnGroupValue(
  binding: ReportBinding,
  placement: PhysicalPlacement,
  index: TemplateIndex,
  data: DatasetRecords
): unknown {
  const rowAncestors = rowExpandingAncestors(binding, index)
  const colAncestors = colExpandingAncestors(binding, index)
  let parentFilter: Record<string, unknown> = {}

  for (let i = 0; i < rowAncestors.length; i++) {
    const ancestor = rowAncestors[i]!
    if (ancestor.binding.dataset !== binding.dataset) continue
    const instances = enumerateExpansionInstances(ancestor.binding, data, parentFilter)
    const pathIndex = placement.rowPath[i]
    if (pathIndex === undefined) continue
    const instance = instances[pathIndex]
    if (instance) parentFilter = instance.filter
  }

  for (let i = 0; i < colAncestors.length; i++) {
    const ancestor = colAncestors[i]!
    if (ancestor.binding.dataset !== binding.dataset) continue
    const instances = enumerateExpansionInstances(ancestor.binding, data, parentFilter)
    const pathIndex = placement.colPath[i]
    if (pathIndex === undefined) continue
    const instance = instances[pathIndex]
    if (instance) parentFilter = instance.filter
  }

  const instances = enumerateExpansionInstances(binding, data, parentFilter)
  const pathIndex = isRowExpanding(binding) ? placement.rowPath.at(-1) : placement.colPath.at(-1)
  if (pathIndex === undefined) return undefined
  return instances[pathIndex]?.value
}

/** 按分组字段建索引，避免交叉展开重复 filterRows */
export class AggregateIndex {
  private readonly datasets = new Map<string, Record<string, unknown>[]>()
  private readonly filterCache = new Map<string, Record<string, unknown>[]>()

  constructor(data: DatasetRecords) {
    for (const [datasetId, rows] of Object.entries(data)) {
      this.datasets.set(datasetId, rows)
    }
  }

  rowsFor(dataset: string, filter: Record<string, unknown>): Record<string, unknown>[] {
    const cacheKey = `${dataset}:${JSON.stringify(filter)}`
    const cached = this.filterCache.get(cacheKey)
    if (cached) return cached
    const rows = filterRows(this.datasets.get(dataset) ?? [], filter)
    this.filterCache.set(cacheKey, rows)
    return rows
  }

  aggregate(
    dataset: string,
    filter: Record<string, unknown>,
    field: string,
    aggregate: ReportAggregate
  ): unknown {
    const rows = this.rowsFor(dataset, filter)
    if (aggregate === 'list') {
      return rows[0]?.[field]
    }
    return aggregateField(rows, field, aggregate)
  }
}

/** 解析单个物理落点的绑定取值 */
export function resolvePlacementValue(
  placement: PhysicalPlacement,
  index: TemplateIndex,
  data: DatasetRecords,
  aggregateIndex: AggregateIndex
): unknown {
  const binding = placement.binding
  if (!binding) return undefined

  const filter = resolveAncestorFilters(binding, placement, index, data)
  const rows = aggregateIndex.rowsFor(binding.dataset, filter)

  if (binding.aggregate === 'group') {
    return filter[binding.field] ?? resolveOwnGroupValue(binding, placement, index, data)
  }

  if (binding.aggregate === 'list') {
    return rows[placement.listIndex]?.[binding.field]
  }

  return aggregateField(rows, binding.field, binding.aggregate)
}
