import { iterateRange, type CellRange } from '../core/address'
import type { SetCellStyleItem } from '../core/command/set-cell-style'
import {
  BORDER_STYLE_WIDTH,
  type BorderEdge,
  type BorderLineStyle,
  type CellStylePatch
} from '../core/style/types'
import type { SheetContext } from '../tools/context'

/** 当前选区（ranges[0] 优先；无区域选区时用活动格单格） */
export function currentRange(context: SheetContext): CellRange | null {
  const { activeCell, ranges } = context.getSelection()
  return ranges[0] ?? (activeCell ? { start: activeCell, end: activeCell } : null)
}

// ─── 边框面板常量与纯逻辑 ─────────────────────────────────────

export const BORDER_LINE_STYLES: BorderLineStyle[] = ['thin', 'medium', 'thick', 'dashed', 'dotted']

export const BORDER_LINE_TITLES: Record<BorderLineStyle, string> = {
  thin: '细线',
  medium: '中粗线',
  thick: '粗线',
  dashed: '虚线',
  dotted: '点线'
}

export const BORDER_PRESETS = [
  { id: 'all', title: '全边框' },
  { id: 'outer', title: '外边框' },
  { id: 'bottom', title: '下边框' },
  { id: 'none', title: '无边框' }
] as const

export type BorderPresetId = (typeof BORDER_PRESETS)[number]['id']

/** 线型示例条样式（边框面板的线型按钮 swatch） */
export function lineSwatchStyle(line: BorderLineStyle): Record<string, string> {
  const dash = line === 'dashed' ? 'dashed' : line === 'dotted' ? 'dotted' : 'solid'
  return { borderBottom: `${BORDER_STYLE_WIDTH[line]}px ${dash} #000` }
}

/**
 * 边框预设 → 逐格 SetCellStyleItem（Excel 语义，逐格表达）：
 * - 全边框：每格四边；外边框：包围盒外缘边（顶行 top / 底行 bottom / 左列 left / 右列 right）
 * - 下边框：底行 bottom；无边框：清除全部边框（保留填充）
 * 返回值交给 set-cell-style 命令一次执行（items 批量）= 一个 undo 单元。
 */
export function buildBorderPresetItems(
  range: CellRange,
  preset: BorderPresetId,
  lineStyle: BorderLineStyle,
  color: string
): SetCellStyleItem[] {
  const items: SetCellStyleItem[] = []
  const edge: BorderEdge = { style: lineStyle, width: BORDER_STYLE_WIDTH[lineStyle], color }
  if (preset === 'none') {
    for (const addr of iterateRange(range)) items.push({ addr, partial: { border: {} } })
    return items
  }
  for (const addr of iterateRange(range)) {
    const border: CellStylePatch['border'] = {}
    const onTop = addr.row === range.start.row
    const onBottom = addr.row === range.end.row
    const onLeft = addr.col === range.start.col
    const onRight = addr.col === range.end.col
    if (preset === 'all' || (preset === 'outer' && onTop)) border.top = { ...edge }
    if (preset === 'all' || (preset === 'outer' && onRight)) border.right = { ...edge }
    if (preset === 'all' || ((preset === 'outer' || preset === 'bottom') && onBottom)) {
      border.bottom = { ...edge }
    }
    if (preset === 'all' || (preset === 'outer' && onLeft)) border.left = { ...edge }
    if (Object.keys(border).length > 0) items.push({ addr, partial: { border } })
  }
  return items
}
