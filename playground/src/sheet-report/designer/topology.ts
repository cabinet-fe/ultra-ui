import type { CellAddress } from '@veltra/sheet-core'

import { resolveLeftParent } from '../binding'
import type { ReportBinding } from '../types'

export interface TopologyLink {
  /** 子格（依赖方） */
  from: CellAddress
  /** 父分组格 */
  to: CellAddress
}

export interface TopologyBindingEntry {
  addr: CellAddress
  binding: ReportBinding
}

function linkKey(from: CellAddress, to: CellAddress): string {
  return `${from.row},${from.col}->${to.row},${to.col}`
}

/** 查找将指定格作为有效左父格的绑定格 */
export function findCellsWithLeftParent(
  parent: CellAddress,
  entries: readonly TopologyBindingEntry[],
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
): CellAddress[] {
  const children: CellAddress[] = []
  for (const { addr, binding } of entries) {
    const resolved = resolveLeftParent(binding, addr, getBindingAt)
    if (resolved?.row === parent.row && resolved.col === parent.col) {
      children.push(addr)
    }
  }
  return children
}

/** 收集选中格相关的拓扑连线：沿父链上行、下行到直接子绑定 */
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
  while (cursorBinding) {
    const parent = resolveLeftParent(cursorBinding, cursor, getBindingAt)
    if (!parent) break
    const key = linkKey(cursor, parent)
    if (!seen.has(key)) {
      links.push({ from: cursor, to: parent })
      seen.add(key)
    }
    cursor = parent
    cursorBinding = getBindingAt(parent)
  }

  for (const child of findCellsWithLeftParent(cell, entries, getBindingAt)) {
    const key = linkKey(child, cell)
    if (seen.has(key)) continue
    links.push({ from: child, to: cell })
    seen.add(key)
  }

  return links
}

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
