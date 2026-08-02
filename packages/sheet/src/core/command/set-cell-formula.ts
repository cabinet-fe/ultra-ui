import type { CellAddress } from '../address'
import type { CellData } from '../cell-store'
import type { CellPatch, Command, CommandResult } from './types'

export interface SetCellFormulaParams {
  addr: CellAddress
  /** 公式文本（不含 '='） */
  formula: string
}

/**
 * 公式写入命令：只登记公式原文（f）；计算缓存（v/t）由命令执行后的
 * 增量重算以派生补丁填充（见 Sheet.executeCommand），重算波及的所有变更
 * 与源补丁并入同一 undo 单元。
 */
export const SetCellFormulaCommand: Command<SetCellFormulaParams> = {
  id: 'sheet.command.set-cell-formula',

  handler(ctx, params): CommandResult {
    const anchor = ctx.sheet.merges.resolveAnchor(params.addr)
    const before = ctx.sheet.store.getCell(anchor)
    // 同公式重复输入 = 无实际变更，不入历史
    if (before?.f === params.formula) return { mutations: [] }
    const after: CellData = { f: params.formula }
    const patch: CellPatch = { kind: 'cell', addr: anchor, before, after }
    ctx.applyPatch(patch, 'redo')
    return { mutations: [{ redo: [patch], undo: [patch] }] }
  }
}
