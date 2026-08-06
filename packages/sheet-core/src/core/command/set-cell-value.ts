import type { CellAddress } from '../address'
import { cellDataEqual, isEmptyCellData, type CellData } from '../cell-store'
import type { CellPatch, Command, CommandResult } from './types'

/** SetCellValueCommand 的批量写入项 */
export interface SetCellValueItem {
  addr: CellAddress
  /** 目标数据；空数据（无公式且 v 为 null/undefined/''）= 清除 */
  data?: CellData
}

export interface SetCellValueParams {
  /** 批量写入（供粘贴/填充复用）；一次调用 = 一个 undo 单元 */
  items: SetCellValueItem[]
}

/**
 * 单元格写入命令：逐项解析锚点、捕获 before/after 差量并立即应用。
 * 与 before 相等的项跳过（不产生补丁）；全部无变化时不入历史。
 */
export const SetCellValueCommand: Command<SetCellValueParams> = {
  id: 'sheet.command.set-cell-value',

  handler(ctx, params): CommandResult {
    const patches: CellPatch[] = []
    for (const item of params.items) {
      const anchor = ctx.sheet.merges.resolveAnchor(item.addr)
      const before = ctx.sheet.store.getCell(anchor)
      const target = item.data
      let after: CellData | undefined
      if (target && !isEmptyCellData(target)) {
        // 编辑值保留既有样式（样式属于单元格，不随值写入丢失；item.data 显式带 s 时优先）
        after = { ...target, s: target.s ?? before?.s }
      }
      if (cellDataEqual(before, after)) continue
      const patch: CellPatch = { kind: 'cell', addr: anchor, before, after }
      ctx.applyPatch(patch, 'redo')
      patches.push(patch)
    }
    if (patches.length === 0) return { mutations: [] }
    return { mutations: [{ redo: patches, undo: [...patches].reverse() }] }
  }
}
