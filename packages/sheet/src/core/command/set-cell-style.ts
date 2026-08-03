import { cellKey, type CellAddress } from '../address'
import { cellDataEqual, isEmptyCellData, type CellData } from '../cell-store'
import { normalizeStyle } from '../style/style-pool'
import {
  BORDER_EDGE_DEFAULTS,
  BORDER_SIDES,
  type BorderEdge,
  type CellStyle,
  type CellStylePatch
} from '../style/types'
import type { CellPatch, Command, CommandResult } from './types'

/** SetCellStyleCommand 的批量项（一次调用 = 一个 undo 单元） */
export interface SetCellStyleItem {
  addr: CellAddress
  /** 部分样式合并（见 CellStylePatch 语义）；与 clear 互斥，缺省 = 无操作 */
  partial?: CellStylePatch
  /** 清除该格样式（删除 s 字段）；与 partial 互斥，clear 优先 */
  clear?: boolean
}

export interface SetCellStyleParams {
  items: SetCellStyleItem[]
}

/**
 * 部分合并：将 partial 合并到既有样式（before）。
 *
 * - 顶层浅合并：只给 fill 时保留既有 border（反之亦然）
 * - fill 存在即覆盖填充（`{}` = 清除填充，保留边框）
 * - border 存在即重定义边框集合（未给出的边清除），各边内部与既有边合并
 *   （缺失字段保留既有边值；无既有边时用默认值补全：thin / 1px / #000000）
 * - border: {} = 清除全部边框（保留填充）
 * - 合并结果为空（无 fill 无 border）→ undefined（调用方删除 s 字段）
 */
export function mergeCellStyle(
  before: CellStyle | undefined,
  partial: CellStylePatch
): CellStyle | undefined {
  const merged: CellStyle = {}
  if (partial.fill !== undefined) {
    merged.fill = partial.fill.color ? { color: partial.fill.color } : undefined
  } else if (before?.fill) {
    merged.fill = { ...before.fill }
  }
  if (partial.border !== undefined) {
    const border: NonNullable<CellStyle['border']> = {}
    for (const side of BORDER_SIDES) {
      const patchEdge = partial.border[side]
      if (patchEdge === undefined) continue
      const edge: BorderEdge = {
        style: patchEdge.style ?? before?.border?.[side]?.style ?? BORDER_EDGE_DEFAULTS.style,
        width: patchEdge.width ?? before?.border?.[side]?.width ?? BORDER_EDGE_DEFAULTS.width,
        color: patchEdge.color ?? before?.border?.[side]?.color ?? BORDER_EDGE_DEFAULTS.color
      }
      border[side] = edge
    }
    if (Object.keys(border).length > 0) merged.border = border
  } else if (before?.border) {
    merged.border = { ...before.border }
  }
  return normalizeStyle(merged)
}

/** 去掉 s 字段后的数据；若只剩空（无值无公式无样式）→ undefined（删除整格） */
function withoutStyle(before: CellData | undefined): CellData | undefined {
  if (!before) return undefined
  const rest: CellData = { ...before }
  delete rest.s
  return isEmptyCellData(rest) ? undefined : rest
}

/**
 * 单元格样式写入命令：选区批量（按格解析锚点并去重），
 * 部分合并语义（只设 fill 保留既有 border），空样式删除 s 字段。
 * 与 before 相等的项跳过（不产生补丁）；全部无变化时不入历史。
 */
export const SetCellStyleCommand: Command<SetCellStyleParams> = {
  id: 'sheet.command.set-cell-style',

  handler(ctx, params): CommandResult {
    const patches: CellPatch[] = []
    const seen = new Set<number>()
    for (const item of params.items) {
      // 样式只存锚点格（被覆盖格无数据）；同一锚点的重复项合并为一个补丁
      const anchor = ctx.sheet.merges.resolveAnchor(item.addr)
      const key = cellKey(anchor)
      if (seen.has(key)) continue
      seen.add(key)

      const before = ctx.sheet.store.getCell(anchor)
      let after: CellData | undefined
      if (item.clear) {
        after = withoutStyle(before)
      } else if (item.partial) {
        const beforeStyle = before?.s != null ? ctx.sheet.stylePool.get(before.s) : undefined
        const merged = mergeCellStyle(beforeStyle, item.partial)
        after =
          merged === undefined
            ? withoutStyle(before)
            : { ...before, s: ctx.sheet.stylePool.intern(merged) }
      } else {
        continue
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
