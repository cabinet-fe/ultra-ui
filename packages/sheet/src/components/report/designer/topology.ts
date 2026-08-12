import type { CellAddress } from '@veltra/sheet-core'

import type { ReportBinding } from '../../../report/types'

export interface TopologyLink {
  /** 子格（依赖方） */
  from: CellAddress
  /** 父绑定格 */
  to: CellAddress
}

export interface TopologyBindingEntry {
  addr: CellAddress
  binding: ReportBinding
}

function linkKey(from: CellAddress, to: CellAddress): string {
  return `${from.row},${from.col}->${to.row},${to.col}`
}

function sameAddress(a: CellAddress, b: CellAddress): boolean {
  return a.row === b.row && a.col === b.col
}

/** 查找将指定格作为行方向父格的绑定格 */
export function findCellsWithRowParent(
  parent: CellAddress,
  entries: readonly TopologyBindingEntry[]
): CellAddress[] {
  const children: CellAddress[] = []
  for (const { addr, binding } of entries) {
    if (binding.rowParent && sameAddress(binding.rowParent, parent)) {
      children.push(addr)
    }
  }
  return children
}

/** 收集选中格相关的拓扑连线：沿 rowParent 链上行、下行到直接子绑定 */
export function collectTopologyLinks(
  cell: CellAddress,
  binding: ReportBinding,
  entries: readonly TopologyBindingEntry[],
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
): TopologyLink[] {
  const links: TopologyLink[] = []
  const seen = new Set<string>()

  let cursor = cell
  let cursorBinding: ReportBinding | undefined = binding
  while (cursorBinding?.rowParent) {
    const parent = cursorBinding.rowParent
    const key = linkKey(cursor, parent)
    if (!seen.has(key)) {
      links.push({ from: cursor, to: parent })
      seen.add(key)
    }
    cursor = parent
    cursorBinding = getBindingAt(parent)
  }

  for (const child of findCellsWithRowParent(cell, entries)) {
    const key = linkKey(child, cell)
    if (seen.has(key)) continue
    links.push({ from: child, to: cell })
    seen.add(key)
  }

  return links
}

/** @deprecated 05 将删除；暂保留别名 */
export const findCellsWithLeftParent = findCellsWithRowParent

/** 子格 → 父格的二次贝塞尔弧线路径 */
export function buildTopologyArcPath(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy) || 1
  const lift = Math.min(48, Math.max(16, distance * 0.35))
  const cx = (from.x + to.x) / 2
  const cy = (from.y + to.y) / 2 - lift * Math.sign(dy || -1)
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
}
