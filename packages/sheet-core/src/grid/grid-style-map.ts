import type { CellBorderStyle, CellStyle as EngineCellStyle } from '@infinite-table/core'

import type { CellAddress } from '../core/address'
import type { BorderLineStyle, BorderSide, CellStyle as SheetCellStyle } from '../core/style/types'
import { SHEET_CELL_PADDING, SHEET_DEFAULT_ROW_HEIGHT } from './grid-theme'

/** Excel pt → CSS px（96dpi / 72pt = 4/3） */
export function fontSizePtToPx(pt: number): number {
  return Math.round((pt * 4) / 3)
}

/** 默认字号（pt，对齐 Excel 常见默认） */
export const DEFAULT_FONT_SIZE_PT = 11

/** 字宽近似系数（相对字号 px；混合中西文折中） */
export const CHAR_WIDTH_RATIO = 0.6

/** 行高相对字号的行距系数 */
export const LINE_HEIGHT_RATIO = 1.25

/** 线型 → 引擎边框线型（thin/medium/thick 为实线粗细分级，宽度独立携带） */
const BORDER_STYLE_MAP: Record<BorderLineStyle, CellBorderStyle> = {
  thin: 'solid',
  medium: 'solid',
  thick: 'solid',
  dashed: 'dashed',
  dotted: 'dotted'
}

const BORDER_SIDES: readonly BorderSide[] = ['top', 'right', 'bottom', 'left']

/**
 * 模型样式 → 引擎 CellStyle（纯映射）。
 * fill → background、font（pt→px 换算在此层）、align（wrap → textWrap）、
 * 逐边边框（线型 thin/medium/thick → solid，dashed/dotted 引擎原生绘制）。
 * 引擎共享边裁决（邻格对侧边取强）由内核负责，映射层不读邻居。
 * 空样式返回 null（该格沿用主题分区 token）。
 */
export function sheetStyleToEngineStyle(style: SheetCellStyle | undefined): EngineCellStyle | null {
  if (!style) return null

  const result: EngineCellStyle = {}
  if (style.fill?.color) result.background = style.fill.color

  const font = style.font
  if (font) {
    if (font.color) result.color = font.color
    if (font.bold) result.fontWeight = 'bold'
    if (font.italic) result.fontStyle = 'italic'
    if (font.underline) result.underline = true
    if (font.strikethrough) result.lineThrough = true
    if (typeof font.size === 'number') result.fontSize = fontSizePtToPx(font.size)
  }

  const align = style.align
  if (align) {
    if (align.horizontal) result.textAlign = align.horizontal
    if (align.vertical) result.verticalAlign = align.vertical
    if (align.wrap) result.textWrap = true
  }

  if (style.border) {
    const border: EngineCellStyle['border'] = {}
    for (const side of BORDER_SIDES) {
      const edge = style.border[side]
      if (edge) {
        border[side] = { width: edge.width, color: edge.color, style: BORDER_STYLE_MAP[edge.style] }
      }
    }
    if (Object.keys(border).length > 0) result.border = border
  }

  return Object.keys(result).length > 0 ? result : null
}

/**
 * 估算含 wrap 格的行高（px）：按列宽 ÷ 字宽近似折行数 × 行距。
 * 估算偏差与合并格 wrap 为已知边界（见 AGENTS.md）。
 */
export function estimateWrapRowHeight(params: {
  text: string
  colWidth: number
  fontSizePt?: number
}): number {
  const fontPx = fontSizePtToPx(params.fontSizePt ?? DEFAULT_FONT_SIZE_PT)
  const padX = SHEET_CELL_PADDING[1] + SHEET_CELL_PADDING[3]
  const padY = SHEET_CELL_PADDING[0] + SHEET_CELL_PADDING[2]
  const available = Math.max(fontPx, params.colWidth - padX)
  const lineHeight = fontPx * LINE_HEIGHT_RATIO
  let lines = 0
  for (const paragraph of params.text.split('\n')) {
    let units = 0
    for (let i = 0; i < paragraph.length; i++) {
      const code = paragraph.charCodeAt(i)
      units += code > 0x7f ? 1.0 : CHAR_WIDTH_RATIO
    }
    if (units === 0) units = 1
    lines += Math.max(1, Math.ceil((units * fontPx) / available))
  }
  if (lines === 0) lines = 1
  return Math.max(SHEET_DEFAULT_ROW_HEIGHT, Math.ceil(lines * lineHeight + padY))
}

/**
 * 只读 wrap / 字号（wrap 行高扫描热路径）：
 * 取格生效样式的 wrap 与字号（合并格读锚点；引擎侧渲染按同一样式管线取值）。
 */
export function getWrapMetrics(
  sheet: { getEffectiveStyle(addr: CellAddress): SheetCellStyle | undefined },
  addr: CellAddress
): { wrap: boolean; fontSizePt?: number } {
  const style = sheet.getEffectiveStyle(addr)
  return { wrap: style?.align?.wrap === true, fontSizePt: style?.font?.size }
}
