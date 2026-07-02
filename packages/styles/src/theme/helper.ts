import type { RGBColor } from './type'

/** 实现十六进制颜色转RGB颜色，包括透明度 */
export function HEXToRGB(color: string): RGBColor {
  // 移除可能存在的 '#' 前缀
  let hex = color.replace(/^#/, '')
  let [r, g, b] = [0, 0, 0]

  if (hex.length === 3) {
    const [r10, g10, b10] = [hex[0]!, hex[1]!, hex[2]!]
    hex = `${r10}${r10}${g10}${g10}${b10}${b10}`
  }

  r = parseInt(hex.slice(0, 2), 16)
  g = parseInt(hex.slice(2, 4), 16)
  b = parseInt(hex.slice(4, 6), 16)

  return [r, g, b]
}

/**
 * 混合两个颜色，并返回混合结果的十六进制表示。
 * @param color1 - 第一个颜色，格式为`#RRGGBB`。
 * @param color2 - 第二个颜色，格式为`#RRGGBB`。
 * @param ratio - 颜色混合的比例，取值范围为0到1。
 * @returns 混合结果的十六进制表示。
 */
export function mixColor(color1: `#${string}`, color2: `#${string}`, ratio: number): string {
  if (ratio > 1) throw new Error('ratio的值在0-1之间')
  const color1RGB = HEXToRGB(color1)
  const color2RGB = HEXToRGB(color2)

  const color1Ratio = 1 - ratio

  return (
    '#' +
    color1RGB
      .map((n, i) => {
        const hex = Math.floor(color1Ratio * n + color2RGB[i]! * ratio).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

/** 将 `#RRGGBB` 转为指定不透明度百分比的 `rgba()`（等价于 color-mix N% + transparent） */
export function hexWithAlpha(hex: `#${string}`, alphaPercent: number): string {
  const [r, g, b] = HEXToRGB(hex)
  const alpha = Math.round((alphaPercent / 100) * 1000) / 1000
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 别名：`ratio` 为 0–1 时不透明度（0.08 → 8%） */
export function mixColorWithAlpha(color: `#${string}`, ratio: number): string {
  return hexWithAlpha(color, ratio * 100)
}

/** 剥离 `#RRGGBBAA` 的 alpha 通道，返回 `#RRGGBB` */
export function hexRgbOnly(hex: string): `#${string}` {
  const normalized = hex.replace(/^#/, '')
  if (normalized.length === 8) {
    return `#${normalized.slice(0, 6)}` as `#${string}`
  }
  return hex as `#${string}`
}

export function defineBySize(
  variable: Record<'small' | 'default' | 'large', number>
): Record<'small' | 'default' | 'large', number> {
  return variable
}

/**
 * 引用全局主题 CSS 变量（`--u-*` 命名空间）
 * @param prop - 与 Theme 结构对应的连字符路径，如 `text-color-title`、`bg-color-hover`
 */
export function cssVar(prop: string): string {
  return `var(--u-${prop})`
}
