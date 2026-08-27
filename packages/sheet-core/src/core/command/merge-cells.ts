import { iterateRange, rangesIntersect, type CellRange } from '../address'
import { cellDataEqual, isEmptyCellData, type CellData } from '../cell-store'
import type { Sheet } from '../sheet'
import type { CellStyle } from '../style/types'
import type { CellPatch, Command, CommandResult, MergePatch, Patch } from './types'

export interface MergeCellsParams {
  range: CellRange
}

/** 收集合并区域边界上的有效边框并合成到基础样式上 */
function synthesizeMergeBorder(
  sheet: Sheet,
  finalRange: CellRange,
  baseStyle?: CellStyle
): CellStyle | undefined {
  const mergedBorder = { ...baseStyle?.border }

  // top
  if (!mergedBorder.top) {
    for (let c = finalRange.start.col; c <= finalRange.end.col; c++) {
      const edge = sheet.getCellStyle({ row: finalRange.start.row, col: c })?.border?.top
      if (edge) {
        mergedBorder.top = edge
        break
      }
    }
  }
  // bottom
  if (!mergedBorder.bottom) {
    for (let c = finalRange.start.col; c <= finalRange.end.col; c++) {
      const edge = sheet.getCellStyle({ row: finalRange.end.row, col: c })?.border?.bottom
      if (edge) {
        mergedBorder.bottom = edge
        break
      }
    }
  }
  // left
  if (!mergedBorder.left) {
    for (let r = finalRange.start.row; r <= finalRange.end.row; r++) {
      const edge = sheet.getCellStyle({ row: r, col: finalRange.start.col })?.border?.left
      if (edge) {
        mergedBorder.left = edge
        break
      }
    }
  }
  // right
  if (!mergedBorder.right) {
    for (let r = finalRange.start.row; r <= finalRange.end.row; r++) {
      const edge = sheet.getCellStyle({ row: r, col: finalRange.end.col })?.border?.right
      if (edge) {
        mergedBorder.right = edge
        break
      }
    }
  }

  if (Object.keys(mergedBorder).length === 0) return baseStyle
  return { ...baseStyle, border: mergedBorder }
}

/**
 * 合并命令。Patch 捕获完整 before 状态：
 * - 被解除的既有合并记录（undo 时逐一恢复）
 * - 包围盒内每一格的原数据（undo 时连被清空的值一起还原）
 * 值保留规则同 Excel/univer：行主序第一个有值格的值写入新锚点，其余清空。
 * 边框规则：合成区域边界上的外边框并写入新锚点。
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

    const baseStyle = retained?.s != null ? sheet.stylePool.get(retained.s) : undefined
    const finalStyle = synthesizeMergeBorder(sheet, finalRange, baseStyle)
    let styleId = retained?.s
    if (finalStyle && finalStyle !== baseStyle) {
      styleId = sheet.stylePool.intern(finalStyle)
    }

    if (anchorPatch && (retained || styleId != null)) {
      anchorPatch.after = { ...retained, ...(styleId != null ? { s: styleId } : {}) }
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

export interface MergeCellsBatchParams {
  ranges: CellRange[]
}

/**
 * 批量合并命令（导入等批量场景：1016 个合并区域 = 1 次命令 = 单 undo 单元，
 * 替代逐区域 MergeCellsCommand 的命令/历史/重算编排开销）。
 * 每个区域与 MergeCellsCommand 同语义（相交包围盒 + 锚点值保留）；undo 逆序
 * 回放（后合并的先撤销，相交依赖自洽）。源 Excel 合并区域互不相交——批量
 * 收集时各区域独立 computeMerge，行为与逐条一致。
 */
export const MergeCellsBatchCommand: Command<MergeCellsBatchParams> = {
  id: 'sheet.command.merge-cells-batch',

  handler(ctx, params): CommandResult {
    const { sheet } = ctx
    const patches: Patch[] = []
    for (const range of params.ranges) {
      const { range: finalRange, removed } = sheet.merges.computeMerge(range)

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
      const baseStyle = retained?.s != null ? sheet.stylePool.get(retained.s) : undefined
      const finalStyle = synthesizeMergeBorder(sheet, finalRange, baseStyle)
      let styleId = retained?.s
      if (finalStyle && finalStyle !== baseStyle) {
        styleId = sheet.stylePool.intern(finalStyle)
      }

      if (anchorPatch && (retained || styleId != null)) {
        anchorPatch.after = { ...retained, ...(styleId != null ? { s: styleId } : {}) }
      }

      // 立即应用本区域的补丁后再处理下一个：批量内相交时 computeMerge 能看到
      // 前一个合并（与逐条 mergeCells 语义一致：相交 → 包围盒）；undo 逆序回放
      // 仍自洽（后应用的先撤销）
      const rangePatches: Patch[] = [
        ...removed.map((range): MergePatch => ({
          kind: 'merge',
          range,
          before: true,
          after: false
        })),
        { kind: 'merge', range: finalRange, before: false, after: true },
        // 过滤无实际变化的 cell 补丁（如被覆盖格本就为空）
        ...cellPatches.filter((patch) => !cellDataEqual(patch.before, patch.after))
      ]
      for (const patch of rangePatches) ctx.applyPatch(patch, 'redo')
      patches.push(...rangePatches)
    }
    if (patches.length === 0) return { mutations: [] }
    return { mutations: [{ redo: patches, undo: [...patches].reverse() }] }
  }
}
