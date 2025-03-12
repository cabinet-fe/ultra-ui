import type { PaletteRGB, PaletteHSV } from '@ui/types'

/**
 * 将色相值转换为 RGB 颜色
 * @param h 色相值
 * @returns RGB 颜色
 */
export function HUE2RGB(h: number): PaletteRGB {
  // 将色相值映射到0-5的范围
  const segment = h / 60
  const x = 1 - Math.abs((segment % 2) - 1) // 计算中间值
  let r = 0,
    g = 0,
    b = 0
  // 根据色相所在的区间计算RGB值
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
  // 将RGB值从0-1范围映射到0-255范围
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

/**
 * 将色调、饱和度和亮度转换为 RGB 颜色
 * @param hsv 色调、饱和度和亮度
 */
export function HSV2RGB(hsv: PaletteHSV): PaletteRGB {
  const { h, s, v } = hsv

  // 使用色相区间映射获取基础RGB值
  const { r, g, b } = HUE2RGB(h)

  // 应用饱和度和亮度
  const saturationFactor = 1 - s
  const valueFactor = v

  return {
    r: Math.round((r + (255 - r) * saturationFactor) * valueFactor),
    g: Math.round((g + (255 - g) * saturationFactor) * valueFactor),
    b: Math.round((b + (255 - b) * saturationFactor) * valueFactor)
  }
}

/**
 * 将 RGB 颜色转换为 HEX 颜色
 * @param RGB RGB 颜色
 * @param alpha 透明度
 * @returns HEX 颜色
 */
export function RGB2HEX(RGB: PaletteRGB, alpha = 1) {
  let hexStr = ['r', 'g', 'b']
    .map(key => RGB[key].toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  if (alpha < 1) {
    hexStr += Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')
  }

  return hexStr
}

/**
 * 将 RGB 颜色转换为 HSV 颜色
 * @param RGB RGB 颜色
 * @returns HSV 颜色
 */
export function RGB2HSV(RGB: PaletteRGB): PaletteHSV {
  // 归一化到0-1范围
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
    h = (h * 60 + 360) % 360 // 确保正值
  }
  const s = max === 0 ? 0 : delta / max
  const v = max
  return { h, s, v }
}

/**
 * 将 HEX 颜色转换为 RGB 颜色
 * @param hex HEX 颜色
 * @returns RGB 颜色
 */
export function HEX2RGBA(hex: string): {
  RGB: PaletteRGB
  alpha: number
} {
  const rgb = {
    r: 0,
    g: 0,
    b: 0
  }
  let alpha = 1

  if (hex.startsWith('#')) {
    hex = hex.slice(1)
  }

  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map(char => char + char)
      .join('')
  }

  const alphaStr = hex.slice(6)
  if (alphaStr) {
    alpha = parseInt(alphaStr, 16) / 255
  }
  rgb.r = parseInt(hex.slice(0, 2), 16)
  rgb.g = parseInt(hex.slice(2, 4), 16)
  rgb.b = parseInt(hex.slice(4, 6), 16)

  return {
    RGB: rgb,
    alpha
  }
}
