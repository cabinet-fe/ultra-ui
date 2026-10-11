import type { CellLinkPayload, CellRange } from 'infinitable/sheet'
import type { BorderPreset } from 'infinitable/sheet'
import { BORDER_STYLE_WIDTH, type BorderLineStyle } from 'infinitable/sheet'

import type { SheetContext } from '../../tools/context'

/** 当前选区（ranges[0] 优先；无区域选区时用活动格单格） */
export function currentRange(context: SheetContext): CellRange | null {
  const { activeCell, ranges } = context.getSelection()
  return ranges[0] ?? (activeCell ? { start: activeCell, end: activeCell } : null)
}

// ─── 超链接配置弹窗共享类型（hyperlink-popup.vue 与菜单/宿主接线共用） ──

/** 弹窗模式：cell = 单元格链接（地址 + 显示文本）；image = 图片链接（仅地址，P4 接线） */
export type HyperlinkPopupMode = 'cell' | 'image'

/**
 * 弹窗确认载荷：显示文本留空时不含 text（不写入链接文本覆盖 →
 * 单元格沿用自身内容作为显示，见 spec「显示文本留空提交沿用原显示文本」）
 */
export interface HyperlinkConfirmPayload {
  url: string
  text?: string
}

/**
 * 拉起超链接配置弹窗的句柄：右键菜单 build 函数经 options 注入
 * （保持纯函数可测，不直接 import 组件状态）；编辑时回填原链接载荷。
 */
export type OpenHyperlinkPopup = (mode: HyperlinkPopupMode, initial?: CellLinkPayload) => void

// ─── 边框面板常量 ────────────────────────────────────────────

export const BORDER_LINE_STYLES: BorderLineStyle[] = ['thin', 'medium', 'thick', 'dashed', 'dotted']

export const BORDER_LINE_TITLES: Record<BorderLineStyle, string> = {
  thin: '细线',
  medium: '中粗线',
  thick: '粗线',
  dashed: '虚线',
  dotted: '点线'
}

/** 田字格 glyph 标识（与预设 id 对齐，供 SVG 高亮对应边） */
export type BorderPresetGlyph = BorderPreset

export const BORDER_PRESETS: ReadonlyArray<{
  id: BorderPreset
  title: string
  glyph: BorderPresetGlyph
}> = [
  { id: 'outer', title: '外边框', glyph: 'outer' },
  { id: 'inner', title: '内边框', glyph: 'inner' },
  { id: 'all', title: '所有边框', glyph: 'all' },
  { id: 'top', title: '上边框', glyph: 'top' },
  { id: 'bottom', title: '下边框', glyph: 'bottom' },
  { id: 'left', title: '左边框', glyph: 'left' },
  { id: 'right', title: '右边框', glyph: 'right' },
  { id: 'none', title: '无边框', glyph: 'none' }
]

/** 边框预设 id（= core BorderPreset；预设补丁生成见 core/style/border-presets） */
export type BorderPresetId = BorderPreset

/** 线型示例条样式（边框面板的线型按钮 swatch） */
export function lineSwatchStyle(line: BorderLineStyle): Record<string, string> {
  const dash = line === 'dashed' ? 'dashed' : line === 'dotted' ? 'dotted' : 'solid'
  return { borderBottom: `${BORDER_STYLE_WIDTH[line]}px ${dash} #000` }
}
