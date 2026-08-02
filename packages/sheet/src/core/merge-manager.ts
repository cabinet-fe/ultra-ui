import {
  boundingBox,
  cellKey,
  createRange,
  iterateRange,
  rangesIntersect,
  type CellAddress,
  type CellRange
} from './address'

/**
 * 合并单元格管理器（只管几何，不管数据）。
 *
 * - 锚点恒为区域左上角，数据只存在锚点格（数据搬迁由 Sheet 编排）
 * - merges：anchorKey → CellRange
 * - coverIndex：coveredCellKey（不含锚点自身）→ anchorKey，O(1) 查询
 */

/** 单元格在合并语义下的种类 */
export type MergedCellKind = 'normal' | 'merged-anchor' | 'merged-covered'

export interface CellInfo {
  kind: MergedCellKind
  /** 锚点地址；普通格为自身 */
  anchor: CellAddress
  /** 所在合并区域；普通格无 */
  mergeRange?: CellRange
}

export interface MergeResult {
  /** 最终生效的合并区域（与既有合并相交时取包围盒，可能大于入参） */
  range: CellRange
  /** 本次被解除的既有合并 */
  removed: CellRange[]
}

export class MergeManager {
  private merges = new Map<number, CellRange>()
  private coverIndex = new Map<number, number>()

  /**
   * 计算合并结果（纯查询，不修改状态）：
   * 1. 所有与 range 相交的既有合并将被解除
   * 2. 新区域 = range 与被解除合并的包围盒
   */
  computeMerge(range: CellRange): MergeResult {
    const removed: CellRange[] = []
    for (const existing of this.merges.values()) {
      if (rangesIntersect(existing, range)) removed.push(existing)
    }
    const finalRange =
      removed.length > 0 ? boundingBox([range, ...removed]) : createRange(range.start, range.end)
    return { range: finalRange, removed }
  }

  /** 合并区域（解除相交既有合并 + 包围盒，见 computeMerge） */
  merge(range: CellRange): MergeResult {
    const result = this.computeMerge(range)
    for (const item of result.removed) this.unregister(item)
    this.register(result.range)
    return result
  }

  /**
   * 精确登记一个合并区域（不做相交解除与包围盒）。
   * 低层接口，供命令系统回放补丁使用；调用方需保证不与既有合并相交。
   */
  addMerge(range: CellRange): void {
    this.register(range)
  }

  /** 精确移除一个合并区域（按锚点匹配）；不存在时为空操作 */
  removeMerge(range: CellRange): void {
    this.unregister(range)
  }

  /** 解除所有与 range 相交的合并，返回被解除的区域 */
  unmerge(range: CellRange): CellRange[] {
    const removed: CellRange[] = []
    for (const existing of this.merges.values()) {
      if (rangesIntersect(existing, range)) removed.push(existing)
    }
    for (const item of removed) this.unregister(item)
    return removed
  }

  /** 地址解析到锚点：被覆盖格 → 锚点；锚点/普通格 → 自身 */
  resolveAnchor(addr: CellAddress): CellAddress {
    const merge = this.getMergeAt(addr)
    return merge ? { ...merge.start } : { ...addr }
  }

  /** 是否在任意合并区域内（含锚点） */
  isMerged(addr: CellAddress): boolean {
    return this.getMergeAt(addr) !== undefined
  }

  /** 是否为被覆盖的非锚点格 */
  isCovered(addr: CellAddress): boolean {
    return this.coverIndex.has(cellKey(addr))
  }

  /** 所在合并区域（锚点与被覆盖格均可查）；不在任何合并内返回 undefined */
  getMergeAt(addr: CellAddress): CellRange | undefined {
    const key = cellKey(addr)
    const asAnchor = this.merges.get(key)
    if (asAnchor) return asAnchor
    const anchorKey = this.coverIndex.get(key)
    return anchorKey === undefined ? undefined : this.merges.get(anchorKey)
  }

  /** 合并语义下的单元格信息 */
  getCellInfo(addr: CellAddress): CellInfo {
    const merge = this.getMergeAt(addr)
    if (!merge) return { kind: 'normal', anchor: { ...addr } }
    const anchor = { ...merge.start }
    if (addr.row === anchor.row && addr.col === anchor.col) {
      return { kind: 'merged-anchor', anchor, mergeRange: merge }
    }
    return { kind: 'merged-covered', anchor, mergeRange: merge }
  }

  /** 全部合并区域（迭代 merges 的副本） */
  getMerges(): CellRange[] {
    return [...this.merges.values()].map((range) => ({
      start: { ...range.start },
      end: { ...range.end }
    }))
  }

  get size(): number {
    return this.merges.size
  }

  clear(): void {
    this.merges.clear()
    this.coverIndex.clear()
  }

  private register(range: CellRange): void {
    const anchorKey = cellKey(range.start)
    this.merges.set(anchorKey, range)
    for (const addr of iterateRange(range)) {
      if (addr.row !== range.start.row || addr.col !== range.start.col) {
        this.coverIndex.set(cellKey(addr), anchorKey)
      }
    }
  }

  private unregister(range: CellRange): void {
    this.merges.delete(cellKey(range.start))
    for (const addr of iterateRange(range)) {
      if (addr.row !== range.start.row || addr.col !== range.start.col) {
        this.coverIndex.delete(cellKey(addr))
      }
    }
  }
}
