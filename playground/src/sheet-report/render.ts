import type { CellAddress, CellRange } from '@veltra/sheet-core'
import type { CellSnapshotItem, CellType, CellValue } from '@veltra/sheet-core'
import type { SheetSnapshot } from '@veltra/sheet-core'

import { REPORT_META_NAMESPACE, resolveLeftParent } from './binding'
import type { DatasetRecords, ReportBinding } from './types'

/** 数据集 id → 行记录 */
export type { DatasetRecords } from './types'

interface BindingCell {
  addr: CellAddress
  binding: ReportBinding
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

function getBindingAt(template: SheetSnapshot) {
  return (addr: CellAddress) => bindingAt(template, addr)
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

function isConsumedByParent(template: SheetSnapshot, row: number): boolean {
  for (const { addr, binding } of bindingsOnRow(template, row)) {
    const parent = resolveLeftParent(binding, addr, getBindingAt(template))
    if (parent) return true
  }
  return false
}

function isGroupExpansionRoot(template: SheetSnapshot, row: number): BindingCell | null {
  for (const cell of bindingsOnRow(template, row)) {
    if (cell.binding.aggregate !== 'group' || cell.binding.expand !== 'down') continue
    if (resolveLeftParent(cell.binding, cell.addr, getBindingAt(template))) continue
    return cell
  }
  return null
}

function childTemplateRows(template: SheetSnapshot, parentAddr: CellAddress): number[] {
  const rows = new Set<number>()
  for (const { addr, binding } of bindingCells(template)) {
    const parent = resolveLeftParent(binding, addr, getBindingAt(template))
    if (parent && parent.row === parentAddr.row && parent.col === parentAddr.col) {
      rows.add(addr.row)
    }
  }
  return [...rows].sort((a, b) => a - b)
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

function sumField(rows: Record<string, unknown>[], field: string): number {
  return rows.reduce((acc, row) => {
    const value = row[field]
    const num = typeof value === 'number' ? value : Number(value)
    return acc + (Number.isFinite(num) ? num : 0)
  }, 0)
}

class FilledReportBuilder {
  readonly cells: CellSnapshotItem[] = []
  readonly merges: CellRange[] = []
  private rowCursor = 0

  constructor(readonly template: SheetSnapshot) {}

  get rowCount(): number {
    return this.rowCursor
  }

  get currentRow(): number {
    return this.rowCursor
  }

  emitStaticTemplateRow(templateRow: number): void {
    for (const cell of this.template.cells) {
      if (cell.row !== templateRow) continue
      if (bindingAt(this.template, { row: cell.row, col: cell.col })) continue
      this.cells.push({ ...cell, row: this.rowCursor })
    }
    this.rowCursor++
  }

  emitDetailBand(
    templateRow: number,
    dataRows: Record<string, unknown>[],
    groupValue: unknown,
    groupAddr: CellAddress
  ): number {
    if (dataRows.length === 0) return 0

    const startRow = this.rowCursor
    const groupTemplate = templateCell(this.template, groupAddr.row, groupAddr.col)
    const listBindings = bindingsOnRow(this.template, templateRow).filter(
      (c) => c.binding.aggregate === 'select' && c.binding.expand === 'down'
    )

    for (let i = 0; i < dataRows.length; i++) {
      const dataRow = dataRows[i]!

      if (i === 0) {
        const groupCell: CellSnapshotItem = {
          row: this.rowCursor,
          col: groupAddr.col,
          ...toCellValue(groupValue)
        }
        if (groupTemplate?.s !== undefined) groupCell.s = groupTemplate.s
        this.cells.push(groupCell)
      }

      for (const cell of this.template.cells) {
        if (cell.row !== templateRow) continue
        if (bindingAt(this.template, { row: cell.row, col: cell.col })) continue
        this.cells.push({ ...cell, row: this.rowCursor })
      }

      for (const { addr, binding } of listBindings) {
        const tpl = templateCell(this.template, templateRow, addr.col)
        const item: CellSnapshotItem = {
          row: this.rowCursor,
          col: addr.col,
          ...toCellValue(dataRow[binding.field])
        }
        if (tpl?.s !== undefined) item.s = tpl.s
        this.cells.push(item)
      }

      this.rowCursor++
    }

    const count = dataRows.length
    if (count > 1) {
      this.merges.push({
        start: { row: startRow, col: groupAddr.col },
        end: { row: startRow + count - 1, col: groupAddr.col }
      })
    }
    return count
  }

  emitSubtotalRow(templateRow: number, dataRows: Record<string, unknown>[]): void {
    for (const cell of this.template.cells) {
      if (cell.row !== templateRow) continue
      if (bindingAt(this.template, { row: cell.row, col: cell.col })) continue
      this.cells.push({ ...cell, row: this.rowCursor })
    }

    for (const { addr, binding } of bindingsOnRow(this.template, templateRow)) {
      if (binding.aggregate !== 'sum') continue
      const tpl = templateCell(this.template, templateRow, addr.col)
      const item: CellSnapshotItem = {
        row: this.rowCursor,
        col: addr.col,
        ...toCellValue(sumField(dataRows, binding.field))
      }
      if (tpl?.s !== undefined) item.s = tpl.s
      this.cells.push(item)
    }

    this.rowCursor++
  }
}

function expandGroupBlock(
  template: SheetSnapshot,
  data: DatasetRecords,
  group: BindingCell,
  builder: FilledReportBuilder,
  ancestorFilter: Record<string, unknown>
): void {
  const datasetRows = data[group.binding.dataset] ?? []
  const scoped = filterRows(datasetRows, ancestorFilter)
  const groupValues = distinctFieldValues(scoped, group.binding.field)
  const childRows = childTemplateRows(template, group.addr)

  for (const groupValue of groupValues) {
    const filter = { ...ancestorFilter, [group.binding.field]: groupValue }
    const instanceRows = filterRows(datasetRows, filter)

    for (const childTemplateRow of childRows) {
      const rowBindings = bindingsOnRow(template, childTemplateRow)
      const isSubtotal = rowBindings.some((c) => c.binding.aggregate === 'sum')

      if (isSubtotal) {
        builder.emitSubtotalRow(childTemplateRow, instanceRows)
      } else {
        builder.emitDetailBand(childTemplateRow, instanceRows, groupValue, group.addr)
      }
    }
  }
}

/**
 * 将 Report Template 按 Dataset 渲染为 Filled Report 快照。
 * 遵循 ADR-0003：左父扩展树、Expansion Band zip、group merge、Subtotal Row。
 */
export function renderReport(template: SheetSnapshot, data: DatasetRecords): SheetSnapshot {
  const builder = new FilledReportBuilder(template)

  for (const templateRow of templateRows(template)) {
    if (isConsumedByParent(template, templateRow)) continue

    const groupRoot = isGroupExpansionRoot(template, templateRow)
    if (groupRoot) {
      expandGroupBlock(template, data, groupRoot, builder, {})
      continue
    }

    builder.emitStaticTemplateRow(templateRow)
  }

  const staticMerges = template.merges.filter((merge) => {
    const row = merge.start.row
    return !isConsumedByParent(template, row) && !isGroupExpansionRoot(template, row)
  })

  return {
    cells: builder.cells,
    styles: template.styles,
    merges: [...staticMerges, ...builder.merges],
    frozen: template.frozen,
    rows: builder.rowCount,
    cols: template.cols
  }
}
