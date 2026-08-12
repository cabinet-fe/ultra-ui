import type { CellAddress, CellRange } from '@veltra/sheet-core'
import { cellKey, createRange } from '@veltra/sheet-core'

import type { DatasetRecords, ReportBinding } from '../types'
import { sameAddress, type TemplateIndex } from './template-index'

/** 扩展实例：携带祖先父格过滤条件 */
export interface ExpansionInstance {
  index: number
  /** `group` 聚合时的分组值 */
  value?: unknown
  /** 同数据集内生效的字段过滤 */
  filter: Record<string, unknown>
}

/** 逻辑格 → 物理区间映射项（纯几何，不含取值） */
export interface PhysicalPlacement {
  logical: CellAddress
  physical: CellRange
  rowPath: readonly number[]
  colPath: readonly number[]
  mergeSpan: boolean
  binding?: ReportBinding
  /** `list` 明细实例下标；非 list 时为 0 */
  listIndex: number
}

/** 扩展坐标系计算结果 */
export interface ExpansionLayout {
  rowCount: number
  colCount: number
  placements: PhysicalPlacement[]
  /** 模板合并区域映射到物理网格后的区间 */
  mappedMerges: CellRange[]
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

function mergeSpanEnabled(binding: ReportBinding | undefined): boolean {
  return binding?.mergeSpan !== false
}

function filterRows(
  rows: Record<string, unknown>[],
  filter: Record<string, unknown>
): Record<string, unknown>[] {
  if (Object.keys(filter).length === 0) return rows
  return rows.filter((row) =>
    Object.entries(filter).every(([field, value]) => row[field] === value)
  )
}

function distinctFieldValues(rows: Record<string, unknown>[], field: string): unknown[] {
  const seen = new Set<string>()
  const values: unknown[] = []
  for (const row of rows) {
    const key = JSON.stringify(row[field])
    if (seen.has(key)) continue
    seen.add(key)
    values.push(row[field])
  }
  return values
}

function sortValues(values: unknown[], sort: ReportBinding['sort']): unknown[] {
  if (sort === 'asc') return [...values].sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'))
  if (sort === 'desc')
    return [...values].sort((a, b) => String(b).localeCompare(String(a), 'zh-CN'))
  return values
}

function singleCellRange(row: number, col: number): CellRange {
  return { start: { row, col }, end: { row, col } }
}

function rangeRows(range: CellRange): number {
  return range.end.row - range.start.row + 1
}

function rangeCols(range: CellRange): number {
  return range.end.col - range.start.col + 1
}

function mergeFilters(
  rowFilter: Record<string, unknown>,
  colFilter: Record<string, unknown>
): Record<string, unknown> {
  return { ...rowFilter, ...colFilter }
}

function parentFilterForBinding(
  binding: ReportBinding,
  index: TemplateIndex,
  rowFilter: Record<string, unknown>,
  colFilter: Record<string, unknown>
): Record<string, unknown> {
  const filter: Record<string, unknown> = {}
  if (binding.rowParent) {
    const parent = index.bindingAt(binding.rowParent)
    if (parent && parent.dataset === binding.dataset) Object.assign(filter, rowFilter)
  }
  if (binding.colParent) {
    const parent = index.bindingAt(binding.colParent)
    if (parent && parent.dataset === binding.dataset) Object.assign(filter, colFilter)
  }
  return filter
}

/** 枚举扩展格实例 */
export function enumerateExpansionInstances(
  binding: ReportBinding,
  data: DatasetRecords,
  filter: Record<string, unknown>
): ExpansionInstance[] {
  const rows = filterRows(data[binding.dataset] ?? [], filter)

  if (!isRowExpanding(binding) && !isColExpanding(binding)) {
    return [{ index: 0, filter }]
  }

  if (binding.aggregate === 'group') {
    const values = sortValues(distinctFieldValues(rows, binding.field), binding.sort)
    return values.map((value, index) => ({
      index,
      value,
      filter: { ...filter, [binding.field]: value }
    }))
  }

  if (binding.aggregate === 'list') {
    return rows.map((_, index) => ({ index, filter }))
  }

  return [{ index: 0, filter }]
}

function isRowSubtreeRoot(binding: ReportBinding, index: TemplateIndex): boolean {
  if (!isRowExpanding(binding)) return false
  if (!binding.rowParent) return true
  const parent = index.bindingAt(binding.rowParent)
  return !parent || !isRowExpanding(parent)
}

function isColSubtreeRoot(binding: ReportBinding, index: TemplateIndex): boolean {
  if (!isColExpanding(binding)) return false
  if (!binding.colParent) return true
  const parent = index.bindingAt(binding.colParent)
  return !parent || !isColExpanding(parent)
}

function isNestedRowExpander(binding: ReportBinding, index: TemplateIndex): boolean {
  return (
    isRowExpanding(binding) &&
    binding.aggregate === 'group' &&
    !!binding.rowParent &&
    !isRowSubtreeRoot(binding, index)
  )
}

function isNestedColExpander(binding: ReportBinding, index: TemplateIndex): boolean {
  return (
    isColExpanding(binding) &&
    binding.aggregate === 'group' &&
    !!binding.colParent &&
    !isColSubtreeRoot(binding, index)
  )
}

function rowSubtreeRows(rootAddr: CellAddress, index: TemplateIndex): number[] {
  let maxRow = rootAddr.row
  const walk = (addr: CellAddress): void => {
    maxRow = Math.max(maxRow, addr.row)
    for (const child of index.rowChildren.get(cellKey(addr)) ?? []) walk(child)
  }
  walk(rootAddr)
  return index.logicalRows.filter((row) => row >= rootAddr.row && row <= maxRow)
}

function colSubtreeCols(rootAddr: CellAddress, index: TemplateIndex): number[] {
  let maxCol = rootAddr.col
  const walk = (addr: CellAddress): void => {
    maxCol = Math.max(maxCol, addr.col)
    for (const child of index.colChildren.get(cellKey(addr)) ?? []) walk(child)
  }
  walk(rootAddr)
  return index.logicalCols.filter((col) => col >= rootAddr.col && col <= maxCol)
}

function columnsOnRow(index: TemplateIndex, row: number): number[] {
  const cols = new Set<number>()
  for (const entry of index.bindingsOnRow(row)) cols.add(entry.addr.col)
  for (const cell of index.staticCells.values()) {
    if (cell.row === row) cols.add(cell.col)
  }
  return [...cols].sort((a, b) => a - b)
}

function findRowSubtreeRootOnRow(index: TemplateIndex, row: number): CellAddress | null {
  for (const entry of index.bindingsOnRow(row)) {
    if (isRowSubtreeRoot(entry.binding, index)) return entry.addr
  }
  return null
}

/** 扩展带终止行：新的纵向子树根，或无父格的汇总行（如总计） */
function isExpansionBandTerminatorRow(index: TemplateIndex, row: number, rootRow: number): boolean {
  if (row <= rootRow) return false
  const rowRoot = findRowSubtreeRootOnRow(index, row)
  if (rowRoot && rowRoot.row !== rootRow) return true
  return !isCompanionRow(index, row)
}

/** 扩展带内随行：全部绑定均带 rowParent（纯静态行不算带内行） */
function isCompanionRow(index: TemplateIndex, row: number): boolean {
  const bindings = index.bindingsOnRow(row)
  if (bindings.length === 0) return false
  return bindings.every(({ binding }) => binding.rowParent !== undefined)
}

/** 纵向扩展带覆盖的模板行：子树行 + 紧随其后的带内汇总行 */
function expansionBandRows(rootAddr: CellAddress, index: TemplateIndex): number[] {
  const subtreeRows = rowSubtreeRows(rootAddr, index)
  const maxSubtreeRow = Math.max(...subtreeRows)
  const rows = new Set(subtreeRows)
  for (const row of index.logicalRows) {
    if (row <= maxSubtreeRow) continue
    if (isExpansionBandTerminatorRow(index, row, rootAddr.row)) break
    if (!isCompanionRow(index, row)) break
    rows.add(row)
  }
  return index.logicalRows.filter((row) => rows.has(row))
}

function findNestedColChild(rootAddr: CellAddress, index: TemplateIndex): CellAddress | null {
  for (const child of index.colChildren.get(cellKey(rootAddr)) ?? []) {
    const binding = index.bindingAt(child)
    if (binding && isColExpanding(binding) && child.row > rootAddr.row) return child
  }
  return null
}

interface LayoutContext {
  rowFilter: Record<string, unknown>
  colFilter: Record<string, unknown>
  rowPath: number[]
  colPath: number[]
}

interface SegmentResult {
  rowSpan: number
  colSpan: number
  placements: PhysicalPlacement[]
}

class CoordinateEngine {
  constructor(
    private readonly index: TemplateIndex,
    private readonly data: DatasetRecords
  ) {}

  compute(): ExpansionLayout {
    const placements: PhysicalPlacement[] = []
    const consumedRows = new Set<number>()
    let physRow = 0
    let maxCol = 0

    for (const logicalRow of this.index.logicalRows) {
      if (consumedRows.has(logicalRow)) continue

      const rowRoot = findRowSubtreeRootOnRow(this.index, logicalRow)
      if (rowRoot) {
        const result = this.layoutRowSubtree(rowRoot, emptyCtx(), physRow, 0)
        placements.push(...result.placements)
        physRow += result.rowSpan
        maxCol = Math.max(maxCol, result.colSpan)
        for (const row of expansionBandRows(rowRoot, this.index)) consumedRows.add(row)
        continue
      }

      const result = this.layoutStandaloneRow(logicalRow, emptyCtx(), physRow, 0)
      placements.push(...result.placements)
      physRow += result.rowSpan
      maxCol = Math.max(maxCol, result.colSpan)
    }

    return {
      rowCount: physRow,
      colCount: Math.max(maxCol, this.baseColCount()),
      placements,
      mappedMerges: mapTemplateMerges(this.index, placements)
    }
  }

  private baseColCount(): number {
    if (this.index.logicalCols.length === 0) return 0
    return Math.max(...this.index.logicalCols) + 1
  }

  private layoutRowSubtree(
    rootAddr: CellAddress,
    ctx: LayoutContext,
    physRowStart: number,
    physColStart: number
  ): SegmentResult {
    const rootBinding = this.index.bindingAt(rootAddr)!
    const parentFilter = parentFilterForBinding(
      rootBinding,
      this.index,
      ctx.rowFilter,
      ctx.colFilter
    )
    const instances = enumerateExpansionInstances(
      rootBinding,
      this.data,
      mergeFilters(parentFilter, ctx.rowFilter)
    )
    const bandRows = expansionBandRows(rootAddr, this.index)

    if (instances.length === 0) return { rowSpan: 0, colSpan: 0, placements: [] }

    if (rootBinding.aggregate === 'list') {
      const listCtx: LayoutContext = {
        rowFilter: mergeFilters(parentFilter, ctx.rowFilter),
        colFilter: ctx.colFilter,
        rowPath: ctx.rowPath,
        colPath: ctx.colPath
      }
      const rowResult = this.layoutTemplateRow(
        rootAddr.row,
        listCtx,
        physRowStart,
        physColStart,
        rootAddr,
        instances.length
      )
      const placements = [...rowResult.placements]
      let totalRowSpan = instances.length

      for (const templateRow of bandRows) {
        if (templateRow === rootAddr.row) continue
        const companionResult = this.layoutTemplateRow(
          templateRow,
          listCtx,
          physRowStart + totalRowSpan,
          physColStart,
          null,
          1
        )
        placements.push(...companionResult.placements)
        totalRowSpan += companionResult.rowSpan
      }

      return { rowSpan: totalRowSpan, colSpan: rowResult.colSpan, placements }
    }

    const placements: PhysicalPlacement[] = []
    let totalRowSpan = 0
    let maxColSpan = 0

    for (const instance of instances) {
      const instanceCtx: LayoutContext = {
        rowFilter: instance.filter,
        colFilter: ctx.colFilter,
        rowPath: [...ctx.rowPath, instance.index],
        colPath: ctx.colPath
      }
      const instanceHeight = this.measureSubtreeInstanceHeight(bandRows, rootAddr, instanceCtx)
      const groupMergeHeight = this.measureTemplateRowHeight(rootAddr.row, instanceCtx, null)

      if (this.bandHasMultiRowList(bandRows, instanceCtx)) {
        const bandResult = this.layoutMultiRowListBand(
          bandRows,
          rootAddr,
          instanceCtx,
          physRowStart + totalRowSpan,
          physColStart,
          groupMergeHeight
        )
        placements.push(...bandResult.placements)
        maxColSpan = Math.max(maxColSpan, bandResult.colSpan)
        totalRowSpan += instanceHeight
        continue
      }

      let rowOffset = 0

      for (const templateRow of bandRows) {
        const rowHeight = this.measureTemplateRowHeight(templateRow, instanceCtx, rootAddr)
        const mergeHeight =
          templateRow === rootAddr.row ? groupMergeHeight : instanceHeight - rowOffset
        const rowResult = this.layoutTemplateRow(
          templateRow,
          instanceCtx,
          physRowStart + totalRowSpan + rowOffset,
          physColStart,
          rootAddr,
          mergeHeight
        )
        placements.push(...rowResult.placements)
        rowOffset += rowHeight
        maxColSpan = Math.max(maxColSpan, rowResult.colSpan)
      }

      totalRowSpan += instanceHeight
    }

    return { rowSpan: totalRowSpan, colSpan: maxColSpan, placements }
  }

  private measureSubtreeInstanceHeight(
    bandRows: number[],
    rootAddr: CellAddress,
    ctx: LayoutContext
  ): number {
    let listDrivenHeight = 0
    let companionHeight = 0

    for (const row of bandRows) {
      const listCount = this.listInstanceCountOnRow(row, ctx)
      if (listCount > 0) {
        listDrivenHeight = Math.max(listDrivenHeight, listCount)
        continue
      }
      if (row === rootAddr.row) continue
      companionHeight += this.measureTemplateRowHeight(row, ctx, rootAddr)
    }

    if (listDrivenHeight === 0) {
      return this.measureTemplateRowHeight(rootAddr.row, ctx, null)
    }

    return listDrivenHeight + companionHeight
  }

  private bandHasMultiRowList(bandRows: number[], ctx: LayoutContext): boolean {
    let count = 0
    for (const row of bandRows) {
      if (this.listInstanceCountOnRow(row, ctx) > 0) count++
      if (count > 1) return true
    }
    return false
  }

  private layoutMultiRowListBand(
    bandRows: number[],
    rootAddr: CellAddress,
    ctx: LayoutContext,
    physRowStart: number,
    physColStart: number,
    groupMergeHeight: number
  ): SegmentResult {
    const listRows = bandRows.filter((row) => this.listInstanceCountOnRow(row, ctx) > 0)
    const companionRows = bandRows.filter((row) => !listRows.includes(row))
    const listCount = Math.max(...listRows.map((row) => this.listInstanceCountOnRow(row, ctx)), 1)

    const placements: PhysicalPlacement[] = []
    let maxColSpan = 0

    for (let listIndex = 0; listIndex < listCount; listIndex++) {
      for (const templateRow of listRows) {
        const rowResult = this.layoutTemplateRow(
          templateRow,
          ctx,
          physRowStart + listIndex,
          physColStart,
          templateRow === rootAddr.row ? rootAddr : null,
          groupMergeHeight,
          false,
          listIndex,
          listCount
        )
        placements.push(...rowResult.placements)
        maxColSpan = Math.max(maxColSpan, rowResult.colSpan)
      }
    }

    let rowOffset = listCount
    for (const templateRow of companionRows) {
      const rowResult = this.layoutTemplateRow(
        templateRow,
        ctx,
        physRowStart + rowOffset,
        physColStart,
        null,
        1
      )
      placements.push(...rowResult.placements)
      maxColSpan = Math.max(maxColSpan, rowResult.colSpan)
      rowOffset += rowResult.rowSpan
    }

    return { rowSpan: rowOffset, colSpan: maxColSpan, placements }
  }

  private measureTemplateRowHeight(
    templateRow: number,
    ctx: LayoutContext,
    rootAddr: CellAddress | null
  ): number {
    for (const entry of this.index.bindingsOnRow(templateRow)) {
      if (isNestedRowExpander(entry.binding, this.index)) {
        return this.measureNestedRowBandHeight(entry.addr, entry.binding, templateRow, ctx)
      }
    }

    const listCount = this.listInstanceCountOnRow(templateRow, ctx)
    if (listCount > 0) return listCount

    if (rootAddr && templateRow === rootAddr.row) return 0
    return 1
  }

  private measureNestedRowBandHeight(
    groupAddr: CellAddress,
    groupBinding: ReportBinding,
    templateRow: number,
    ctx: LayoutContext
  ): number {
    const parentFilter = parentFilterForBinding(
      groupBinding,
      this.index,
      ctx.rowFilter,
      ctx.colFilter
    )
    const instances = enumerateExpansionInstances(
      groupBinding,
      this.data,
      mergeFilters(parentFilter, ctx.rowFilter)
    )
    if (instances.length === 0) return 0

    let total = 0
    for (const instance of instances) {
      const instanceCtx: LayoutContext = {
        ...ctx,
        rowFilter: instance.filter,
        rowPath: [...ctx.rowPath, instance.index]
      }
      total += this.listInstanceCountOnRow(templateRow, instanceCtx) || 1
    }
    return total
  }

  private layoutStandaloneRow(
    templateRow: number,
    ctx: LayoutContext,
    physRowStart: number,
    physColStart: number
  ): SegmentResult {
    return this.layoutTemplateRow(
      templateRow,
      ctx,
      physRowStart,
      physColStart,
      null,
      1,
      !this.rowUsesPackedColumns(templateRow)
    )
  }

  private rowUsesPackedColumns(templateRow: number): boolean {
    for (const entry of this.index.bindingsOnRow(templateRow)) {
      if (isColSubtreeRoot(entry.binding, this.index)) return true
      if (isNestedColExpander(entry.binding, this.index)) return true
      if (entry.binding.colParent) {
        const parent = this.index.bindingAt(entry.binding.colParent)
        if (parent && isColExpanding(parent)) return true
      }
    }
    return false
  }

  private layoutTemplateRow(
    templateRow: number,
    ctx: LayoutContext,
    physRowStart: number,
    physColStart: number,
    rowSubtreeRoot: CellAddress | null,
    groupMergeHeight: number,
    preserveLogicalCols = false,
    fixedListIndex?: number,
    mergeListCount?: number
  ): SegmentResult {
    for (const entry of this.index.bindingsOnRow(templateRow)) {
      if (isNestedRowExpander(entry.binding, this.index)) {
        return this.layoutNestedRowBand(
          templateRow,
          entry.addr,
          entry.binding,
          ctx,
          physRowStart,
          physColStart
        )
      }
    }

    const cols = columnsOnRow(this.index, templateRow)
    const placements: PhysicalPlacement[] = []
    let physCol = physColStart
    const packedCols = !preserveLogicalCols && this.rowUsesPackedColumns(templateRow)

    const listCount = this.listInstanceCountOnRow(templateRow, ctx)
    const rowSpan = fixedListIndex !== undefined ? 1 : Math.max(listCount, 1)
    const leadingGap = cols.length > 0 && cols[0]! > physColStart

    for (const col of cols) {
      const addr = { row: templateRow, col }
      const binding = this.index.bindingAt(addr)
      const targetCol = packedCols && !leadingGap ? physCol : col

      if (binding && isColSubtreeRoot(binding, this.index)) {
        const colResult = this.layoutColSubtree(addr, ctx, physRowStart, targetCol)
        placements.push(...colResult.placements)
        if (packedCols) {
          physCol = leadingGap ? targetCol + colResult.colSpan : physCol + colResult.colSpan
        }
        continue
      }

      if (binding && isNestedColExpander(binding, this.index)) {
        const colResult = this.layoutNestedColBand(addr, binding, ctx, physRowStart, targetCol)
        placements.push(...colResult.placements)
        if (packedCols) {
          physCol = leadingGap ? targetCol + colResult.colSpan : physCol + colResult.colSpan
        }
        continue
      }

      if (binding && this.isInlineColChild(templateRow, col)) continue

      if (binding && binding.colParent && !isColExpanding(binding)) {
        const colResult = this.layoutColParentAlignedCell(
          addr,
          binding,
          ctx,
          physRowStart,
          targetCol,
          rowSpan
        )
        placements.push(...colResult.placements)
        if (packedCols) {
          physCol = leadingGap ? targetCol + colResult.colSpan : physCol + colResult.colSpan
        }
        continue
      }

      if (binding) {
        const cellResult = this.layoutBindingCell(
          addr,
          binding,
          ctx,
          physRowStart,
          targetCol,
          rowSpan,
          rowSubtreeRoot,
          groupMergeHeight,
          fixedListIndex,
          mergeListCount
        )
        placements.push(...cellResult.placements)
        if (packedCols) {
          physCol = leadingGap ? targetCol + cellResult.colSpan : physCol + cellResult.colSpan
        }
        continue
      }

      const staticCell = this.index.cellAt(addr)
      if (staticCell) {
        if (rowSpan > 1) {
          for (let i = 0; i < rowSpan; i++) {
            placements.push(
              this.makePlacement(
                addr,
                singleCellRange(physRowStart + i, targetCol),
                ctx,
                undefined,
                i,
                false
              )
            )
          }
        } else {
          placements.push(
            this.makePlacement(
              addr,
              singleCellRange(physRowStart, targetCol),
              ctx,
              undefined,
              0,
              false
            )
          )
        }
        if (packedCols) {
          physCol = leadingGap ? targetCol + 1 : physCol + 1
        }
      }
    }

    const effectiveColSpan = packedCols
      ? leadingGap && cols.length > 0
        ? Math.max(...cols) + 1 - physColStart
        : physCol - physColStart
      : cols.length > 0
        ? Math.max(...cols) + 1 - physColStart
        : 0

    const effectiveRowSpan =
      rowSubtreeRoot && templateRow === rowSubtreeRoot.row && listCount === 0 ? 0 : rowSpan
    return { rowSpan: effectiveRowSpan, colSpan: effectiveColSpan, placements }
  }

  private layoutNestedRowBand(
    templateRow: number,
    groupAddr: CellAddress,
    groupBinding: ReportBinding,
    ctx: LayoutContext,
    physRowStart: number,
    physColStart: number
  ): SegmentResult {
    const parentFilter = parentFilterForBinding(
      groupBinding,
      this.index,
      ctx.rowFilter,
      ctx.colFilter
    )
    const instances = enumerateExpansionInstances(
      groupBinding,
      this.data,
      mergeFilters(parentFilter, ctx.rowFilter)
    )
    if (instances.length === 0) return { rowSpan: 0, colSpan: 0, placements: [] }

    const placements: PhysicalPlacement[] = []
    let rowOffset = 0
    let maxColSpan = 0

    const colOffsets = this.rowLogicalColOffsets(templateRow, physColStart)

    for (const instance of instances) {
      const instanceCtx: LayoutContext = {
        ...ctx,
        rowFilter: instance.filter,
        rowPath: [...ctx.rowPath, instance.index]
      }
      const detailCount = this.listInstanceCountOnRow(templateRow, instanceCtx) || 1

      if (mergeSpanEnabled(groupBinding)) {
        placements.push(
          this.makePlacement(
            groupAddr,
            createRange(
              { row: physRowStart + rowOffset, col: physColStart },
              { row: physRowStart + rowOffset + detailCount - 1, col: physColStart }
            ),
            instanceCtx,
            groupBinding,
            0,
            true
          )
        )
      } else {
        for (let i = 0; i < detailCount; i++) {
          placements.push(
            this.makePlacement(
              groupAddr,
              singleCellRange(physRowStart + rowOffset + i, physColStart),
              instanceCtx,
              groupBinding,
              i,
              false
            )
          )
        }
      }

      for (const entry of this.index.bindingsOnRow(templateRow)) {
        if (sameAddress(entry.addr, groupAddr)) continue
        if (!isRowExpanding(entry.binding) || entry.binding.aggregate !== 'list') continue
        for (let i = 0; i < detailCount; i++) {
          placements.push(
            this.makePlacement(
              entry.addr,
              singleCellRange(physRowStart + rowOffset + i, colOffsets.get(entry.addr.col)!),
              instanceCtx,
              entry.binding,
              i,
              false
            )
          )
        }
      }

      for (const col of columnsOnRow(this.index, templateRow)) {
        if (this.index.bindingAt({ row: templateRow, col })) continue
        const staticCell = this.index.cellAt({ row: templateRow, col })
        if (!staticCell) continue
        for (let i = 0; i < detailCount; i++) {
          placements.push(
            this.makePlacement(
              { row: templateRow, col },
              singleCellRange(physRowStart + rowOffset + i, colOffsets.get(col)!),
              instanceCtx,
              undefined,
              i,
              false
            )
          )
        }
      }

      maxColSpan = Math.max(maxColSpan, colOffsets.size)
      rowOffset += detailCount
    }

    return { rowSpan: rowOffset, colSpan: maxColSpan, placements }
  }

  private layoutBindingCell(
    addr: CellAddress,
    binding: ReportBinding,
    ctx: LayoutContext,
    physRowStart: number,
    physColStart: number,
    rowSpan: number,
    rowSubtreeRoot: CellAddress | null,
    groupMergeHeight: number,
    fixedListIndex?: number,
    mergeListCount?: number
  ): SegmentResult {
    if (
      rowSubtreeRoot &&
      isRowExpanding(binding) &&
      binding.aggregate === 'group' &&
      sameAddress(addr, rowSubtreeRoot)
    ) {
      if (fixedListIndex !== undefined && fixedListIndex > 0) {
        return { rowSpan: 0, colSpan: 1, placements: [] }
      }
      const mergeRows = Math.max(
        fixedListIndex !== undefined ? (mergeListCount ?? groupMergeHeight) : groupMergeHeight,
        1
      )
      if (!mergeSpanEnabled(binding)) {
        const placements = Array.from({ length: mergeRows }, (_, listIndex) =>
          this.makePlacement(
            addr,
            singleCellRange(physRowStart + listIndex, physColStart),
            ctx,
            binding,
            listIndex,
            false
          )
        )
        return { rowSpan: 0, colSpan: 1, placements }
      }
      const range = createRange(
        { row: physRowStart, col: physColStart },
        { row: physRowStart + mergeRows - 1, col: physColStart }
      )
      return {
        rowSpan: 0,
        colSpan: 1,
        placements: [this.makePlacement(addr, range, ctx, binding, 0, true)]
      }
    }

    if (isRowExpanding(binding) && binding.aggregate === 'list') {
      if (fixedListIndex !== undefined) {
        return {
          rowSpan: 0,
          colSpan: 1,
          placements: [
            this.makePlacement(
              addr,
              singleCellRange(physRowStart, physColStart),
              ctx,
              binding,
              fixedListIndex,
              false
            )
          ]
        }
      }
      const placements = Array.from({ length: rowSpan }, (_, listIndex) =>
        this.makePlacement(
          addr,
          singleCellRange(physRowStart + listIndex, physColStart),
          ctx,
          binding,
          listIndex,
          false
        )
      )
      return { rowSpan: 0, colSpan: 1, placements }
    }

    return {
      rowSpan: 0,
      colSpan: 1,
      placements: [
        this.makePlacement(
          addr,
          expandRows(singleCellRange(physRowStart, physColStart), rowSpan),
          ctx,
          binding,
          0,
          mergeSpanEnabled(binding) && rowSpan > 1
        )
      ]
    }
  }

  private layoutColSubtree(
    rootAddr: CellAddress,
    ctx: LayoutContext,
    physRowStart: number,
    physColStart: number
  ): SegmentResult {
    const rootBinding = this.index.bindingAt(rootAddr)!
    const parentFilter = parentFilterForBinding(
      rootBinding,
      this.index,
      ctx.rowFilter,
      ctx.colFilter
    )
    const instances = enumerateExpansionInstances(
      rootBinding,
      this.data,
      mergeFilters(parentFilter, ctx.colFilter)
    )

    if (instances.length === 0) return { rowSpan: 0, colSpan: 0, placements: [] }

    const placements: PhysicalPlacement[] = []
    let totalColSpan = 0

    for (const instance of instances) {
      const instanceCtx: LayoutContext = {
        rowFilter: ctx.rowFilter,
        colFilter: instance.filter,
        rowPath: ctx.rowPath,
        colPath: [...ctx.colPath, instance.index]
      }
      const width = this.colInstanceWidth(rootAddr, instanceCtx)
      const range = createRange(
        { row: physRowStart, col: physColStart + totalColSpan },
        { row: physRowStart, col: physColStart + totalColSpan + width - 1 }
      )
      placements.push(
        this.makePlacement(
          rootAddr,
          range,
          instanceCtx,
          rootBinding,
          rootBinding.aggregate === 'list' ? instance.index : 0,
          mergeSpanEnabled(rootBinding)
        )
      )
      totalColSpan += width
    }

    return { rowSpan: 1, colSpan: totalColSpan, placements }
  }

  private layoutNestedColBand(
    addr: CellAddress,
    binding: ReportBinding,
    ctx: LayoutContext,
    physRowStart: number,
    physColStart: number
  ): SegmentResult {
    const parentAddr = binding.colParent!
    const parentBinding = this.index.bindingAt(parentAddr)!
    const parentFilter = parentFilterForBinding(
      parentBinding,
      this.index,
      ctx.rowFilter,
      ctx.colFilter
    )
    const parentInstances = enumerateExpansionInstances(
      parentBinding,
      this.data,
      mergeFilters(parentFilter, ctx.colFilter)
    )

    const placements: PhysicalPlacement[] = []
    let colOffset = 0

    for (const parentInstance of parentInstances) {
      const bandCtx: LayoutContext = {
        ...ctx,
        colFilter: parentInstance.filter,
        colPath: [...ctx.colPath, parentInstance.index]
      }
      const childFilter = parentFilterForBinding(
        binding,
        this.index,
        bandCtx.rowFilter,
        bandCtx.colFilter
      )
      const childInstances = enumerateExpansionInstances(
        binding,
        this.data,
        mergeFilters(childFilter, bandCtx.colFilter)
      )

      for (const childInstance of childInstances) {
        const childCtx: LayoutContext = {
          ...bandCtx,
          colFilter: childInstance.filter,
          colPath: [...bandCtx.colPath, childInstance.index]
        }
        placements.push(
          this.makePlacement(
            addr,
            singleCellRange(physRowStart, physColStart + colOffset),
            childCtx,
            binding,
            0,
            false
          )
        )
        colOffset++
      }
    }

    return { rowSpan: 1, colSpan: colOffset, placements }
  }

  private colInstanceWidth(rootAddr: CellAddress, ctx: LayoutContext): number {
    const nestedChild = findNestedColChild(rootAddr, this.index)
    if (nestedChild) {
      const binding = this.index.bindingAt(nestedChild)!
      const parentFilter = parentFilterForBinding(binding, this.index, ctx.rowFilter, ctx.colFilter)
      const instances = enumerateExpansionInstances(
        binding,
        this.data,
        mergeFilters(parentFilter, ctx.colFilter)
      )
      return Math.max(instances.length, 1)
    }

    const rootBinding = this.index.bindingAt(rootAddr)!
    if (!mergeSpanEnabled(rootBinding)) return 1

    let width = 0
    for (const col of colSubtreeCols(rootAddr, this.index)) {
      if (col <= rootAddr.col) continue
      if (
        this.index.bindingAt({ row: rootAddr.row, col }) ||
        this.index.cellAt({ row: rootAddr.row, col })
      ) {
        width++
      }
    }
    return Math.max(width, 1)
  }

  private layoutColParentAlignedCell(
    addr: CellAddress,
    binding: ReportBinding,
    ctx: LayoutContext,
    physRowStart: number,
    physColStart: number,
    rowSpan: number
  ): SegmentResult {
    const colParent = binding.colParent!
    const parentBinding = this.index.bindingAt(colParent)!
    const parentFilter = parentFilterForBinding(
      parentBinding,
      this.index,
      ctx.rowFilter,
      ctx.colFilter
    )
    const instances = enumerateExpansionInstances(
      parentBinding,
      this.data,
      mergeFilters(parentFilter, ctx.colFilter)
    )

    if (instances.length === 0) return { rowSpan: 0, colSpan: 0, placements: [] }

    const placements: PhysicalPlacement[] = []
    let colOffset = 0

    for (const instance of instances) {
      const instanceCtx: LayoutContext = {
        rowFilter: ctx.rowFilter,
        colFilter: instance.filter,
        rowPath: ctx.rowPath,
        colPath: [...ctx.colPath, instance.index]
      }
      const width = this.colInstanceWidth(colParent, instanceCtx)
      placements.push(
        this.makePlacement(
          addr,
          expandRows(singleCellRange(physRowStart, physColStart + colOffset), rowSpan),
          instanceCtx,
          binding,
          0,
          mergeSpanEnabled(binding) && rowSpan > 1
        )
      )
      colOffset += width
    }

    return { rowSpan: 0, colSpan: colOffset, placements }
  }

  private isInlineColChild(row: number, col: number): boolean {
    const binding = this.index.bindingAt({ row, col })
    if (!binding?.colParent) return false
    const parent = this.index.bindingAt(binding.colParent)
    if (!parent || !isColExpanding(parent)) return false
    return binding.colParent.row === row
  }

  private listInstanceCountOnRow(templateRow: number, ctx: LayoutContext): number {
    let count = 0
    for (const entry of this.index.bindingsOnRow(templateRow)) {
      if (!isRowExpanding(entry.binding) || entry.binding.aggregate !== 'list') continue
      const parentFilter = parentFilterForBinding(
        entry.binding,
        this.index,
        ctx.rowFilter,
        ctx.colFilter
      )
      const instances = enumerateExpansionInstances(
        entry.binding,
        this.data,
        mergeFilters(parentFilter, ctx.rowFilter)
      )
      count = Math.max(count, instances.length)
    }
    return count
  }

  private rowLogicalColOffsets(templateRow: number, physColStart: number): Map<number, number> {
    const offsets = new Map<number, number>()
    let physCol = physColStart
    for (const col of columnsOnRow(this.index, templateRow)) {
      offsets.set(col, physCol)
      physCol++
    }
    return offsets
  }

  private makePlacement(
    logical: CellAddress,
    physical: CellRange,
    ctx: LayoutContext,
    binding: ReportBinding | undefined,
    listIndex: number,
    mergeSpan: boolean
  ): PhysicalPlacement {
    return {
      logical,
      physical,
      rowPath: ctx.rowPath,
      colPath: ctx.colPath,
      mergeSpan,
      binding,
      listIndex
    }
  }
}

function emptyCtx(): LayoutContext {
  return { rowFilter: {}, colFilter: {}, rowPath: [], colPath: [] }
}

function expandRows(range: CellRange, rowSpan: number): CellRange {
  if (rowSpan <= 1) return range
  return createRange(range.start, { row: range.start.row + rowSpan - 1, col: range.end.col })
}

/** 将模板合并区域映射到物理网格（基于锚点格的物理落点） */
export function mapTemplateMerges(
  index: TemplateIndex,
  placements: PhysicalPlacement[]
): CellRange[] {
  const layout: ExpansionLayout = { rowCount: 0, colCount: 0, placements, mappedMerges: [] }
  const mapped: CellRange[] = []
  for (const merge of index.merges) {
    const mappedRange = mapLogicalMerge(merge, layout)
    if (mappedRange) mapped.push(mappedRange)
  }
  return mapped
}

function mapLogicalMerge(merge: CellRange, layout: ExpansionLayout): CellRange | null {
  const startHits = placementsAt(layout, merge.start)
  if (startHits.length === 0) return null
  const startPlacement = startHits[0]!
  const endHits = placementsAt(layout, merge.end)
  if (endHits.length > 0) {
    return createRange(startPlacement.physical.start, endHits[endHits.length - 1]!.physical.end)
  }
  const logicalRowSpan = merge.end.row - merge.start.row
  const logicalColSpan = merge.end.col - merge.start.col
  return createRange(startPlacement.physical.start, {
    row: startPlacement.physical.start.row + logicalRowSpan,
    col: startPlacement.physical.start.col + logicalColSpan
  })
}

/** 计算扩展坐标系：逻辑格 → 物理区间映射（纯计算、无快照输出） */
export function computeExpansionLayout(
  index: TemplateIndex,
  data: DatasetRecords
): ExpansionLayout {
  return new CoordinateEngine(index, data).compute()
}

/** 按逻辑地址查找全部物理落点 */
export function placementsAt(layout: ExpansionLayout, addr: CellAddress): PhysicalPlacement[] {
  return layout.placements.filter((p) => sameAddress(p.logical, addr))
}

/** 物理区间行高（含合并） */
export function physicalRowSpan(placement: PhysicalPlacement): number {
  return rangeRows(placement.physical)
}

/** 物理区间列宽（含合并） */
export function physicalColSpan(placement: PhysicalPlacement): number {
  return rangeCols(placement.physical)
}
