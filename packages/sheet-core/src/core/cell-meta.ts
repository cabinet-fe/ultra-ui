import type { CellAddress } from './address'

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

/** 深拷贝 meta 载荷（快照 / 补丁用，避免共享可变引用） */
export function cloneCellMetaPayload(payload: unknown): unknown {
  if (payload === undefined) return undefined
  if (typeof structuredClone === 'function') return structuredClone(payload)
  return JSON.parse(JSON.stringify(payload)) as unknown
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
