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

  // ─── 行列插入/删除（合并区平移与裁剪）─────────────────

  /**
   * 行插入：Excel 语义。
   * - 合并完全在插入点之上（end.row < at）→ 不动；
   * - 插入点位于合并内部（start.row < at <= end.row）→ 高度扩展 +count；
   * - 合并完全在插入点及其下（start.row >= at）→ 整体下移 count。
   */
  shiftRowsInsert(at: number, count: number): void {
    if (count <= 0) return
    for (const range of Array.from(this.merges.values())) {
      const { start, end: rangeEnd } = range
      if (rangeEnd.row < at) continue
      this.unregister(range)
      if (start.row >= at) {
        this.register({
          start: { row: start.row + count, col: start.col },
          end: { row: rangeEnd.row + count, col: rangeEnd.col }
        })
      } else {
        this.register({
          start: { ...start },
          end: { row: rangeEnd.row + count, col: rangeEnd.col }
        })
      }
    }
  }

  /** 列插入：语义同 shiftRowsInsert，作用于列轴 */
  shiftColsInsert(at: number, count: number): void {
    if (count <= 0) return
    for (const range of Array.from(this.merges.values())) {
      const { start, end: rangeEnd } = range
      if (rangeEnd.col < at) continue
      this.unregister(range)
      if (start.col >= at) {
        this.register({
          start: { row: start.row, col: start.col + count },
          end: { row: rangeEnd.row, col: rangeEnd.col + count }
        })
      } else {
        this.register({
          start: { ...start },
          end: { row: rangeEnd.row, col: rangeEnd.col + count }
        })
      }
    }
  }

  /**
   * 行删除 [at, at+count)：Excel 语义。
   * - 合并完全在区间上方（end.row < at）→ 不动；
   * - 合并完全在区间下方（start.row >= at+count）→ 整体上移 count；
   * - 与区间相交 → 按保留行数裁剪：保留行 = 区域内不在删除区间的行；
   *   保留 0 行 → 移除；否则区域收缩为从新锚点开始的连续 keptRows 行
   *   （新锚点：原锚点保留则不变，锚点被删则取区间起点——下方行上移填补）。
   */
  shiftRowsDelete(at: number, count: number): void {
    if (count <= 0) return
    const end = at + count
    for (const range of Array.from(this.merges.values())) {
      const { start, end: rangeEnd } = range
      if (rangeEnd.row < at) continue // 上方，不受影响
      if (start.row >= end) {
        // 完全在下方 → 整体上移
        this.unregister(range)
        this.register({
          start: { row: start.row - count, col: start.col },
          end: { row: rangeEnd.row - count, col: rangeEnd.col }
        })
        continue
      }
      // 与删除区间相交：计算保留行数
      const above = Math.max(0, Math.min(rangeEnd.row, at - 1) - start.row + 1)
      const below = Math.max(0, rangeEnd.row - Math.max(start.row, end) + 1)
      const kept = above + below
      this.unregister(range)
      if (kept <= 0) continue
      const newStartRow = start.row < at ? start.row : at
      this.register({
        start: { row: newStartRow, col: start.col },
        end: { row: newStartRow + kept - 1, col: rangeEnd.col }
      })
    }
  }

  /** 列删除 [at, at+count)：语义同 shiftRowsDelete，作用于列轴 */
  shiftColsDelete(at: number, count: number): void {
    if (count <= 0) return
    const end = at + count
    for (const range of Array.from(this.merges.values())) {
      const { start, end: rangeEnd } = range
      if (rangeEnd.col < at) continue
      if (start.col >= end) {
        this.unregister(range)
        this.register({
          start: { row: start.row, col: start.col - count },
          end: { row: rangeEnd.row, col: rangeEnd.col - count }
        })
        continue
      }
      const left = Math.max(0, Math.min(rangeEnd.col, at - 1) - start.col + 1)
      const right = Math.max(0, rangeEnd.col - Math.max(start.col, end) + 1)
      const kept = left + right
      this.unregister(range)
      if (kept <= 0) continue
      const newStartCol = start.col < at ? start.col : at
      this.register({
        start: { row: start.row, col: newStartCol },
        end: { row: rangeEnd.row, col: newStartCol + kept - 1 }
      })
    }
  }
}
