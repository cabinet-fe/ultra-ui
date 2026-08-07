import type { CellAddress } from '../address'
import { cloneCellMetaPayload, cellMetaPayloadEqual } from '../cell-meta'
import type { CellMetaPatch, Command, CommandResult } from './types'

export interface SetCellMetaParams {
  addr: CellAddress
  namespace: string
  payload: unknown
}

/**
 * 设置 Cell Meta：捕获 before/after、立即 applyPatch('redo')、返回 mutations。
 * 相同 payload 或无 namespace 视为无操作。
 */
export const SetCellMetaCommand: Command<SetCellMetaParams> = {
  id: 'sheet.set-cell-meta',

  handler(ctx, params): CommandResult {
    const { addr, namespace, payload } = params
    if (!namespace.trim()) return { mutations: [] }

    const before = ctx.sheet.getCellMeta(addr, namespace)
    if (cellMetaPayloadEqual(before, payload)) return { mutations: [] }

    const patch: CellMetaPatch = {
      kind: 'cell-meta',
      addr: { ...addr },
      namespace,
      before: before === undefined ? undefined : cloneCellMetaPayload(before),
      after: cloneCellMetaPayload(payload)
    }
    ctx.applyPatch(patch, 'redo')
    return { mutations: [{ redo: [patch], undo: [patch] }] }
  }
}

export interface ClearCellMetaParams {
  addr: CellAddress
  namespace: string
}

/** 清除 Cell Meta：捕获 before、立即 applyPatch('redo')、返回 mutations */
export const ClearCellMetaCommand: Command<ClearCellMetaParams> = {
  id: 'sheet.clear-cell-meta',

  handler(ctx, params): CommandResult {
    const { addr, namespace } = params
    if (!namespace.trim()) return { mutations: [] }

    const before = ctx.sheet.getCellMeta(addr, namespace)
    if (before === undefined) return { mutations: [] }

    const patch: CellMetaPatch = {
      kind: 'cell-meta',
      addr: { ...addr },
      namespace,
      before: cloneCellMetaPayload(before),
      after: undefined
    }
    ctx.applyPatch(patch, 'redo')
    return { mutations: [{ redo: [patch], undo: [patch] }] }
  }
}
