import { normalizeStyle } from './style-pool'
import {
  ALIGN_STYLE_KEYS,
  BORDER_SIDES,
  FONT_STYLE_KEYS,
  type CellAlign,
  type CellFont,
  type CellStyle
} from './types'

/**
 * 完整样式层叠加（列 → 行 → 格）：后者覆盖同名字段。
 *
 * 与 `mergeCellStyle`（编辑补丁，含 `null` 删除）不同：本函数是「完整样式层」叠加，
 * overlay 未给出的字段保留 base。
 * - fill：overlay 含 fill 则整层替换（无 color → 清除填充）
 * - border：边级——overlay 给出的边替换，未给出的边保留 base；`border` 缺省 = 全保留
 * - font / align：字段级——overlay 定义的字段覆盖
 */
export function composeCellStyles(
  base: CellStyle | undefined,
  overlay: CellStyle | undefined
): CellStyle | undefined {
  if (!overlay) return base ? normalizeStyle(cloneLayer(base)) : undefined
  if (!base) return normalizeStyle(cloneLayer(overlay))

  const merged: CellStyle = {}

  if (overlay.fill !== undefined) {
    if (overlay.fill.color) merged.fill = { color: overlay.fill.color }
  } else if (base.fill) {
    merged.fill = { ...base.fill }
  }

  if (overlay.border !== undefined || base.border) {
    const border: NonNullable<CellStyle['border']> = {}
    for (const side of BORDER_SIDES) {
      const edge = overlay.border?.[side] ?? base.border?.[side]
      if (edge) border[side] = { ...edge }
    }
    if (Object.keys(border).length > 0) merged.border = border
  }

  const font = composeFields(base.font, overlay.font, FONT_STYLE_KEYS)
  if (font) merged.font = font

  const align = composeFields(base.align, overlay.align, ALIGN_STYLE_KEYS)
  if (align) merged.align = align

  return normalizeStyle(merged)
}

/** 浅拷贝一层样式（fill / 各边 / font / align 独立对象） */
function cloneLayer(style: CellStyle): CellStyle {
  const out: CellStyle = {}
  if (style.fill) out.fill = { ...style.fill }
  if (style.border) {
    const border: NonNullable<CellStyle['border']> = {}
    for (const side of BORDER_SIDES) {
      const edge = style.border[side]
      if (edge) border[side] = { ...edge }
    }
    if (Object.keys(border).length > 0) out.border = border
  }
  if (style.font) out.font = { ...style.font }
  if (style.align) out.align = { ...style.align }
  return out
}

/** 字段级叠加：overlay 定义的字段覆盖 base；全空 → undefined */
function composeFields<T extends CellFont | CellAlign>(
  base: T | undefined,
  overlay: T | undefined,
  keys: readonly (keyof T)[]
): T | undefined {
  if (!overlay && !base) return undefined
  if (!overlay) return { ...base! }
  const out = { ...base } as T
  for (const key of keys) {
    const value = overlay[key]
    if (value !== undefined) out[key] = value
  }
  return Object.keys(out).length > 0 ? out : undefined
}
