import type {
  CellRange,
  CellSnapshotItem,
  CellType,
  CellValue,
  SheetSnapshot
} from '@veltra/sheet-core'
import { cellKey } from '@veltra/sheet-core'

import type { ReportColWidthEntry } from '../export-xlsx'
import type { DatasetRecords } from '../types'
import { AggregateIndex, resolvePlacementValue } from './aggregate'
import type { ExpansionLayout, PhysicalPlacement } from './coordinate'
import { physicalColSpan, physicalRowSpan } from './coordinate'
import { StyleResolver } from './style-resolver'
import type { TemplateIndex } from './template-index'

function toCellValue(value: unknown): { v: CellValue; t?: CellType } {
  if (value === null || value === undefined) return { v: '' }
  if (typeof value === 'number' && !Number.isNaN(value)) return { v: value, t: 'n' }
  if (typeof value === 'boolean') return { v: value, t: 'b' }
  if (typeof value === 'string') return { v: value, t: 's' }
  if (value instanceof Date) return { v: value.toISOString().slice(0, 10), t: 's' }
  return { v: JSON.stringify(value), t: 's' }
}

function rangeCells(range: CellRange): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []
  for (let row = range.start.row; row <= range.end.row; row++) {
    for (let col = range.start.col; col <= range.end.col; col++) {
      cells.push({ row, col })
    }
  }
  return cells
}

function placementSourceValue(
  placement: PhysicalPlacement,
  template: SheetSnapshot,
  index: TemplateIndex,
  data: DatasetRecords,
  aggregateIndex: AggregateIndex
): unknown {
  if (placement.binding) {
    return resolvePlacementValue(placement, index, data, aggregateIndex)
  }
  const staticCell = index.cellAt(placement.logical)
  return staticCell?.v
}

function colWidthSourceLogicalCol(placement: PhysicalPlacement): number {
  const binding = placement.binding
  if (binding?.colParent) {
    return binding.colParent.col
  }
  return placement.logical.col
}

/**
 * 将模板列宽映射到填充报表物理列：横向展开列继承列方向父格所在模板列宽。
 */
export function mapFilledColWidths(
  templateColWidths: ReadonlyArray<ReportColWidthEntry>,
  layout: ExpansionLayout,
  _index: TemplateIndex
): ReportColWidthEntry[] {
  if (templateColWidths.length === 0 || layout.colCount === 0) return []

  const widthByTemplateCol = new Map<number, number>()
  for (const [col, width] of templateColWidths) {
    widthByTemplateCol.set(col, width)
  }

  const physicalWidths = new Map<number, number>()
  for (const placement of layout.placements) {
    const sourceCol = colWidthSourceLogicalCol(placement)
    const width = widthByTemplateCol.get(sourceCol)
    if (width === undefined) continue

    const startCol = placement.physical.start.col
    const endCol = placement.physical.end.col
    for (let col = startCol; col <= endCol; col++) {
      physicalWidths.set(col, width)
    }
  }

  return [...physicalWidths.entries()].sort((a, b) => a[0] - b[0])
}

/** 由扩展坐标布局组装 Filled Report 快照 */
export function buildFilledReport(
  template: SheetSnapshot,
  index: TemplateIndex,
  layout: ExpansionLayout,
  data: DatasetRecords
): SheetSnapshot {
  const styles = new StyleResolver(template)
  const aggregateIndex = new AggregateIndex(data)
  const cells: CellSnapshotItem[] = []
  const merges: CellRange[] = [...layout.mappedMerges]
  const mergeKeys = new Set(merges.map((m) => cellKey(m.start)))

  const pushMerge = (range: CellRange): void => {
    const key = cellKey(range.start)
    if (mergeKeys.has(key)) return
    mergeKeys.add(key)
    merges.push(range)
  }

  for (const placement of layout.placements) {
    const value = placementSourceValue(placement, template, index, data, aggregateIndex)
    const { row: templateRow, col: templateCol } = placement.logical
    const styleId = styles.resolve(templateRow, templateCol, value, placement.binding)

    const rowSpan = physicalRowSpan(placement)
    const colSpan = physicalColSpan(placement)
    const shouldMerge = placement.mergeSpan && (rowSpan > 1 || colSpan > 1)

    if (shouldMerge) {
      const item: CellSnapshotItem = {
        row: placement.physical.start.row,
        col: placement.physical.start.col,
        ...toCellValue(value)
      }
      if (styleId !== undefined) item.s = styleId
      cells.push(item)
      if (rowSpan > 1 || colSpan > 1) {
        pushMerge(placement.physical)
      }
      continue
    }

    for (const pos of rangeCells(placement.physical)) {
      const item: CellSnapshotItem = { row: pos.row, col: pos.col, ...toCellValue(value) }
      if (styleId !== undefined) item.s = styleId
      cells.push(item)
    }
  }

  return {
    cells,
    styles: styles.snapshot(),
    merges,
    frozen: template.frozen,
    rows: layout.rowCount,
    cols: Math.max(layout.colCount, template.cols)
  }
}
