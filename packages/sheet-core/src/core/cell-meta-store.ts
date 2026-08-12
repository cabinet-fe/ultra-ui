import type { CellAddress } from './address'
import {
  cellMetaKey,
  cellMetaKeyFrom,
  cloneCellMetaPayload,
  shiftCellAddressForStructure,
  shiftMetaPayloadForStructure,
  type CellMetaSnapshotItem
} from './cell-meta'
import type { StructureChange } from './command/types'

/**
 * Cell Meta 稀疏存储（与 CellStore 平行，不写入 CellData）。
 * 键 = row,col,namespace；空 namespace 集合不占存储。
 */
export class CellMetaStore {
  private readonly data = new Map<string, unknown>()

  /** 读取指定地址与 namespace 的 meta（副本）；不存在返回 undefined */
  get(addr: CellAddress, namespace: string): unknown {
    const payload = this.data.get(cellMetaKeyFrom(addr, namespace))
    return payload === undefined ? undefined : cloneCellMetaPayload(payload)
  }

  /** 写入 meta；payload 为 undefined 等价于删除该 namespace */
  set(addr: CellAddress, namespace: string, payload: unknown): void {
    const key = cellMetaKeyFrom(addr, namespace)
    if (payload === undefined) {
      this.data.delete(key)
      return
    }
    this.data.set(key, cloneCellMetaPayload(payload))
  }

  /** 删除指定地址与 namespace 的 meta */
  delete(addr: CellAddress, namespace: string): void {
    this.data.delete(cellMetaKeyFrom(addr, namespace))
  }

  /** 是否存在指定 meta */
  has(addr: CellAddress, namespace: string): boolean {
    return this.data.has(cellMetaKeyFrom(addr, namespace))
  }

  /** 解析存储键为 row / col / namespace */
  private parseKey(key: string): { row: number; col: number; namespace: string } {
    const nullIdx = key.indexOf('\0')
    const coordPart = key.slice(0, nullIdx)
    const namespace = key.slice(nullIdx + 1)
    const comma = coordPart.indexOf(',')
    return {
      row: Number(coordPart.slice(0, comma)),
      col: Number(coordPart.slice(comma + 1)),
      namespace
    }
  }

  /** 全量快照（按 row,col,namespace 排序，便于稳定序列化） */
  snapshot(): CellMetaSnapshotItem[] {
    const items: CellMetaSnapshotItem[] = []
    for (const [key, payload] of this.data) {
      const { row, col, namespace } = this.parseKey(key)
      items.push({ row, col, namespace, payload: cloneCellMetaPayload(payload) })
    }
    items.sort((a, b) => a.row - b.row || a.col - b.col || a.namespace.localeCompare(b.namespace))
    return items
  }

  /** 从快照静默还原（清空后写入） */
  restore(items: CellMetaSnapshotItem[] | undefined): void {
    this.data.clear()
    for (const item of items ?? []) {
      this.data.set(
        cellMetaKey(item.row, item.col, item.namespace),
        cloneCellMetaPayload(item.payload)
      )
    }
  }

  /** 迭代所有条目（内部结构变更用） */
  *entries(): Generator<[CellAddress, string, unknown]> {
    for (const [key, payload] of this.data) {
      const { row, col, namespace } = this.parseKey(key)
      yield [{ row, col }, namespace, payload]
    }
  }

  /** 行列插入/删除时平移 meta 坐标与载荷内嵌地址 */
  applyStructureChange(change: StructureChange): void {
    const next = new Map<string, unknown>()
    for (const [key, payload] of this.data) {
      const { row, col, namespace } = this.parseKey(key)
      const shiftedAddr = shiftCellAddressForStructure({ row, col }, change)
      if (!shiftedAddr) continue
      const shiftedPayload = shiftMetaPayloadForStructure(payload, change)
      if (shiftedPayload === undefined) continue
      next.set(
        cellMetaKey(shiftedAddr.row, shiftedAddr.col, namespace),
        cloneCellMetaPayload(shiftedPayload)
      )
    }
    this.data.clear()
    for (const [key, payload] of next) this.data.set(key, payload)
  }
}
