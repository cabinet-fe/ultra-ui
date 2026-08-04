import type { CellRange } from '../core/address'
import type { BorderPreset } from '../core/style/border-presets'
import { BORDER_STYLE_WIDTH, type BorderLineStyle } from '../core/style/types'
import type { SheetContext } from '../tools/context'

/** 当前选区（ranges[0] 优先；无区域选区时用活动格单格） */
export function currentRange(context: SheetContext): CellRange | null {
  const { activeCell, ranges } = context.getSelection()
  return ranges[0] ?? (activeCell ? { start: activeCell, end: activeCell } : null)
}

// ─── 边框面板常量 ────────────────────────────────────────────

export const BORDER_LINE_STYLES: BorderLineStyle[] = ['thin', 'medium', 'thick', 'dashed', 'dotted']

export const BORDER_LINE_TITLES: Record<BorderLineStyle, string> = {
  thin: '细线',
  medium: '中粗线',
  thick: '粗线',
  dashed: '虚线',
  dotted: '点线'
}

export const BORDER_PRESETS: ReadonlyArray<{ id: BorderPreset; title: string }> = [
  { id: 'all', title: '全边框' },
  { id: 'outer', title: '外边框' },
  { id: 'bottom', title: '下边框' },
  { id: 'none', title: '无边框' }
]

/** 边框预设 id（= core BorderPreset；预设补丁生成见 core/style/border-presets） */
export type BorderPresetId = BorderPreset

/** 线型示例条样式（边框面板的线型按钮 swatch） */
export function lineSwatchStyle(line: BorderLineStyle): Record<string, string> {
  const dash = line === 'dashed' ? 'dashed' : line === 'dotted' ? 'dotted' : 'solid'
  return { borderBottom: `${BORDER_STYLE_WIDTH[line]}px ${dash} #000` }
}
