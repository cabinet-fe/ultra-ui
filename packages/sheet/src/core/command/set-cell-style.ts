import { cellKey, type CellAddress } from '../address'
import { cellDataEqual, isEmptyCellData, type CellData } from '../cell-store'
import { normalizeStyle } from '../style/style-pool'
import {
  ALIGN_STYLE_KEYS,
  BORDER_EDGE_DEFAULTS,
  BORDER_SIDES,
  FONT_STYLE_KEYS,
  type BorderEdge,
  type CellAlign,
  type CellFont,
  type CellStyle,
  type CellStylePatch
} from '../style/types'
import type { CellPatch, Command, CommandResult } from './types'

/** 逐字段合并：null/false = 删除该字段；其余非 undefined 值写入 */
function mergeNullableFields<T extends object>(
  target: T,
  patch: { [K in keyof T]?: T[K] | null },
  keys: readonly (keyof T)[]
): void {
  for (const key of keys) {
    const value = patch[key]
    if (value === undefined) continue
    if (value === null || value === false) delete target[key]
    else target[key] = value as T[typeof key]
  }
}

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
 * - 顶层浅合并：只给 fill 时保留既有 border/font/align（反之亦然）
 * - fill 存在即覆盖填充（`{}` = 清除填充，保留其余）
 * - border 存在即**边级合并**：边值为对象 → 与既有边合并（缺失字段保留既有
 *   边值；无既有边时用默认值补全：thin / 1px / #000000）；边值为 `null` →
 *   删除该边（其余边保留）；未列出的边 → 保留（`border: {}` = 无边变化）
 * - font / align 存在即**逐字段浅合并**（缺失字段保留既有值）；
 *   `font: {}` / `align: {}` = 清除该类全部；字段值为 `null` = 删除该字段
 * - 合并结果为空 → undefined（调用方删除 s 字段）
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
    // 未列出的边保留既有值（边级合并，不再是重定义整个边集合）
    for (const side of BORDER_SIDES) {
      const existing = before?.border?.[side]
      if (existing) border[side] = { ...existing }
    }
    for (const side of BORDER_SIDES) {
      const patchEdge = partial.border[side]
      if (patchEdge === undefined) continue
      // null = 删除该边（共享边写入时同步邻居用），其余边不受影响
      if (patchEdge === null) {
        delete border[side]
        continue
      }
      const edge: BorderEdge = {
        style: patchEdge.style ?? border[side]?.style ?? BORDER_EDGE_DEFAULTS.style,
        width: patchEdge.width ?? border[side]?.width ?? BORDER_EDGE_DEFAULTS.width,
        color: patchEdge.color ?? border[side]?.color ?? BORDER_EDGE_DEFAULTS.color
      }
      border[side] = edge
    }
    if (Object.keys(border).length > 0) merged.border = border
  } else if (before?.border) {
    merged.border = { ...before.border }
  }
  if (partial.font !== undefined) {
    if (Object.keys(partial.font).length > 0) {
      const font: CellFont = { ...before?.font }
      mergeNullableFields(font, partial.font, FONT_STYLE_KEYS)
      if (Object.keys(font).length > 0) merged.font = font
    }
    // font: {} = 清除全部字体字段（不写 merged.font）
  } else if (before?.font) {
    merged.font = { ...before.font }
  }
  if (partial.align !== undefined) {
    if (Object.keys(partial.align).length > 0) {
      const align: CellAlign = { ...before?.align }
      mergeNullableFields(align, partial.align, ALIGN_STYLE_KEYS)
      if (Object.keys(align).length > 0) merged.align = align
    }
    // align: {} = 清除全部对齐字段
  } else if (before?.align) {
    merged.align = { ...before.align }
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
