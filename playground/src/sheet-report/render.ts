import type { CellAddress, CellRange } from '@veltra/sheet-core'
import type { CellSnapshotItem, CellStyle, CellType, CellValue } from '@veltra/sheet-core'
import type { SheetSnapshot } from '@veltra/sheet-core'
import { StylePool } from '@veltra/sheet-core'

import { REPORT_META_NAMESPACE, resolveReportRole } from './binding'
import { evaluateConditionalStyle } from './rules'
import type { DatasetRecords, ReportAggregate, ReportBinding } from './types'

/** 数据集 id → 行记录 */
export type { DatasetRecords } from './types'

interface BindingCell {
  addr: CellAddress
  binding: ReportBinding
}

type TemplateRowKind = 'static' | 'expansion' | 'subtotal' | 'grandTotal' | 'matrixHeader'

interface ExpansionBlock {
  expansionRows: number[]
  subtotalRows: number[]
}

interface MatrixLayout {
  datasetId: string
  cornerRow: number
  cornerCol: number
  headerRow: number
  rowHeaderCol: number
  colGroup: BindingCell
  rowGroup: BindingCell
  matrixCells: BindingCell[]
  rowSubtotalCells: BindingCell[]
  colSubtotalCells: BindingCell[]
  grandTotalCells: BindingCell[]
}

/** 将 mock 字段值写入单元格快照 */
function toCellValue(value: unknown): { v: CellValue; t?: CellType } {
  if (value === null || value === undefined) return { v: '' }
  if (typeof value === 'number' && !Number.isNaN(value)) return { v: value, t: 'n' }
  if (typeof value === 'boolean') return { v: value, t: 'b' }
  if (typeof value === 'string') return { v: value, t: 's' }
  if (value instanceof Date) return { v: value.toISOString().slice(0, 10), t: 's' }
  return { v: JSON.stringify(value), t: 's' }
}

function bindingAt(template: SheetSnapshot, addr: CellAddress): ReportBinding | undefined {
  const item = template.meta?.find(
    (m) => m.row === addr.row && m.col === addr.col && m.namespace === REPORT_META_NAMESPACE
  )
  return item?.payload as ReportBinding | undefined
}

function templateCell(
  template: SheetSnapshot,
  row: number,
  col: number
): CellSnapshotItem | undefined {
  return template.cells.find((c) => c.row === row && c.col === col)
}

function bindingCells(template: SheetSnapshot): BindingCell[] {
  const cells: BindingCell[] = []
  for (const item of template.meta ?? []) {
    if (item.namespace !== REPORT_META_NAMESPACE) continue
    cells.push({ addr: { row: item.row, col: item.col }, binding: item.payload as ReportBinding })
  }
  return cells
}

function templateRows(template: SheetSnapshot): number[] {
  const rows = new Set<number>()
  for (const cell of template.cells) rows.add(cell.row)
  for (const item of template.meta ?? []) rows.add(item.row)
  return [...rows].sort((a, b) => a - b)
}

function bindingsOnRow(template: SheetSnapshot, row: number): BindingCell[] {
  return bindingCells(template).filter((c) => c.addr.row === row)
}

function classifyTemplateRow(template: SheetSnapshot, row: number): TemplateRowKind {
  const bindings = bindingsOnRow(template, row)
  if (bindings.length === 0) return 'static'

  const roles = bindings.map((c) => resolveReportRole(c.binding))
  if (roles.some((role) => role === 'matrix')) return 'matrixHeader'
  if (roles.some((role) => role === 'grandTotal')) return 'grandTotal'
  if (roles.some((role) => role === 'subtotal')) return 'subtotal'
  if (roles.some((role) => role === 'group' || role === 'detail')) return 'expansion'
  return 'static'
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

function aggregateField(
  rows: Record<string, unknown>[],
  field: string,
  aggregate: ReportAggregate
): unknown {
  if (aggregate === 'count') return rows.length
  if (aggregate === 'select' || aggregate === 'group') {
    return rows[0]?.[field]
  }

  const numbers = rows
    .map((row) => row[field])
    .map((value) => (typeof value === 'number' ? value : Number(value)))
    .filter((value) => Number.isFinite(value))

  if (numbers.length === 0) return 0
  const sum = numbers.reduce((acc, value) => acc + value, 0)
  if (aggregate === 'avg') return sum / numbers.length
  return sum
}

class StyleResolver {
  private readonly pool = new StylePool()

  constructor(private readonly template: SheetSnapshot) {
    if (template.styles.length > 0) this.pool.restore(template.styles)
  }

  resolve(
    templateRow: number,
    templateCol: number,
    cellValue: unknown,
    binding?: ReportBinding
  ): number | undefined {
    const tpl = templateCell(this.template, templateRow, templateCol)
    const baseStyle = tpl?.s !== undefined ? this.pool.get(tpl.s) : undefined
    const merged = evaluateConditionalStyle(cellValue, baseStyle, binding?.conditionalRules)
    if (!merged) return tpl?.s
    if (merged === baseStyle) return tpl?.s
    return this.pool.intern(merged)
  }

  snapshot(): CellStyle[] {
    return this.pool.snapshot()
  }
}

class FilledReportBuilder {
  readonly cells: CellSnapshotItem[] = []
  readonly merges: CellRange[] = []
  private rowCursor = 0

  constructor(
    readonly template: SheetSnapshot,
    readonly styles: StyleResolver
  ) {}

  get rowCount(): number {
    return this.rowCursor
  }

  get currentRow(): number {
    return this.rowCursor
  }

  advanceRow(): void {
    this.rowCursor++
  }

  emitStaticTemplateRow(templateRow: number): void {
    for (const cell of this.template.cells) {
      if (cell.row !== templateRow) continue
      if (bindingAt(this.template, { row: cell.row, col: cell.col })) continue
      const item: CellSnapshotItem = { ...cell, row: this.rowCursor }
      item.s = this.styles.resolve(templateRow, cell.col, cell.v)
      this.cells.push(item)
    }
    this.rowCursor++
  }

  emitFilledBindingCell(
    templateRow: number,
    templateCol: number,
    value: unknown,
    binding?: ReportBinding
  ): void {
    const item: CellSnapshotItem = { row: this.rowCursor, col: templateCol, ...toCellValue(value) }
    const styleId = this.styles.resolve(templateRow, templateCol, value, binding)
    if (styleId !== undefined) item.s = styleId
    this.cells.push(item)
  }

  emitAggregateRow(templateRow: number, dataRows: Record<string, unknown>[]): void {
    for (const cell of this.template.cells) {
      if (cell.row !== templateRow) continue
      if (bindingAt(this.template, { row: cell.row, col: cell.col })) continue
      const item: CellSnapshotItem = { ...cell, row: this.rowCursor }
      item.s = this.styles.resolve(templateRow, cell.col, cell.v)
      this.cells.push(item)
    }

    for (const { addr, binding } of bindingsOnRow(this.template, templateRow)) {
      const role = resolveReportRole(binding)
      if (role !== 'subtotal' && role !== 'grandTotal') continue
      const value = aggregateField(dataRows, binding.field, binding.aggregate)
      this.emitFilledBindingCell(templateRow, addr.col, value, binding)
    }

    this.rowCursor++
  }

  emitDetailBand(
    templateRow: number,
    dataRows: Record<string, unknown>[],
    groupValues: Array<{ col: number; value: unknown }>
  ): number {
    if (dataRows.length === 0) return 0

    const startRow = this.rowCursor
    const listBindings = bindingsOnRow(this.template, templateRow).filter(
      (c) => resolveReportRole(c.binding) === 'detail'
    )

    for (let i = 0; i < dataRows.length; i++) {
      const dataRow = dataRows[i]!

      for (const group of groupValues) {
        if (i > 0) continue
        this.emitFilledBindingCell(templateRow, group.col, group.value)
      }

      for (const cell of this.template.cells) {
        if (cell.row !== templateRow) continue
        if (bindingAt(this.template, { row: cell.row, col: cell.col })) continue
        const item: CellSnapshotItem = { ...cell, row: this.rowCursor }
        item.s = this.styles.resolve(templateRow, cell.col, cell.v)
        this.cells.push(item)
      }

      for (const { addr, binding } of listBindings) {
        this.emitFilledBindingCell(templateRow, addr.col, dataRow[binding.field], binding)
      }

      this.rowCursor++
    }

    for (const group of groupValues) {
      if (dataRows.length <= 1) continue
      this.merges.push({
        start: { row: startRow, col: group.col },
        end: { row: startRow + dataRows.length - 1, col: group.col }
      })
    }

    return dataRows.length
  }
}

function isGroupBinding(binding: ReportBinding): boolean {
  return binding.aggregate === 'group'
}

function groupBindingsOnRow(template: SheetSnapshot, row: number): BindingCell[] {
  return bindingsOnRow(template, row).filter((c) => isGroupBinding(c.binding))
}

function expansionBlocks(template: SheetSnapshot): ExpansionBlock[] {
  const rows = templateRows(template)
  const blocks: ExpansionBlock[] = []
  let index = 0

  while (index < rows.length) {
    const row = rows[index]!
    const kind = classifyTemplateRow(template, row)
    if (kind !== 'expansion') {
      index++
      continue
    }

    const expansionRows: number[] = [row]
    index++
    while (index < rows.length) {
      const nextRow = rows[index]!
      const nextKind = classifyTemplateRow(template, nextRow)
      if (nextKind === 'expansion') {
        expansionRows.push(nextRow)
        index++
        continue
      }
      if (nextKind === 'subtotal') {
        const subtotalRows: number[] = []
        while (index < rows.length && classifyTemplateRow(template, rows[index]!) === 'subtotal') {
          subtotalRows.push(rows[index]!)
          index++
        }
        blocks.push({ expansionRows, subtotalRows })
        break
      }
      blocks.push({ expansionRows, subtotalRows: [] })
      break
    }

    if (index >= rows.length && expansionRows.length > 0) {
      const last = blocks[blocks.length - 1]
      if (!last || last.expansionRows[0] !== expansionRows[0]) {
        blocks.push({ expansionRows, subtotalRows: [] })
      }
    }
  }

  return blocks
}

function blockRootRow(block: ExpansionBlock): number {
  return block.expansionRows[0]!
}

function isBlockChildRow(template: SheetSnapshot, row: number): boolean {
  for (const block of expansionBlocks(template)) {
    if (block.expansionRows.includes(row) && row !== blockRootRow(block)) return true
    if (block.subtotalRows.includes(row)) return true
  }
  return false
}

function expandNestedGroups(
  template: SheetSnapshot,
  data: DatasetRecords,
  builder: FilledReportBuilder,
  block: ExpansionBlock,
  ancestorFilter: Record<string, unknown>
): void {
  const datasetId = bindingCells(template).find((c) => block.expansionRows.includes(c.addr.row))
    ?.binding.dataset
  if (!datasetId) return

  const datasetRows = data[datasetId] ?? []
  const scoped = filterRows(datasetRows, ancestorFilter)

  function walk(
    level: number,
    filter: Record<string, unknown>,
    rows: Record<string, unknown>[]
  ): void {
    if (level >= block.expansionRows.length) {
      const detailRow = block.expansionRows[block.expansionRows.length - 1]!
      builder.emitDetailBand(
        detailRow,
        rows,
        groupBindingsOnRow(template, detailRow).map((group) => ({
          col: group.addr.col,
          value: filter[group.binding.field]
        }))
      )
      return
    }

    const templateRow = block.expansionRows[level]!
    const groups = groupBindingsOnRow(template, templateRow)
    const group = groups[0]
    if (!group) {
      walk(level + 1, filter, rows)
      return
    }

    const groupValues = sortValues(
      distinctFieldValues(rows, group.binding.field),
      group.binding.sort
    )

    for (const groupValue of groupValues) {
      const nextFilter = { ...filter, [group.binding.field]: groupValue }
      const instanceRows = filterRows(datasetRows, nextFilter)

      if (level < block.expansionRows.length - 1) {
        walk(level + 1, nextFilter, instanceRows)
        if (level === 0) {
          for (const subtotalRow of block.subtotalRows) {
            builder.emitAggregateRow(subtotalRow, instanceRows)
          }
        }
        continue
      }

      builder.emitDetailBand(
        templateRow,
        instanceRows,
        groups.map((item) => ({ col: item.addr.col, value: groupValue }))
      )
    }
  }

  walk(0, ancestorFilter, scoped)
}

function expandGroupBlock(
  template: SheetSnapshot,
  data: DatasetRecords,
  block: ExpansionBlock,
  builder: FilledReportBuilder,
  ancestorFilter: Record<string, unknown>
): void {
  const rootRow = blockRootRow(block)
  const rootGroups = groupBindingsOnRow(template, rootRow)
  if (rootGroups.length === 0) return

  const datasetId = rootGroups[0]!.binding.dataset
  const datasetRows = data[datasetId] ?? []
  const scoped = filterRows(datasetRows, ancestorFilter)

  if (block.expansionRows.length > 1) {
    expandNestedGroups(template, data, builder, block, ancestorFilter)
    return
  }

  const group = rootGroups[0]!
  const groupValues = sortValues(
    distinctFieldValues(scoped, group.binding.field),
    group.binding.sort
  )

  for (const groupValue of groupValues) {
    const filter = { ...ancestorFilter, [group.binding.field]: groupValue }
    const instanceRows = filterRows(datasetRows, filter)

    builder.emitDetailBand(rootRow, instanceRows, [{ col: group.addr.col, value: groupValue }])

    for (const subtotalRow of block.subtotalRows) {
      builder.emitAggregateRow(subtotalRow, instanceRows)
    }
  }
}

function detectMatrixLayout(template: SheetSnapshot): MatrixLayout | null {
  const matrixCells = bindingCells(template).filter(
    (c) => resolveReportRole(c.binding) === 'matrix'
  )
  if (matrixCells.length === 0) return null

  const colGroup = bindingCells(template).find(
    (c) => resolveReportRole(c.binding) === 'group' && c.addr.row < c.addr.col
  )
  const rowGroup = bindingCells(template).find(
    (c) => resolveReportRole(c.binding) === 'group' && c.addr.col < c.addr.row
  )
  if (!colGroup || !rowGroup) return null

  const cornerRow = Math.min(colGroup.addr.row, rowGroup.addr.row)
  const cornerCol = Math.min(colGroup.addr.col, rowGroup.addr.col)
  const headerRow = colGroup.addr.row
  const rowHeaderCol = rowGroup.addr.col
  const datasetId = matrixCells[0]!.binding.dataset

  const matrixRow = matrixCells[0]!.addr.row
  const matrixCol = matrixCells[0]!.addr.col
  const totalRow = matrixRow + 1

  return {
    datasetId,
    cornerRow,
    cornerCol,
    headerRow,
    rowHeaderCol,
    colGroup,
    rowGroup,
    matrixCells,
    rowSubtotalCells: bindingCells(template).filter(
      (c) =>
        resolveReportRole(c.binding) === 'subtotal' &&
        c.addr.row === matrixRow &&
        c.addr.col > matrixCol
    ),
    colSubtotalCells: bindingCells(template).filter(
      (c) => resolveReportRole(c.binding) === 'subtotal' && c.addr.row === totalRow
    ),
    grandTotalCells: bindingCells(template).filter(
      (c) => resolveReportRole(c.binding) === 'grandTotal'
    )
  }
}

function isMatrixTemplateRow(template: SheetSnapshot, row: number): boolean {
  const layout = detectMatrixLayout(template)
  if (!layout) return false
  return row > layout.headerRow
}

function expandMatrixReport(
  template: SheetSnapshot,
  data: DatasetRecords,
  builder: FilledReportBuilder,
  layout: MatrixLayout
): void {
  const datasetRows = data[layout.datasetId] ?? []
  const rowValues = sortValues(
    distinctFieldValues(datasetRows, layout.rowGroup.binding.field),
    layout.rowGroup.binding.sort
  )
  const colValues = sortValues(
    distinctFieldValues(datasetRows, layout.colGroup.binding.field),
    layout.colGroup.binding.sort
  )

  const matrixRow = layout.matrixCells[0]!.addr.row
  const matrixCol = layout.matrixCells[0]!.addr.col
  const totalRow = matrixRow + 1

  for (const cell of template.cells) {
    if (cell.row !== layout.headerRow) continue
    if (bindingAt(template, { row: cell.row, col: cell.col })) continue
    const item: CellSnapshotItem = { ...cell, row: builder.currentRow }
    item.s = builder.styles.resolve(layout.headerRow, cell.col, cell.v)
    builder.cells.push(item)
  }

  let colCursor = layout.colGroup.addr.col
  for (const colValue of colValues) {
    builder.emitFilledBindingCell(layout.headerRow, colCursor, colValue, layout.colGroup.binding)
    colCursor++
  }

  builder.advanceRow()

  for (const rowValue of rowValues) {
    builder.emitFilledBindingCell(matrixRow, layout.rowHeaderCol, rowValue, layout.rowGroup.binding)

    let dataCol = matrixCol
    for (const colValue of colValues) {
      const scoped = filterRows(datasetRows, {
        [layout.rowGroup.binding.field]: rowValue,
        [layout.colGroup.binding.field]: colValue
      })
      const binding = layout.matrixCells[0]!
      const value = aggregateField(scoped, binding.binding.field, binding.binding.aggregate)
      builder.emitFilledBindingCell(matrixRow, dataCol, value, binding.binding)
      dataCol++
    }

    for (const subtotal of layout.rowSubtotalCells) {
      const scoped = filterRows(datasetRows, { [layout.rowGroup.binding.field]: rowValue })
      const value = aggregateField(scoped, subtotal.binding.field, subtotal.binding.aggregate)
      builder.emitFilledBindingCell(matrixRow, subtotal.addr.col, value, subtotal.binding)
    }

    builder.advanceRow()
  }

  const hasColSubtotal = layout.colSubtotalCells.length > 0 || layout.grandTotalCells.length > 0
  if (hasColSubtotal) {
    for (const cell of template.cells) {
      if (cell.row !== totalRow) continue
      if (bindingAt(template, { row: cell.row, col: cell.col })) continue
      const item: CellSnapshotItem = { ...cell, row: builder.currentRow }
      item.s = builder.styles.resolve(totalRow, cell.col, cell.v)
      builder.cells.push(item)
    }

    let totalCol = matrixCol
    for (const colValue of colValues) {
      const scoped = filterRows(datasetRows, { [layout.colGroup.binding.field]: colValue })
      const subtotal = layout.colSubtotalCells[0]
      if (subtotal) {
        const value = aggregateField(scoped, subtotal.binding.field, subtotal.binding.aggregate)
        builder.emitFilledBindingCell(totalRow, totalCol, value, subtotal.binding)
      }
      totalCol++
    }

    for (const grandTotal of layout.grandTotalCells) {
      const value = aggregateField(
        datasetRows,
        grandTotal.binding.field,
        grandTotal.binding.aggregate
      )
      builder.emitFilledBindingCell(totalRow, grandTotal.addr.col, value, grandTotal.binding)
    }

    builder.advanceRow()
  }
}

function isGroupExpansionRoot(template: SheetSnapshot, row: number): boolean {
  if (isBlockChildRow(template, row)) return false
  return expansionBlocks(template).some((block) => blockRootRow(block) === row)
}

function isConsumedByParent(template: SheetSnapshot, row: number): boolean {
  if (isMatrixTemplateRow(template, row)) return true
  return isBlockChildRow(template, row)
}

/**
 * 将 Report Template 按 Dataset 渲染为 Filled Report 快照。
 * 基于 5 大语义角色（group/detail/subtotal/grandTotal/matrix）展开。
 */
export function renderReport(template: SheetSnapshot, data: DatasetRecords): SheetSnapshot {
  const styles = new StyleResolver(template)
  const builder = new FilledReportBuilder(template, styles)
  const matrixLayout = detectMatrixLayout(template)

  for (const templateRow of templateRows(template)) {
    if (isConsumedByParent(template, templateRow)) continue

    if (matrixLayout && templateRow === matrixLayout.headerRow) {
      expandMatrixReport(template, data, builder, matrixLayout)
      continue
    }

    const kind = classifyTemplateRow(template, templateRow)
    if (kind === 'grandTotal') {
      const datasetId =
        bindingsOnRow(template, templateRow)[0]?.binding.dataset ??
        bindingCells(template)[0]?.binding.dataset
      const datasetRows = datasetId ? (data[datasetId] ?? []) : []
      builder.emitAggregateRow(templateRow, datasetRows)
      continue
    }

    if (isGroupExpansionRoot(template, templateRow)) {
      const block = expansionBlocks(template).find((item) => blockRootRow(item) === templateRow)
      if (block) expandGroupBlock(template, data, block, builder, {})
      continue
    }

    if (kind === 'static') {
      builder.emitStaticTemplateRow(templateRow)
    }
  }

  const staticMerges = template.merges.filter((merge) => {
    const row = merge.start.row
    return !isConsumedByParent(template, row) && !isGroupExpansionRoot(template, row)
  })

  return {
    cells: builder.cells,
    styles: styles.snapshot(),
    merges: [...staticMerges, ...builder.merges],
    frozen: template.frozen,
    rows: builder.rowCount,
    cols: template.cols
  }
}
