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
export function mixColor(
  color1: `#${string}`,
  color2: `#${string}`,
  ratio: number
) {
  if (ratio > 1) throw new Error('ratio的值在0-1之间')
  const color1RGB = HEXToRGB(color1)
  const color2RGB = HEXToRGB(color2)

  const color1Ratio = 1 - ratio

  return (
    '#' +
    color1RGB
      .map((n, i) => {
        const hex = Math.floor(
          color1Ratio * n + color2RGB[i]! * ratio
        ).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}
