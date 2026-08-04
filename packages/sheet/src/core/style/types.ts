/**
 * 单元格样式类型（Phase 1：背景填充 + 四边边框；Phase 4：字体 / 对齐 / 换行）。
 *
 * 样式定义集中存储在 StylePool（随 Sheet 持有），单元格 CellData 只持
 * StyleId 引用——相同样式无论多少单元格共享一份定义，降低内存与序列化体积。
 * 预留扩展位（本期不实现）：numFmt（数字格式）、fontFamily（字体族）。
 */

/** 边框线型：thin/medium/thick 为实线粗细分级，dashed/dotted 为虚线/点线 */
export type BorderLineStyle = 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted'

/** 边框四边（VTable 数组顺序同为 [top, right, bottom, left]） */
export const BORDER_SIDES = ['top', 'right', 'bottom', 'left'] as const

/** 边框边名 */
export type BorderSide = (typeof BORDER_SIDES)[number]

/** 单边边框定义 */
export interface BorderEdge {
  /** 线型 */
  style: BorderLineStyle
  /** 线宽（px） */
  width: number
  /** 颜色（CSS 颜色） */
  color: string
}

/** 水平对齐 */
export type HorizontalAlign = 'left' | 'center' | 'right'

/** 垂直对齐（模型用 middle；hucre/Excel 导出为 center） */
export type VerticalAlign = 'top' | 'middle' | 'bottom'

/** 字体样式（字号单位 pt，与 Excel/OOXML 一致） */
export interface CellFont {
  /** 字体颜色 '#RRGGBB'；缺省 = 主题文本色 */
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  /** 字号（pt）；渲染时 ×4/3 转 px */
  size?: number
}

/** 对齐与换行 */
export interface CellAlign {
  horizontal?: HorizontalAlign
  vertical?: VerticalAlign
  /** 自动换行 */
  wrap?: boolean
}

/** 单元格样式（样式池条目） */
export interface CellStyle {
  /** 背景填充；缺省 = 无填充 */
  fill?: { color: string }
  /** 四边边框；缺省边 = 无边框 */
  border?: Partial<Record<BorderSide, BorderEdge>>
  /** 字体；缺省 = 主题默认 */
  font?: CellFont
  /** 对齐 / 换行；缺省 = 左对齐、垂直居中语义由主题决定 */
  align?: CellAlign
  // 预留扩展位（本期不实现）：numFmt?: string
}

/** 样式 id（样式池索引；CellData.s 引用；1 起递增，池内唯一） */
export type StyleId = number

/**
 * 部分样式补丁（SetCellStyleCommand 的部分合并语义）：
 * - 顶层浅合并：只给 fill 时保留既有 border/font/align，反之亦然
 * - `fill` 字段存在即覆盖填充（`{}` / `{ color: undefined }` = 清除填充，保留其余）
 * - `border` 字段存在即**边级合并**：
 *   - 边值为对象 → 与既有边合并（缺失字段保留既有边值，无既有边时用默认值补全）
 *   - 边值为 `null` → 删除该边（其余边保留），用于共享边写入时同步邻居
 *   - 未列出的边 → 保留（`border: {}` = 无边变化）
 * - `font` / `align` 字段存在即**逐字段浅合并**（缺失字段保留既有值）；
 *   `font: {}` / `align: {}` = 清除该类全部字段；字段值为 `null` = 删除该字段
 * - 要表达「重定义整个边集合」（如无边框预设），需显式给出四边（含 `null`）
 */
export interface CellStylePatch {
  fill?: { color?: string }
  border?: Partial<Record<BorderSide, Partial<BorderEdge> | null>>
  font?: {
    color?: string | null
    bold?: boolean | null
    italic?: boolean | null
    underline?: boolean | null
    strikethrough?: boolean | null
    size?: number | null
  }
  align?: {
    horizontal?: HorizontalAlign | null
    vertical?: VerticalAlign | null
    wrap?: boolean | null
  }
}

/** 线型 → 默认线宽（px）；工具预设与缺失字段补全用 */
export const BORDER_STYLE_WIDTH: Record<BorderLineStyle, number> = {
  thin: 1,
  medium: 2,
  thick: 3,
  dashed: 1,
  dotted: 1
}

/** 单边边框缺失字段的默认值（mergeCellStyle 补全用） */
export const BORDER_EDGE_DEFAULTS: BorderEdge = { style: 'thin', width: 1, color: '#000000' }

/** 字体字段固定序列化顺序（样式池 key 稳定） */
export const FONT_STYLE_KEYS = [
  'color',
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'size'
] as const satisfies readonly (keyof CellFont)[]

/** 对齐字段固定序列化顺序（样式池 key 稳定） */
export const ALIGN_STYLE_KEYS = [
  'horizontal',
  'vertical',
  'wrap'
] as const satisfies readonly (keyof CellAlign)[]
