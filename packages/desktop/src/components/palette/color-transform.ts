import type { PaletteRGB, PaletteHSV } from '../../types'

export function HUE2RGB(h: number): PaletteRGB {
  const segment = h / 60
  const x = 1 - Math.abs((segment % 2) - 1) // 计算中间值
  let r = 0,
    g = 0,
    b = 0
  if (segment >= 0 && segment < 1) {
    ;[r, g, b] = [1, x, 0]
  } else if (segment < 2) {
    ;[r, g, b] = [x, 1, 0]
  } else if (segment < 3) {
    ;[r, g, b] = [0, 1, x]
  } else if (segment < 4) {
    ;[r, g, b] = [0, x, 1]
  } else if (segment < 5) {
    ;[r, g, b] = [x, 0, 1]
  } else {
    ;[r, g, b] = [1, 0, x]
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

export function HSV2RGB(hsv: PaletteHSV): PaletteRGB {
  const { h, s, v } = hsv

  const { r, g, b } = HUE2RGB(h)

  const saturationFactor = 1 - s
  const valueFactor = v

  return {
    r: Math.round((r + (255 - r) * saturationFactor) * valueFactor),
    g: Math.round((g + (255 - g) * saturationFactor) * valueFactor),
    b: Math.round((b + (255 - b) * saturationFactor) * valueFactor)
  }
}

export function RGB2HEX(RGB: PaletteRGB, alpha = 1): string {
  let hexStr = ['r', 'g', 'b']
    .map((key) => RGB[key].toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  if (alpha < 1) {
    hexStr += Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  }

  return hexStr
}

export function RGB2HSV(RGB: PaletteRGB): PaletteHSV {
  const red = RGB.r / 255
  const green = RGB.g / 255
  const blue = RGB.b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === red) {
      h = ((green - blue) / delta) % 6
    } else if (max === green) {
      h = (blue - red) / delta + 2
    } else {
      h = (red - green) / delta + 4
    }
    h = (h * 60 + 360) % 360
  }
  const s = max === 0 ? 0 : delta / max
  const v = max
  return { h, s, v }
}

/**
 * 将颜色字符串转换为 RGBA 颜色
 * @description
 * 支持 `#rgb`、`#rgba`、`#rrggbb`、`#rrggbbaa`（`#` 可省略）以及 `rgb()` / `rgba()`
 * 函数表示；无法解析时返回 `null`，调用方应视为未绑定颜色而不是沿用错误的解析结果。
 * @param color 颜色字符串
 * @returns RGBA 颜色，解析失败返回 null
 */
export function HEX2RGBA(color: string): { RGB: PaletteRGB; alpha: number } | null {
  const input = color.trim()

  const fnMatch = input.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d+(?:\.\d+)?%?)\s*)?\)$/i
  )
  if (fnMatch) {
    const [, r, g, b, a] = fnMatch
    const rgb = { r: +r!, g: +g!, b: +b! }
    if (rgb.r > 255 || rgb.g > 255 || rgb.b > 255) return null

    let alpha = 1
    if (a !== undefined) {
      alpha = a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a)
      if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) return null
    }
    return { RGB: rgb, alpha }
  }

  let hex = input.startsWith('#') ? input.slice(1) : input

  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  if (hex.length !== 6 && hex.length !== 8) return null
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null

  let alpha = 1
  const alphaStr = hex.slice(6)
  if (alphaStr) {
    alpha = parseInt(alphaStr, 16) / 255
  }

  const rgb = {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  }

  return { RGB: rgb, alpha }
}
