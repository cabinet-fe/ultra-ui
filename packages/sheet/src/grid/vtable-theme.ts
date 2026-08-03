import { themes } from '@visactor/vtable'

/** 行号 / 列头浅底（canvas 主题无法读 CSS 变量，固定色贴近 Excel） */
const CHROME_BG = '#F5F5F5'
/** body 纯白，覆盖 DEFAULT 斑马底色 */
const BODY_BG = '#FFF'
/** 网格线 / 外框：浅灰（勿用 DEFAULTBORDERCOLOR #000） */
const GRID_BORDER = '#E1E4E8'
/** 选区边框：清晰蓝（覆盖 DEFAULT 的 #0000ff） */
const SELECTION_BORDER = '#2170E7'
/** 选区填充 */
const SELECTION_BG = 'rgba(33, 112, 231, 0.12)'

/**
 * 单元格内边距 [上, 右, 下, 左]。
 * VTable DEFAULT 为 `[10, 16, 10, 16]`，配合 `defaultRowHeight: 28` 会挤占文字区；
 * 收紧到贴近 Excel 的密度（仍留少量呼吸空间）。
 */
export const SHEET_CELL_PADDING = [2, 6, 2, 6] as const

/**
 * Sheet 默认 VTable 主题。
 *
 * 必须基于 `themes.DEFAULT.extends`：传入裸对象时 VTable 不会继承 DEFAULT，
 * 缺省 `borderColor` 会回落到内部 `DEFAULTBORDERCOLOR = '#000'`，出现刺眼黑线。
 */
export const sheetVTableTheme = themes.DEFAULT.extends({
  underlayBackgroundColor: BODY_BG,
  defaultStyle: {
    bgColor: CHROME_BG,
    borderColor: GRID_BORDER,
    padding: [...SHEET_CELL_PADDING],
    textOverflow: 'clip'
  },
  headerStyle: { bgColor: CHROME_BG, borderColor: GRID_BORDER, textOverflow: 'clip' },
  cornerHeaderStyle: { bgColor: CHROME_BG, borderColor: GRID_BORDER, textOverflow: 'clip' },
  rowHeaderStyle: { bgColor: CHROME_BG, borderColor: GRID_BORDER, textOverflow: 'clip' },
  bodyStyle: { bgColor: BODY_BG, borderColor: GRID_BORDER, textOverflow: 'clip' },
  frameStyle: {
    borderColor: GRID_BORDER,
    borderLineWidth: 1,
    shadowBlur: 0,
    shadowColor: 'transparent'
  },
  selectionStyle: {
    cellBgColor: SELECTION_BG,
    cellBorderColor: SELECTION_BORDER,
    cellBorderLineWidth: 2
  }
})

/** 行号列默认样式（与主题 chrome 对齐） */
export const sheetRowSeriesNumberStyle = {
  bgColor: CHROME_BG,
  borderColor: GRID_BORDER,
  padding: [...SHEET_CELL_PADDING],
  textOverflow: 'clip' as const
}

/** 默认行高（比 VTable 默认 40 更接近表格密度；与 SHEET_CELL_PADDING 搭配） */
export const SHEET_DEFAULT_ROW_HEIGHT = 28
