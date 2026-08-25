import type { CellAddress } from './address'
import type { StructureChange } from './command/types'

/** Cell Meta 快照项（与单元格地址平行、按 namespace 存储的可序列化载荷） */
export interface CellMetaSnapshotItem {
  row: number
  col: number
  namespace: string
  payload: unknown
}

/** 生成 Cell Meta 存储键（row,col,namespace 三元组） */
export function cellMetaKey(row: number, col: number, namespace: string): string {
  return `${row},${col}\0${namespace}`
}

/** JSON 深拷贝（meta 约定为可序列化载荷；用于 structuredClone 不可克隆时回退） */
function cloneCellMetaPayloadJson(payload: unknown): unknown {
  return JSON.parse(JSON.stringify(payload)) as unknown
}

/** 深拷贝 meta 载荷（快照 / 补丁用，避免共享可变引用） */
export function cloneCellMetaPayload(payload: unknown): unknown {
  if (payload === undefined) return undefined
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(payload)
    } catch {
      // Proxy / DOM 等不可克隆对象（如 Vue reactive）回退 JSON
    }
  }
  return cloneCellMetaPayloadJson(payload)
}

/** 判断两个 meta 载荷是否相等（用于无变更跳过） */
export function cellMetaPayloadEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

/** 从地址与 namespace 生成存储键 */
export function cellMetaKeyFrom(addr: CellAddress, namespace: string): string {
  return cellMetaKey(addr.row, addr.col, namespace)
}

/** 结构变更（插入/删除行列）时平移单元格地址；落在删除区间内返回 null */
export function shiftCellAddressForStructure(
  addr: CellAddress,
  change: StructureChange
): CellAddress | null {
  const axis = change.kind.endsWith('rows') ? 'row' : 'col'
  const isInsert = change.kind.startsWith('insert')
  const { at, count } = change
  const end = at + count
  const coord = axis === 'row' ? addr.row : addr.col
  const next = { ...addr }

  if (isInsert) {
    if (coord >= at) {
      if (axis === 'row') next.row += count
      else next.col += count
    }
    return next
  }

  if (coord >= at && coord < end) return null
  if (coord >= end) {
    if (axis === 'row') next.row -= count
    else next.col -= count
  }
  return next
}

function isCellAddressLike(value: unknown): value is CellAddress {
  if (!value || typeof value !== 'object') return false
  const { row, col } = value as CellAddress
  return Number.isInteger(row) && Number.isInteger(col)
}

/** 结构变更时平移载荷内嵌的单元格地址（如 meta 中的父格引用） */
export function shiftMetaPayloadForStructure(payload: unknown, change: StructureChange): unknown {
  if (payload === null || payload === undefined) return payload
  if (Array.isArray(payload)) {
    return payload.map((item) => shiftMetaPayloadForStructure(item, change))
  }
  if (!isCellAddressLike(payload)) {
    if (typeof payload !== 'object') return payload
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      const shifted = shiftMetaPayloadForStructure(value, change)
      if (shifted !== undefined) out[key] = shifted
    }
    return out
  }

  const shifted = shiftCellAddressForStructure(payload, change)
  return shifted ?? undefined
}
