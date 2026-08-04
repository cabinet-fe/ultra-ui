import type { CellPatch, Command, CommandResult, Mutation, Patch, StructureChange } from './types'

/**
 * 行列插入/删除命令。
 *
 * 结构变更的 undo 不依赖反向补丁快照，而是执行「反向结构操作」：
 * - redo：applyStructureChange（数据/合并/行高/尺寸平移）+ 公式引用平移 CellPatch
 * - undo：
 *   1. 先恢复「仍在表内、仅引用被平移」的公式 CellPatch before（post-delete 坐标）
 *   2. 再反向结构（幸存者移回原位；删除区间重插入为空行/列）
 *   3. 最后恢复删除区间内被移除的单元格 before（含普通值与公式格）
 *
 * 公式重算由 executeCommand 的 recalcAfterCommand 从公式 CellPatch 自动触发
 * （派生补丁并入同一 undo 单元）。
 */

export interface InsertCellsParams {
  change: StructureChange
}

function buildMutation(
  change: StructureChange,
  formulaPatches: CellPatch[],
  deletedPatches: CellPatch[],
  beforeRows: number,
  beforeCols: number
): Mutation {
  const structurePatch: Patch = { kind: 'structure', change, beforeRows, beforeCols }
  const isDelete = change.kind.startsWith('delete')
  return {
    // redo：结构操作在前（删除区间数据随 store.delete* 移除），公式补丁写新 f 到新坐标
    // 删除区间单元格不进 redo（结构操作已移除，再写 after:undefined 会误清上移后的格）
    redo: [structurePatch, ...formulaPatches],
    // undo：平移公式 before → 反向结构 → 恢复删除区间单元格
    undo: isDelete
      ? [...[...formulaPatches].reverse(), structurePatch, ...deletedPatches]
      : [...[...formulaPatches].reverse(), structurePatch]
  }
}

export const InsertCellsCommand: Command<InsertCellsParams> = {
  id: 'insert-cells',
  handler(ctx, params): CommandResult | undefined {
    const { sheet } = ctx
    const { change } = params
    const count = change.count ?? 1
    if (count <= 0) return undefined
    const normalized: StructureChange = { ...change, count } as StructureChange
    // 平移前读取公式原文、删除区间单元格与表格尺寸；结构副作用由 redo 补丁应用
    const beforeRows = sheet.rows
    const beforeCols = sheet.cols
    const deletedPatches = sheet.prepareDeletedCellPatches(normalized)
    const formulaPatches = sheet.prepareFormulaShift(normalized)
    const mutation = buildMutation(
      normalized,
      formulaPatches,
      deletedPatches,
      beforeRows,
      beforeCols
    )
    for (const patch of mutation.redo) ctx.applyPatch(patch, 'redo')
    return { mutations: [mutation] }
  }
}
