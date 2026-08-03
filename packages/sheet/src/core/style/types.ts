/**
 * 单元格样式类型（Phase 1：背景填充 + 四边边框）。
 *
 * 样式定义集中存储在 StylePool（随 Sheet 持有），单元格 CellData 只持
 * StyleId 引用——相同样式无论多少单元格共享一份定义，降低内存与序列化体积。
 * 预留扩展位（本期不实现）：font（字体）、numFmt（数字格式）。
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

/** 单元格样式（样式池条目） */
export interface CellStyle {
  /** 背景填充；缺省 = 无填充 */
  fill?: { color: string }
  /** 四边边框；缺省边 = 无边框 */
  border?: Partial<Record<BorderSide, BorderEdge>>
  // 预留扩展位（本期不实现）：font?: CellFont；numFmt?: string
}

/** 样式 id（样式池索引；CellData.s 引用；1 起递增，池内唯一） */
export type StyleId = number

/**
 * 部分样式补丁（SetCellStyleCommand 的部分合并语义）：
 * - 顶层浅合并：只给 fill 时保留既有 border，反之亦然
 * - `fill` 字段存在即覆盖填充（`{}` / `{ color: undefined }` = 清除填充，保留边框）
 * - `border` 字段存在即重定义边框集合（未给出的边清除），各边内部与既有边
 *   合并（缺失字段保留既有边值，无既有边时用默认值补全）
 * - `border: {}` = 清除全部边框（保留填充）
 */
export interface CellStylePatch {
  fill?: { color?: string }
  border?: Partial<Record<BorderSide, Partial<BorderEdge>>>
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
