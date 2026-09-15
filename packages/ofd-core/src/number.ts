/** SVG 输出共用的小数处理（render 与 font 两处调用） */

export function roundTo(value: number, digits: number): number {
  return Math.round(value * 10 ** digits) / 10 ** digits
}

/** 数值转 SVG 属性文本：截掉浮点噪声（如 0.30000000000000004 → 0.3） */
export function formatNumber(value: number): string {
  return String(roundTo(value, 4))
}
