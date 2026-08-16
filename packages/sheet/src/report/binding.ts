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

export function isVerticalExpandBinding(binding: ReportBinding): boolean {
  return (
    binding.expand === 'down' && (binding.aggregate === 'group' || binding.aggregate === 'list')
  )
}

export function isHorizontalExpandBinding(binding: ReportBinding): boolean {
  return (
    binding.expand === 'right' && (binding.aggregate === 'group' || binding.aggregate === 'list')
  )
}

export function isRowGroupBinding(binding: ReportBinding): boolean {
  return binding.expand === 'down' && binding.aggregate === 'group'
}

export function isColGroupBinding(binding: ReportBinding): boolean {
  return binding.expand === 'right' && binding.aggregate === 'group'
}

export function isReductionAggregate(aggregate: ReportAggregate): boolean {
  return (
    aggregate === 'sum' ||
    aggregate === 'avg' ||
    aggregate === 'count' ||
    aggregate === 'max' ||
    aggregate === 'min'
  )
}

/** 小计 / 汇总 / 交叉格的父格候选只列分组头 */
export function prefersGroupParent(binding: ReportBinding): boolean {
  if (
    binding.preset === 'subtotal' ||
    binding.preset === 'grandTotal' ||
    binding.preset === 'cross'
  ) {
    return true
  }
  return binding.expand === 'none' && isReductionAggregate(binding.aggregate)
}

/** 当前 expand / aggregate 是否仍属于已写入的预设族（同族内改聚合不掉到「自定义」） */
export function presetStillApplies(binding: ReportBinding): boolean {
  const preset = binding.preset
  if (!preset) return false
  if (preset === 'groupHeader') {
    return (
      binding.aggregate === 'group' && (binding.expand === 'down' || binding.expand === 'right')
    )
  }
  if (preset === 'detail') {
    return binding.aggregate === 'list' && (binding.expand === 'down' || binding.expand === 'right')
  }
  return binding.expand === 'none' && isReductionAggregate(binding.aggregate)
}

const DEFAULT_SCAN_COLS = 64
const DEFAULT_SCAN_ROWS = 64

type GetBindingAt = (addr: CellAddress) => ReportBinding | undefined

export interface InferParentOptions {
  /** 小计落格：必须优先分组头，禁止把同列/同行明细当成父格 */
  preferGroup?: boolean
}

/** 指定模板行是否含纵向扩展绑定（展开带行） */
export function isExpansionBandRow(
  row: number,
  getBindingAt: GetBindingAt,
  scanCols = DEFAULT_SCAN_COLS
): boolean {
  for (let col = 0; col < scanCols; col++) {
    const binding = getBindingAt({ row, col })
    if (binding && isVerticalExpandBinding(binding)) return true
  }
  return false
}

/** 指定模板列是否含横向扩展绑定（展开带列） */
export function isExpansionBandCol(
  col: number,
  getBindingAt: GetBindingAt,
  scanRows = DEFAULT_SCAN_ROWS
): boolean {
  for (let row = 0; row < scanRows; row++) {
    const binding = getBindingAt({ row, col })
    if (binding && isHorizontalExpandBinding(binding)) return true
  }
  return false
}

/** 落格时推断预设：默认明细；数值字段且位于展开带正下方或正右相邻 → 小计 */
export function inferDropPreset(
  addr: CellAddress,
  fieldType: DatasetCatalogItem['fields'][number]['type'],
  getBindingAt: GetBindingAt
): ReportPreset {
  if (fieldType !== 'number') return 'detail'
  if (addr.row > 0 && isExpansionBandRow(addr.row - 1, getBindingAt)) return 'subtotal'
  if (addr.col > 0 && isExpansionBandCol(addr.col - 1, getBindingAt)) return 'subtotal'
  return 'detail'
}

export interface ListParentCandidateOptions {
  preferGroup?: boolean
}

/** 同数据集纵向扩展绑定格（行方向父格下拉候选） */
export function listRowParentCandidates(
  binding: ReportBinding,
  entries: ReadonlyArray<{ addr: CellAddress; binding: ReportBinding }>,
  options?: ListParentCandidateOptions
): CellAddress[] {
  const preferGroup = options?.preferGroup === true
  const candidates: CellAddress[] = []
  for (const entry of entries) {
    if (entry.binding.dataset !== binding.dataset) continue
    if (preferGroup) {
      if (!isRowGroupBinding(entry.binding)) continue
    } else if (!isVerticalExpandBinding(entry.binding)) {
      continue
    }
    candidates.push(entry.addr)
  }
  return candidates
}

/** 同数据集横向扩展绑定格（列方向父格下拉候选） */
export function listColParentCandidates(
  binding: ReportBinding,
  entries: ReadonlyArray<{ addr: CellAddress; binding: ReportBinding }>,
  options?: ListParentCandidateOptions
): CellAddress[] {
  const preferGroup = options?.preferGroup === true
  const candidates: CellAddress[] = []
  for (const entry of entries) {
    if (entry.binding.dataset !== binding.dataset) continue
    if (preferGroup) {
      if (!isColGroupBinding(entry.binding)) continue
    } else if (!isHorizontalExpandBinding(entry.binding)) {
      continue
    }
    candidates.push(entry.addr)
  }
  return candidates
}

interface ScanHit {
  addr: CellAddress
  group: boolean
  distance: number
}

function betterHit(current: ScanHit | null, next: ScanHit): boolean {
  if (!current) return true
  if (next.distance !== current.distance) return next.distance < current.distance
  return next.addr.col + next.addr.row < current.addr.col + current.addr.row
}

function pickExpandHit(hits: ScanHit[], preferGroup: boolean): CellAddress | null {
  let group: ScanHit | null = null
  let expand: ScanHit | null = null
  for (const hit of hits) {
    if (hit.group && betterHit(group, hit)) group = hit
    if (betterHit(expand, hit)) expand = hit
  }
  if (preferGroup) return group?.addr ?? null
  return group?.addr ?? expand?.addr ?? null
}

function scanVerticalOnRow(
  row: number,
  originCol: number,
  colStart: number,
  colEnd: number,
  getBindingAt: GetBindingAt
): ScanHit[] {
  const hits: ScanHit[] = []
  for (let col = colStart; col < colEnd; col++) {
    const binding = getBindingAt({ row, col })
    if (!binding || !isVerticalExpandBinding(binding)) continue
    hits.push({
      addr: { row, col },
      group: isRowGroupBinding(binding),
      distance: Math.abs(col - originCol)
    })
  }
  return hits
}

function scanHorizontalOnCol(
  col: number,
  originRow: number,
  rowStart: number,
  rowEnd: number,
  getBindingAt: GetBindingAt
): ScanHit[] {
  const hits: ScanHit[] = []
  for (let row = rowStart; row < rowEnd; row++) {
    const binding = getBindingAt({ row, col })
    if (!binding || !isHorizontalExpandBinding(binding)) continue
    hits.push({
      addr: { row, col },
      group: isColGroupBinding(binding),
      distance: Math.abs(row - originRow)
    })
  }
  return hits
}

/**
 * 行方向父格推断：
 * 1. 同行向左：先找分组头，否则最近纵向扩展格
 * 2. 上方各行整行扫描：每行先找分组头，再退回任意纵向扩展格
 * 小计（preferGroup）禁止把明细当成父格
 */
export function inferRowParentCandidate(
  addr: CellAddress,
  getBindingAt: GetBindingAt,
  options?: InferParentOptions
): CellAddress | null {
  const preferGroup = options?.preferGroup === true

  const sameRow = pickExpandHit(
    scanVerticalOnRow(addr.row, addr.col, 0, addr.col, getBindingAt),
    preferGroup
  )
  if (sameRow) return sameRow

  for (let row = addr.row - 1; row >= 0; row--) {
    const found = pickExpandHit(
      scanVerticalOnRow(row, addr.col, 0, DEFAULT_SCAN_COLS, getBindingAt),
      preferGroup
    )
    if (found) return found
  }
  return null
}

/**
 * 列方向父格推断（与行方向对称）：
 * 1. 同列向上：先找列分组头，否则最近横向扩展格
 * 2. 左侧各列整列扫描：每列先找列分组头
 * 列小计（preferGroup）禁止把交叉格/明细当成列父格
 */
export function inferColParentCandidate(
  addr: CellAddress,
  getBindingAt: GetBindingAt,
  options?: InferParentOptions
): CellAddress | null {
  const preferGroup = options?.preferGroup === true

  const sameCol = pickExpandHit(
    scanHorizontalOnCol(addr.col, addr.row, 0, addr.row, getBindingAt),
    preferGroup
  )
  if (sameCol) return sameCol

  for (let col = addr.col - 1; col >= 0; col--) {
    const found = pickExpandHit(
      scanHorizontalOnCol(col, addr.row, 0, DEFAULT_SCAN_ROWS, getBindingAt),
      preferGroup
    )
    if (found) return found
  }
  return null
}

function suggestsColumnSubtotal(above: ReportBinding | undefined): boolean {
  if (!above) return false
  return isHorizontalExpandBinding(above) || !!above.colParent || above.preset === 'cross'
}

function suggestsRowSubtotal(left: ReportBinding | undefined): boolean {
  if (!left) return false
  return isVerticalExpandBinding(left) || !!left.rowParent || left.preset === 'cross'
}

/**
 * 按预设写入落格父格：明细/分组/交叉双方向推断；小计按「下方行小计 / 右侧列小计」只挂对应轴。
 */
export function inferParentsForPreset(
  addr: CellAddress,
  preset: ReportPreset,
  getBindingAt: GetBindingAt
): Pick<ReportBinding, 'rowParent' | 'colParent'> {
  if (preset === 'grandTotal') return {}

  const preferGroup = preset === 'subtotal' || preset === 'cross'
  const rowParent = inferRowParentCandidate(addr, getBindingAt, { preferGroup }) ?? undefined
  const colParent = inferColParentCandidate(addr, getBindingAt, { preferGroup }) ?? undefined

  if (preset !== 'subtotal') {
    return { ...(rowParent ? { rowParent } : {}), ...(colParent ? { colParent } : {}) }
  }

  const above = addr.row > 0 ? getBindingAt({ row: addr.row - 1, col: addr.col }) : undefined
  const left = addr.col > 0 ? getBindingAt({ row: addr.row, col: addr.col - 1 }) : undefined
  const belowBand = addr.row > 0 && isExpansionBandRow(addr.row - 1, getBindingAt)
  const rightOfBand = addr.col > 0 && isExpansionBandCol(addr.col - 1, getBindingAt)

  const columnSubtotal =
    suggestsColumnSubtotal(above) || (rightOfBand && !suggestsRowSubtotal(left))
  const rowSubtotal = suggestsRowSubtotal(left) || (belowBand && !columnSubtotal)

  const result: Pick<ReportBinding, 'rowParent' | 'colParent'> = {}
  if (rowSubtotal && rowParent) result.rowParent = rowParent
  if (columnSubtotal && colParent) result.colParent = colParent
  if (!rowSubtotal && !columnSubtotal) {
    if (belowBand && rowParent) result.rowParent = rowParent
    else if (rightOfBand && colParent) result.colParent = colParent
    else {
      if (rowParent) result.rowParent = rowParent
      if (colParent) result.colParent = colParent
    }
  }
  return result
}

/** 从绑定字段推断预设；不匹配任何预设时返回 null（自定义） */
export function inferReportPreset(binding: ReportBinding): ReportPreset | null {
  if (binding.preset) return binding.preset

  if (binding.expand === 'none' && isReductionAggregate(binding.aggregate)) {
    if (binding.rowParent && binding.colParent) return 'cross'
    if (binding.rowParent || binding.colParent) return 'subtotal'
    return 'grandTotal'
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

/** Binding Placeholder 分段文案（聚合标签 + 字段标签），供徽章分色渲染等场景使用 */
export function formatBindingPlaceholderParts(
  binding: ReportBinding,
  resolveLabel?: (datasetId: string, fieldName: string) => string
): { tag: string; label: string } {
  return {
    tag: AGGREGATE_PLACEHOLDER_TAG[binding.aggregate],
    label: resolveFieldLabel(binding.dataset, binding.field, resolveLabel)
  }
}

/** Binding Placeholder 中文可读文案（如「分组 · 客户」） */
export function formatBindingPlaceholder(
  binding: ReportBinding,
  resolveLabel?: (datasetId: string, fieldName: string) => string
): string {
  const { tag, label } = formatBindingPlaceholderParts(binding, resolveLabel)
  return `${tag} · ${label}`
}

/** 父格下拉候选文案（如「分组 · 客户 (A2)」） */
export function formatParentCandidateLabel(
  addr: CellAddress,
  binding: ReportBinding,
  resolveLabel?: (datasetId: string, fieldName: string) => string
): string {
  return `${formatBindingPlaceholder(binding, resolveLabel)} (${formatCellAddress(addr)})`
}
