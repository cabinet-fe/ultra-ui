import type { CellAddress, CellRange, CellSnapshotItem, SheetSnapshot } from '@veltra/sheet-core'
import { cellKey, formatAddress } from '@veltra/sheet-core'

import { REPORT_META_NAMESPACE, formatCellAddress } from '../binding'
import type { ReportBinding } from '../types'

/** 模板结构约束违反时抛出（附 A1 标签） */
export class TemplateStructureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TemplateStructureError'
  }
}

export interface IndexedBinding {
  addr: CellAddress
  binding: ReportBinding
}

/** 模板一次性索引：绑定直查、静态格直查、行/列父子树 */
export interface TemplateIndex {
  readonly bindings: ReadonlyMap<number, IndexedBinding>
  readonly staticCells: ReadonlyMap<number, CellSnapshotItem>
  readonly rowChildren: ReadonlyMap<number, readonly CellAddress[]>
  readonly colChildren: ReadonlyMap<number, readonly CellAddress[]>
  readonly logicalRows: readonly number[]
  readonly logicalCols: readonly number[]
  readonly merges: readonly CellRange[]
  bindingAt(addr: CellAddress): ReportBinding | undefined
  cellAt(addr: CellAddress): CellSnapshotItem | undefined
  bindingsOnRow(row: number): readonly IndexedBinding[]
  bindingsOnCol(col: number): readonly IndexedBinding[]
  isBindingAddr(addr: CellAddress): boolean
}

function addressesEqual(a: CellAddress, b: CellAddress): boolean {
  return a.row === b.row && a.col === b.col
}

function collectLogicalRows(template: SheetSnapshot): number[] {
  const rows = new Set<number>()
  for (const cell of template.cells) rows.add(cell.row)
  for (const item of template.meta ?? []) rows.add(item.row)
  return [...rows].sort((a, b) => a - b)
}

function collectLogicalCols(template: SheetSnapshot): number[] {
  const cols = new Set<number>()
  for (const cell of template.cells) cols.add(cell.col)
  for (const item of template.meta ?? []) cols.add(item.col)
  return [...cols].sort((a, b) => a - b)
}

function validateParentExists(
  addr: CellAddress,
  parent: CellAddress | undefined,
  bindings: Map<number, IndexedBinding>,
  direction: 'row' | 'col'
): void {
  if (!parent) return
  const label = formatCellAddress(addr)
  const parentLabel = formatCellAddress(parent)
  if (!bindings.has(cellKey(parent))) {
    throw new TemplateStructureError(
      `单元格 ${label} 的${direction === 'row' ? '行' : '列'}方向父格 ${parentLabel} 不存在绑定`
    )
  }
}

function detectParentCycle(
  start: CellAddress,
  bindings: Map<number, IndexedBinding>,
  direction: 'row' | 'col'
): void {
  const label = formatCellAddress(start)
  const visited = new Set<number>()
  let current: CellAddress | undefined = start

  while (current) {
    const key = cellKey(current)
    if (visited.has(key)) {
      throw new TemplateStructureError(
        `单元格 ${label} 的${direction === 'row' ? '行' : '列'}方向父链存在环`
      )
    }
    visited.add(key)
    const entry = bindings.get(key)
    if (!entry) break
    current = direction === 'row' ? entry.binding.rowParent : entry.binding.colParent
  }
}

function appendChild(map: Map<number, CellAddress[]>, parentKey: number, child: CellAddress): void {
  const list = map.get(parentKey)
  if (list) {
    list.push(child)
    return
  }
  map.set(parentKey, [child])
}

/** 由模板快照构建索引并校验结构约束（ADR-0005 决策 3） */
export function buildTemplateIndex(template: SheetSnapshot): TemplateIndex {
  const bindings = new Map<number, IndexedBinding>()
  const bindingAddrs = new Set<number>()

  for (const item of template.meta ?? []) {
    if (item.namespace !== REPORT_META_NAMESPACE) continue
    const addr = { row: item.row, col: item.col }
    const key = cellKey(addr)
    if (bindings.has(key)) {
      throw new TemplateStructureError(`单元格 ${formatCellAddress(addr)} 存在重复绑定`)
    }
    bindings.set(key, { addr, binding: item.payload as ReportBinding })
    bindingAddrs.add(key)
  }

  const staticCells = new Map<number, CellSnapshotItem>()
  for (const cell of template.cells) {
    const key = cellKey({ row: cell.row, col: cell.col })
    if (bindingAddrs.has(key)) continue
    staticCells.set(key, cell)
  }

  const rowChildren = new Map<number, CellAddress[]>()
  const colChildren = new Map<number, CellAddress[]>()

  for (const { addr, binding } of bindings.values()) {
    validateParentExists(addr, binding.rowParent, bindings, 'row')
    validateParentExists(addr, binding.colParent, bindings, 'col')
    detectParentCycle(addr, bindings, 'row')
    detectParentCycle(addr, bindings, 'col')

    if (binding.rowParent) {
      appendChild(rowChildren, cellKey(binding.rowParent), addr)
    }
    if (binding.colParent) {
      appendChild(colChildren, cellKey(binding.colParent), addr)
    }
  }

  const logicalRows = collectLogicalRows(template)
  const logicalCols = collectLogicalCols(template)
  const merges = template.merges ?? []

  const bindingsByRow = new Map<number, IndexedBinding[]>()
  for (const entry of bindings.values()) {
    const list = bindingsByRow.get(entry.addr.row)
    if (list) list.push(entry)
    else bindingsByRow.set(entry.addr.row, [entry])
  }
  for (const list of bindingsByRow.values()) {
    list.sort((a, b) => a.addr.col - b.addr.col)
  }

  const bindingsByCol = new Map<number, IndexedBinding[]>()
  for (const entry of bindings.values()) {
    const list = bindingsByCol.get(entry.addr.col)
    if (list) list.push(entry)
    else bindingsByCol.set(entry.addr.col, [entry])
  }
  for (const list of bindingsByCol.values()) {
    list.sort((a, b) => a.addr.row - b.addr.row)
  }

  return {
    bindings,
    staticCells,
    rowChildren,
    colChildren,
    logicalRows,
    logicalCols,
    merges,
    bindingAt(addr) {
      return bindings.get(cellKey(addr))?.binding
    },
    cellAt(addr) {
      return staticCells.get(cellKey(addr))
    },
    bindingsOnRow(row) {
      return bindingsByRow.get(row) ?? []
    },
    bindingsOnCol(col) {
      return bindingsByCol.get(col) ?? []
    },
    isBindingAddr(addr) {
      return bindings.has(cellKey(addr))
    }
  }
}

/** 判断两地址是否相同（供 coordinate 层使用） */
export function sameAddress(a: CellAddress, b: CellAddress): boolean {
  return addressesEqual(a, b)
}

/** 地址键 → A1 标签 */
export function addressLabel(addr: CellAddress): string {
  return formatAddress(addr)
}
