import { iterateRange, rangesIntersect, type CellRange } from '../address'
import { cellDataEqual, isEmptyCellData, type CellData } from '../cell-store'
import type { CellPatch, Command, CommandResult, MergePatch, Patch } from './types'

export interface MergeCellsParams {
  range: CellRange
}

/**
 * 合并命令。Patch 捕获完整 before 状态：
 * - 被解除的既有合并记录（undo 时逐一恢复）
 * - 包围盒内每一格的原数据（undo 时连被清空的值一起还原）
 * 值保留规则同 Excel/univer：行主序第一个有值格的值写入新锚点，其余清空。
 */
export const MergeCellsCommand: Command<MergeCellsParams, CellRange> = {
  id: 'sheet.command.merge-cells',

  handler(ctx, params): CommandResult<CellRange> {
    const { sheet } = ctx
    const { range: finalRange, removed } = sheet.merges.computeMerge(params.range)

    // 捕获包围盒内各格 before；同时按行主序找出第一个有值格
    const cellPatches: CellPatch[] = []
    let retained: CellData | undefined
    let anchorPatch: CellPatch | undefined
    for (const addr of iterateRange(finalRange)) {
      const before = sheet.store.getCell(addr)
      if (before && !retained && !isEmptyCellData(before)) retained = before
      const patch: CellPatch = { kind: 'cell', addr, before, after: undefined }
      if (addr.row === finalRange.start.row && addr.col === finalRange.start.col) {
        anchorPatch = patch
      }
      cellPatches.push(patch)
    }
    if (retained && anchorPatch) {
      anchorPatch.after = { ...retained }
    }

    const mergePatches: MergePatch[] = [
      ...removed.map((range): MergePatch => ({ kind: 'merge', range, before: true, after: false })),
      { kind: 'merge', range: finalRange, before: false, after: true }
    ]

    // 过滤无实际变化的 cell 补丁（如被覆盖格本就为空）
    const patches: Patch[] = [
      ...mergePatches,
      ...cellPatches.filter((patch) => !cellDataEqual(patch.before, patch.after))
    ]
    for (const patch of patches) ctx.applyPatch(patch, 'redo')

    return { mutations: [{ redo: patches, undo: [...patches].reverse() }], result: finalRange }
  }
}

export interface UnmergeCellsParams {
  range: CellRange
}

/** 取消合并命令：解除与 range 相交的所有合并；undo 恢复合并记录 */
export const UnmergeCellsCommand: Command<UnmergeCellsParams> = {
  id: 'sheet.command.unmerge-cells',

  handler(ctx, params): CommandResult {
    const removed: MergePatch[] = []
    for (const range of ctx.sheet.merges.getMerges()) {
      if (rangesIntersect(range, params.range)) {
        removed.push({ kind: 'merge', range, before: true, after: false })
      }
    }
    if (removed.length === 0) return { mutations: [] }
    for (const patch of removed) ctx.applyPatch(patch, 'redo')
    return { mutations: [{ redo: removed, undo: [...removed].reverse() }] }
  }
}
