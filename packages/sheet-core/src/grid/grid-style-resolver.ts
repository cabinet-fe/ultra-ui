import type { ListTable } from '@visactor/vtable'
import type { ITextStyleOption } from '@visactor/vtable/es/ts-types/column/style'
import type { StylePropertyFunctionArg } from '@visactor/vtable/es/ts-types/style-define'

import type { CellAddress } from '../core/address'
import type { Sheet } from '../core/sheet'
import {
  BORDER_SIDES,
  type BorderEdge,
  type BorderLineStyle,
  type BorderSide,
  type CellStyle
} from '../core/style/types'
import type { GridCoords } from './grid-coords'
import { GRID_BORDER } from './vtable-theme'

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

/** 线型 → VTable borderLineDash（null = 实线） */
export const BORDER_STYLE_DASH: Record<BorderLineStyle, number[] | null> = {
  thin: null,
  medium: null,
  thick: null,
  dashed: [4, 2],
  dotted: [1, 2]
}

/**
 * 动态单元格样式 Hook：视口单元格渲染时触发。
 * 在保持底层 Cell Store 数据不变的前提下，结合地址与静态 baseStyle 返回合并/替换后的 CellStyle。
 */
export type ResolveCellStyleHook = (
  addr: CellAddress,
  baseStyle?: CellStyle
) => CellStyle | undefined

/**
 * 模型样式 → VTable ITextStyleOption（fill/border/font/align）。
 * 导出供单测直接断言映射；grid 渲染经 resolveCellStyle 调用。
 *
 * 四边数组顺序 [top, right, bottom, left]（与 VTable ColorsPropertyDefine 一致）。
 * 未自定义的边显式回落主题网格线（GRID_BORDER / 1px / 实线）：VTable 的
 * `style.borderColor ?? bodyStyle.borderColor` 是整体替换而非逐边合并，回调一旦
 * 给出数组主题网格线即被整个丢弃，边为 null 则该边不画（只设填充或部分边时
 * 网格线丢失，根因 A），因此必须逐边给出。
 *
 * @param style 本格样式（合并格读锚点）
 * @param facing 四侧邻居的对侧边（left = 左邻居的 right 边，以此类推；越界侧为 undefined）
 */
export function cellStyleToVTableStyle(
  style: CellStyle | undefined,
  facing: Partial<Record<BorderSide, BorderEdge | undefined>> = {}
): ITextStyleOption {
  // 无样式且四侧邻居均无对侧自定义边 → 空对象（主题统一网格线，避免逐格 split 描边）
  if (!style && BORDER_SIDES.every((side) => facing[side] == null)) return {}

  const borderColor: (string | null)[] = [null, null, null, null]
  const borderLineWidth: (number | null)[] = [null, null, null, null]
  const borderLineDash: (number[] | null)[] = [null, null, null, null]
  for (let i = 0; i < BORDER_SIDES.length; i++) {
    const side = BORDER_SIDES[i]!
    const edge = style?.border?.[side] ?? facing[side]
    if (edge) {
      borderColor[i] = edge.color
      borderLineWidth[i] = edge.width
      borderLineDash[i] = BORDER_STYLE_DASH[edge.style]
    } else {
      borderColor[i] = GRID_BORDER
      borderLineWidth[i] = 1
      borderLineDash[i] = null
    }
  }

  const result: ITextStyleOption = {
    ...(style?.fill ? { bgColor: style.fill.color } : {}),
    borderColor,
    borderLineWidth,
    borderLineDash
  }

  const font = style?.font
  if (font) {
    if (font.color) result.color = font.color
    if (font.bold) result.fontWeight = 'bold'
    if (font.italic) result.fontStyle = 'italic'
    if (font.underline) result.underline = true
    if (font.strikethrough) result.lineThrough = true
    if (typeof font.size === 'number') result.fontSize = fontSizePtToPx(font.size)
  }

  const align = style?.align
  if (align) {
    if (align.horizontal) result.textAlign = align.horizontal
    if (align.vertical) result.textBaseline = align.vertical
    if (align.wrap) result.autoWrapText = true
  }

  return result
}

export class GridStyleResolver {
  private readonly sheet: Sheet
  private cols: number
  private rows: number
  private readonly resolveCellStyleHook?: ResolveCellStyleHook

  constructor(
    sheet: Sheet,
    cols: number,
    rows: number,
    options?: { resolveCellStyle?: ResolveCellStyleHook }
  ) {
    this.sheet = sheet
    this.cols = cols
    this.rows = rows
    this.resolveCellStyleHook = options?.resolveCellStyle
  }

  /** 获取单元格生效样式（已通过 resolveCellStyleHook 叠加动态样式补丁） */
  getEffectiveStyle(addr: CellAddress): CellStyle | undefined {
    const baseStyle = this.getStoredStyle(addr)
    return this.resolveCellStyleHook
      ? (this.resolveCellStyleHook(addr, baseStyle) ?? baseStyle)
      : baseStyle
  }

  /**
   * 模型样式 → VTable 样式（逐格动态求值）。
   * 合并格读锚点样式；无样式格回落主题默认（空对象）。四侧邻居的对侧边
   * 一并读取（共享边双向溯源，见 cellStyleToVTableStyle）。
   * 预留 Ticket 01 扩展点：resolveCellStyleHook(addr, baseStyle)。
   */
  resolveCellStyle(styleArg: StylePropertyFunctionArg, coords: GridCoords): ITextStyleOption {
    const table = styleArg.table as ListTable
    const addr = coords.toSheetAddr(table, styleArg.col, styleArg.row)
    if (!addr) return {}

    const effectiveStyle = this.getEffectiveStyle(addr)

    // facing 读取跳过本格合并跨度：右/下邻居落在合并区内时会解析回本格锚点，
    // 导致合并格右/下外缘镜像其左/上边框——应读合并区外的首个格
    const merge = this.sheet.merges.getMergeAt(addr)
    const rightCol = (merge?.end.col ?? addr.col) + 1
    const bottomRow = (merge?.end.row ?? addr.row) + 1
    const facing: Partial<Record<BorderSide, BorderEdge | undefined>> = {}
    if (addr.col > 0) {
      facing.left = this.getFacingEdge({ row: addr.row, col: addr.col - 1 }, 'right', addr)
    }
    if (rightCol < this.cols) {
      facing.right = this.getFacingEdge({ row: addr.row, col: rightCol }, 'left', addr)
    }
    if (addr.row > 0) {
      facing.top = this.getFacingEdge({ row: addr.row - 1, col: addr.col }, 'bottom', addr)
    }
    if (bottomRow < this.rows) {
      facing.bottom = this.getFacingEdge({ row: bottomRow, col: addr.col }, 'top', addr)
    }
    return cellStyleToVTableStyle(effectiveStyle, facing)
  }

  /**
   * 读取邻居格的对侧边（共享边溯源）；邻居与本格同属一个合并锚点
   * （合并区内部）→ undefined（同一条边不与自己互为 facing）。
   * 渲染热路径用只读访问器（peekCell / stylePool.peek），避免逐格拷贝分配（#11）。
   */
  getFacingEdge(addr: CellAddress, side: BorderSide, self: CellAddress): BorderEdge | undefined {
    const selfAnchor = this.sheet.merges.resolveAnchor(self)
    const anchor = this.sheet.merges.resolveAnchor(addr)
    if (anchor.row === selfAnchor.row && anchor.col === selfAnchor.col) return undefined
    const effectiveStyle = this.getEffectiveStyle(anchor)
    return effectiveStyle?.border?.[side]
  }

  /**
   * 读取格静态基础样式（列 → 行 → 格叠加；合并格读锚点；无样式 → undefined）。
   * 空单元格无 `s` 时仍可继承行列默认样式。渲染热路径走 peek（#11）。
   */
  getStoredStyle(addr: CellAddress): CellStyle | undefined {
    return this.sheet.getEffectiveStyle(addr)
  }
}
