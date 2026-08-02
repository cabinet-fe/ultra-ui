/**
 * 公式分词器：数字 / 字符串 / 布尔 / 标识符（函数名、引用、表名）/ 带引号表名 / 运算符。
 *
 * 不做语义消歧：`A1`（引用）、`SUM`（函数名）、`Sheet2`（表名）统一产出 ident，
 * 由 parser 依据后随 token（`(` / `!` / `:` / 运算位）判定。
 */

/** 解析失败异常（Sheet 层捕获 → 单元格记为 #ERROR!） */
export class FormulaParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FormulaParseError'
  }
}

export type FormulaOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '^'
  | '&'
  | '%'
  | '('
  | ')'
  | ','
  | '!'
  | ':'
  | '='
  | '<>'
  | '<'
  | '<='
  | '>'
  | '>='

export type FormulaToken =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  /** 标识符：函数名 / 单元格引用形态 / 裸表名（含 $ 绝对引用写法）；TRUE/FALSE 由 parser 归约为布尔 */
  | { type: 'ident'; name: string }
  /** 带单引号的表名（'' 转义为字面单引号） */
  | { type: 'quoted-name'; name: string }
  | { type: 'op'; op: FormulaOperator }

const NUMBER_RE = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/

/** 标识符首字符：字母 / _ / $ / 非 ASCII（中文表名等） */
function isIdentStart(ch: string): boolean {
  return /[A-Za-z_$]/.test(ch) || ch.charCodeAt(0) >= 0x80
}

/** 标识符后续字符：首字符集 + 数字 + . */
function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_.$]/.test(ch) || ch.charCodeAt(0) >= 0x80
}

const TWO_CHAR_OPS = ['<>', '<=', '>='] as const
const ONE_CHAR_OPS = [
  '+',
  '-',
  '*',
  '/',
  '^',
  '&',
  '%',
  '(',
  ')',
  ',',
  '!',
  ':',
  '=',
  '<',
  '>'
] as const

/** 公式文本（不含 '='）→ token 序列；非法输入抛 FormulaParseError */
export function tokenizeFormula(text: string): FormulaToken[] {
  const tokens: FormulaToken[] = []
  let i = 0
  while (i < text.length) {
    const ch = text[i]!
    // 空白忽略（不支持 Excel 的空格交集运算符）
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++
      continue
    }
    // 数字
    if ((ch >= '0' && ch <= '9') || (ch === '.' && text[i + 1]! >= '0' && text[i + 1]! <= '9')) {
      const match = NUMBER_RE.exec(text.slice(i))
      if (!match) throw new FormulaParseError(`非法数字（位置 ${i + 1}）`)
      tokens.push({ type: 'number', value: Number.parseFloat(match[0]) })
      i += match[0].length
      continue
    }
    // 字符串字面量（"..."，"" 转义）
    if (ch === '"') {
      let value = ''
      let j = i + 1
      for (;;) {
        if (j >= text.length) throw new FormulaParseError('字符串缺少结束引号')
        if (text[j] === '"') {
          if (text[j + 1] === '"') {
            value += '"'
            j += 2
            continue
          }
          break
        }
        value += text[j]
        j++
      }
      tokens.push({ type: 'string', value })
      i = j + 1
      continue
    }
    // 带引号表名（'...'，'' 转义）
    if (ch === "'") {
      let name = ''
      let j = i + 1
      for (;;) {
        if (j >= text.length) throw new FormulaParseError('表名缺少结束引号')
        if (text[j] === "'") {
          if (text[j + 1] === "'") {
            name += "'"
            j += 2
            continue
          }
          break
        }
        name += text[j]
        j++
      }
      tokens.push({ type: 'quoted-name', name })
      i = j + 1
      continue
    }
    // 标识符（函数名 / 引用 / 裸表名）
    if (isIdentStart(ch)) {
      let j = i + 1
      while (j < text.length && isIdentPart(text[j]!)) j++
      tokens.push({ type: 'ident', name: text.slice(i, j) })
      i = j
      continue
    }
    // 双字符运算符优先
    const two = text.slice(i, i + 2)
    if ((TWO_CHAR_OPS as readonly string[]).includes(two)) {
      tokens.push({ type: 'op', op: two as FormulaOperator })
      i += 2
      continue
    }
    if ((ONE_CHAR_OPS as readonly string[]).includes(ch)) {
      tokens.push({ type: 'op', op: ch as FormulaOperator })
      i++
      continue
    }
    throw new FormulaParseError(`无法识别的字符 "${ch}"（位置 ${i + 1}）`)
  }
  return tokens
}
