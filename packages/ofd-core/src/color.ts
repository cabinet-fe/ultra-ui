/**
 * OFD 颜色解析（GB/T 33190 颜色描述）转 CSS 颜色。
 *
 * 支持的声明形式：
 * - `#RRGGBB`：CSS 十六进制，原样返回
 * - 灰度：`g 128` / `gray 128` / 单个数值 `128`
 * - RGB：`rgb 255 0 0` / `255 0 0` / 逗号分隔 `255,0,0`
 * - CMYK：`cmyk 0 255 255 0` / `0 255 255 0`，转 RGB 输出
 * - 末尾可带一个透明度通道（0-255），有则输出 `rgba()`
 */

import { parseNumberList } from './ctm'

/** 解析 OFD 颜色声明为 CSS 颜色；无法识别返回 null，由调用方决定默认值 */
export function parseOfdColor(value: string | null): string | null {
  const text = value?.trim()
  if (!text) return null
  if (text.startsWith('#')) return text

  const tokens = text
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((token) => token !== '')
  if (tokens.length === 0) return null

  const named = CHANNEL_COUNT_BY_NAME[tokens[0]!]
  if (named !== undefined) return toCssColor(tokens.slice(1), named)
  // 无通道描述前缀时按数值个数判断：1-2 灰度 / 3 RGB / 4-5 CMYK（末位可为透明度）
  const channelCount = UNNAMED_CHANNEL_COUNT[tokens.length]
  return channelCount === undefined ? null : toCssColor(tokens, channelCount)
}

const CHANNEL_COUNT_BY_NAME: Record<string, number> = { g: 1, gray: 1, rgb: 3, cmyk: 4 }

/** 无前缀时按数值个数推断通道数；末位可能是透明度通道 */
const UNNAMED_CHANNEL_COUNT: Record<number, number> = { 1: 1, 2: 1, 3: 3, 4: 4, 5: 4 }

/** 按通道数把 0-255 通道值列表转成 CSS 颜色；末位之后的透明度通道可选 */
function toCssColor(tokens: string[], channels: number): string | null {
  const values = parseNumberList(tokens.join(' '))
  if (values.length < channels || values.length > channels + 1) return null

  const clamped = values.map((value) => Math.round(Math.min(255, Math.max(0, value))))
  const alpha = values.length === channels + 1 ? clamped[channels]! / 255 : null
  const [r, g, b] =
    channels === 1 ? [clamped[0]!, clamped[0]!, clamped[0]!] : toRgb(clamped, channels)
  return alpha === null ? `rgb(${r} ${g} ${b})` : `rgba(${r} ${g} ${b} / ${+alpha.toFixed(3)})`
}

/** CMYK 转 RGB：r = 255·(1−c)·(1−k)；channels 为 3 时直取 RGB */
function toRgb(clamped: number[], channels: number): [number, number, number] {
  if (channels === 3) return [clamped[0]!, clamped[1]!, clamped[2]!]
  const [c, m, y, k] = clamped as [number, number, number, number]
  return [
    Math.round(255 * (1 - c / 255) * (1 - k / 255)),
    Math.round(255 * (1 - m / 255) * (1 - k / 255)),
    Math.round(255 * (1 - y / 255) * (1 - k / 255))
  ]
}
