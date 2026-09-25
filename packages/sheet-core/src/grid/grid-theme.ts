import type { ThemeOverride } from '@infinite-table/core'

/** 行号 / 列头浅底（canvas 主题无法读 CSS 变量，固定色贴近 Excel） */
const CHROME_BG = '#F5F5F5'
/** body 纯白 */
const BODY_BG = '#FFF'
/** 网格线 / 外框：浅灰 */
export const GRID_BORDER = '#E1E4E8'
/** 选区边框：清晰蓝 */
const SELECTION_BORDER = '#2170E7'
/** 选区填充 */
const SELECTION_BG = 'rgba(33, 112, 231, 0.12)'

/**
 * 单元格内边距 [上, 右, 下, 左]。
 * 贴近 Excel 的密度（仍留少量呼吸空间）。
 */
export const SHEET_CELL_PADDING = [2, 6, 2, 6] as const

/**
 * Sheet 默认引擎主题（对标替换前 vtable-theme 实际生效值，同 demo sheet 区口径）：
 * 表头/行号浅底非粗体 12px 居中、正文白底、格内边距 [2,6,2,6]、网格线 #E1E4E8
 * （引擎网格边为右/下 1px 收入本格式，等价旧 cellBorderClipDirection: 'bottom-right'）、
 * 选区 #2170E7 2px + 12% 填充、hover 关闭（disableHover 显式开关）。
 */
export const SHEET_GRID_THEME: ThemeOverride = {
  // body 不写 textOverflow：缺省时引擎按 Excel 式溢出走廊渲染（右侧邻格为空则溢出展示），
  // 列头/行头由引擎缺省 ellipsis（见 list-table-scene 的 chrome 缺省），无需在此显式声明
  body: {
    color: '#000000',
    fontSize: 14,
    padding: [...SHEET_CELL_PADDING],
    background: BODY_BG,
    borderColor: GRID_BORDER
  },
  header: {
    color: '#000000',
    fontSize: 12,
    padding: [...SHEET_CELL_PADDING],
    background: CHROME_BG,
    borderColor: GRID_BORDER,
    textAlign: 'center',
    textOverflow: 'ellipsis'
  },
  // rowHeader / corner 分区缺省随生效 header 派生（与旧 rowHeaderStyle/cornerHeaderStyle 同值）
  underlayBackgroundColor: BODY_BG,
  interaction: {
    selectionFill: SELECTION_BG,
    selectionBorder: SELECTION_BORDER,
    selectionBorderWidth: 2,
    fillHandle: SELECTION_BORDER,
    resizeLine: SELECTION_BORDER,
    headerHighlight: 'rgba(33, 112, 231, 0.1)',
    // 冻结分隔线对齐 Excel 观感（比网格线 #E1E4E8 深一档）
    freezeDividerColor: '#B6BABF',
    freezeDividerWidth: 1
  },
  hover: { disableHover: true },
  frameStyle: { lineWidth: 1, color: GRID_BORDER, shadow: false }
}

/** 默认行高（贴近表格密度；与 SHEET_CELL_PADDING 搭配） */
export const SHEET_DEFAULT_ROW_HEIGHT = 28

/** 列头带高（对齐替换前行高密度） */
export const SHEET_HEADER_HEIGHT = 28

/** 行号列宽（对齐替换前 rowSeriesNumber.width） */
export const SHEET_ROW_HEADER_WIDTH = 46

/**
 * 默认列宽（px），对齐替换前默认值。
 * 未设置自定义列宽时网格使用此默认值；模型稀疏 colWidths 经列定义构造期写入。
 */
export const SHEET_DEFAULT_COL_WIDTH = 80
