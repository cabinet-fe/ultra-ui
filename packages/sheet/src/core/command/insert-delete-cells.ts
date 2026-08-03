import type { CellPatch, Command, CommandResult, Mutation, StructureChange } from './types'

/**
 * 行列插入/删除命令。
 *
 * 结构变更的 undo 不依赖反向补丁快照，而是执行「反向结构操作」：
 * - redo：applyStructureChange（数据/合并/行高/尺寸平移）+ 公式引用平移 CellPatch
 * - undo：先恢复公式 CellPatch 的 before（原公式文本 / 原数据），再执行反向结构操作
 *   （数据随坐标移动回到原位，公式文本无需反向平移——补丁恢复保证精确还原）。
 *
 * 公式重算由 executeCommand 的 recalcAfterCommand 从公式 CellPatch 自动触发
 * （派生补丁并入同一 undo 单元，undo 先恢复派生值再反转结构）。
 */

export interface InsertCellsParams {
  change: StructureChange
}

function buildMutation(
  change: StructureChange,
  formulaPatches: CellPatch[],
  beforeRows: number,
  beforeCols: number
): Mutation {
  const structurePatch = { kind: 'structure', change, beforeRows, beforeCols } as const
  return {
    // redo：结构操作在前（数据已平移），公式补丁写新 f 到新坐标
    redo: [structurePatch, ...formulaPatches],
    // undo：先恢复公式 before（原 f/原数据到新坐标），再反向结构（数据回原位）；
    // structure patch 保留原 change，applyPatch('undo') 负责反向与尺寸还原
    undo: [...formulaPatches.reverse(), structurePatch]
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
    // 平移前读取公式原文与表格尺寸；结构副作用由下方 redo 补丁应用（唯一变更通道）
    const beforeRows = sheet.rows
    const beforeCols = sheet.cols
    const formulaPatches = sheet.prepareFormulaShift(normalized)
    const mutation = buildMutation(normalized, formulaPatches, beforeRows, beforeCols)
    for (const patch of mutation.redo) ctx.applyPatch(patch, 'redo')
    return { mutations: [mutation] }
  }
}
