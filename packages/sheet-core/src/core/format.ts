import type { NumFmt } from './style/types'

/**
 * 数字格式（numFmt）值 → 显示文本的纯函数。
 *
 * 仅作用于显示：单元格恒存原始值（Excel 式语义），读取（getCellData）与
 * CSV 导出不受格式影响。只对数字值生效，调用方对非数字值应回落原始显示。
 */

const MS_PER_DAY = 86400000

/** 1900 日期系统序列数 → Date 的 UTC 毫秒（含 Excel 1900 闰年兼容：序列 <60 时纪元为 1899-12-31） */
function dateSerialToMs(serial: number): number {
  const days = Math.floor(serial)
  const epoch = days > 0 && days < 60 ? Date.UTC(1899, 11, 31) : Date.UTC(1899, 11, 30)
  return epoch + days * MS_PER_DAY
}

/** 日期序列数 → `YYYY-MM-DD`（小数部分为时间，日期格式只取整数日） */
function formatDate(serial: number): string {
  const d = new Date(dateSerialToMs(serial))
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 千分位分组：整数部分三位分隔，小数部分原样保留 */
function formatThousands(value: number): string {
  const negative = value < 0
  const [int, frac] = String(Math.abs(value)).split('.')
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (negative ? '-' : '') + grouped + (frac ? `.${frac}` : '')
}

/** 四舍五入到指定位数（half-up，远离零；EPSILON 修正 1.005 类浮点误差） */
function roundHalfUp(value: number, digits: number): number {
  const factor = 10 ** digits
  const rounded = Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor
  return value < 0 ? -rounded : rounded
}

/** 固定小数位数（四舍五入仅作用于显示） */
function formatFixed(value: number, digits: number): string {
  const d = Math.max(0, Math.trunc(digits))
  return roundHalfUp(value, d).toFixed(d)
}

const CN_DIGITS = '零壹贰叁肆伍陆柒捌玖'
const CN_INT_UNITS = ['', '拾', '佰', '仟']
const CN_GROUP_UNITS = ['', '万', '亿', '兆']

/** 4 位以内整数组 → 大写（组内零收敛为单个「零」） */
function cnIntGroup(group: number): string {
  const str = String(group)
  let out = ''
  let pendingZero = false
  for (let i = 0; i < str.length; i++) {
    const d = str.charCodeAt(i) - 48
    if (d === 0) {
      pendingZero = true
      continue
    }
    if (pendingZero) {
      out += '零'
      pendingZero = false
    }
    out += CN_DIGITS[d]! + CN_INT_UNITS[str.length - 1 - i]
  }
  return out
}

/** 整数部分 → 大写（按万/亿/兆四位分组；跨组不足四位或有零组时补「零」） */
function cnInt(value: number): string {
  if (value === 0) return '零'
  const groups: number[] = []
  let rest = value
  while (rest > 0) {
    groups.push(rest % 10000)
    rest = Math.floor(rest / 10000)
  }
  let out = ''
  let pendingZero = false
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]!
    if (g === 0) {
      pendingZero = true
      continue
    }
    if (out && (pendingZero || g < 1000)) out += '零'
    out += cnIntGroup(g) + CN_GROUP_UNITS[i]
    pendingZero = false
  }
  return out
}

/** 中文大写金额（先四舍五入到分；负数加「负」前缀） */
function formatCnUpper(value: number): string {
  const negative = value < 0
  const total = roundHalfUp(Math.abs(value), 2)
  const intPart = Math.floor(total)
  const cents = Math.round((total - intPart) * 100)
  const jiao = Math.floor(cents / 10)
  const fen = cents % 10

  let out = negative ? '负' : ''
  if (cents === 0) return out + cnInt(intPart) + '元整'
  if (intPart > 0) out += cnInt(intPart) + '元'
  if (jiao > 0) out += CN_DIGITS[jiao]! + '角'
  else if (intPart > 0 && fen > 0) out += '零'
  if (fen > 0) out += CN_DIGITS[fen]! + '分'
  return out
}

/** 按 numFmt 把数字值格式化为显示文本（仅显示用，不改动存储值） */
export function formatByNumFmt(value: number, fmt: NumFmt): string {
  switch (fmt.type) {
    case 'date':
      return formatDate(value)
    case 'thousands':
      return formatThousands(value)
    case 'cnUpper':
      return formatCnUpper(value)
    case 'fixed':
      return formatFixed(value, fmt.digits)
  }
}
