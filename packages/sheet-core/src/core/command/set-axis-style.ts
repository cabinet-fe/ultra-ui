import type { StyleId, CellStylePatch } from '../style/types'
import { mergeCellStyle } from './set-cell-style'
import type { AxisStylePatch, Command, CommandResult } from './types'

/** 行/列默认样式写入项（一次调用 = 一个 undo 单元） */
export interface SetAxisStyleItem {
  /** 行号或列号（0-based） */
  index: number
  /** 部分样式合并（见 CellStylePatch）；与 clear 互斥 */
  partial?: CellStylePatch
  /** 清除该行/列默认样式；与 partial 互斥，clear 优先 */
  clear?: boolean
}

export interface SetAxisStyleParams {
  axis: 'row' | 'col'
  items: SetAxisStyleItem[]
}

/**
 * 行/列默认样式写入命令：经 StylePool intern，进 undo。
 * 部分合并语义与 setCellStyle 相同（mergeCellStyle）；空结果清除 Map 条目。
 */
export const SetAxisStyleCommand: Command<SetAxisStyleParams> = {
  id: 'sheet.command.set-axis-style',

  handler(ctx, params): CommandResult {
    const patches: AxisStylePatch[] = []
    const seen = new Set<number>()

    for (const item of params.items) {
      if (!Number.isInteger(item.index) || item.index < 0) continue
      if (seen.has(item.index)) continue
      seen.add(item.index)

      const before =
        params.axis === 'row'
          ? ctx.sheet.getRowStyleId(item.index)
          : ctx.sheet.getColStyleId(item.index)
      let after: StyleId | undefined
      if (item.clear) {
        after = undefined
      } else if (item.partial) {
        const beforeStyle = before != null ? ctx.sheet.stylePool.get(before) : undefined
        const merged = mergeCellStyle(beforeStyle, item.partial)
        after = merged === undefined ? undefined : ctx.sheet.stylePool.intern(merged)
      } else {
        continue
      }
      if (before === after) continue
      const patch: AxisStylePatch = {
        kind: 'axis-style',
        axis: params.axis,
        index: item.index,
        before,
        after
      }
      ctx.applyPatch(patch, 'redo')
      patches.push(patch)
    }
    if (patches.length === 0) return { mutations: [] }
    return { mutations: [{ redo: patches, undo: [...patches].reverse() }] }
  }
}
