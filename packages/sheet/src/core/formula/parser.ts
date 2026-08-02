import { createRange, parseAddress, type CellAddress } from '../address'
import type { AstNode, BinaryOperator } from './ast'
import { FormulaParseError, tokenizeFormula, type FormulaToken } from './tokenizer'

/**
 * Pratt parser：token 序列 → AST。
 *
 * 优先级（同 Excel，低到高）：比较运算 < `&` < `+ -` < `* /` < 一元 `+ -` < `^`（右结合）< `%`。
 * 一元运算紧于幂次是 Excel 的特有行为：-2^2 = (-2)^2 = 4。
 * 引用消歧：ident 后随 `(` → 函数调用；后随 `!` → 表名前缀；匹配单元格形态 → 引用；
 * TRUE/FALSE → 布尔字面量；其余 → 未知名称节点（求值 #NAME?）。
 */

/** 中缀运算符绑定力 [左, 右]；右结合运算符右绑定力 = 左 - 1 */
const INFIX_BP: Record<string, readonly [number, number]> = {
  '=': [1, 1],
  '<>': [1, 1],
  '<': [1, 1],
  '<=': [1, 1],
  '>': [1, 1],
  '>=': [1, 1],
  '&': [2, 2],
  '+': [3, 3],
  '-': [3, 3],
  '*': [4, 4],
  '/': [4, 4],
  '^': [6, 5]
}
/** 百分号后缀绑定力（最高） */
const PERCENT_BP = 7
/** 一元 +/- 操作数的绑定力：紧于 ^（6），松于 %（7） */
const UNARY_OPERAND_BP = 6

/** 单元格引用形态（列限 3 字母；超出按未知名称处理，如 Sheet2） */
const CELL_REF_RE = /^\$?[A-Za-z]{1,3}\$?[1-9]\d*$/

class Parser {
  private pos = 0

  constructor(private readonly tokens: FormulaToken[]) {}

  parse(): AstNode {
    const node = this.parseExpression(0)
    if (this.pos < this.tokens.length) {
      throw new FormulaParseError(`意外的多余输入: ${describeToken(this.tokens[this.pos]!)}`)
    }
    return node
  }

  private peek(): FormulaToken | undefined {
    return this.tokens[this.pos]
  }

  private next(): FormulaToken | undefined {
    return this.tokens[this.pos++]
  }

  private peekOp(op: string): boolean {
    const token = this.peek()
    return token?.type === 'op' && token.op === op
  }

  private expectOp(op: string): void {
    if (!this.peekOp(op)) {
      throw new FormulaParseError(`期望 "${op}"，得到 ${describeToken(this.peek())}`)
    }
    this.pos++
  }

  private parseExpression(minBp: number): AstNode {
    let left = this.parsePrimary()
    for (;;) {
      const token = this.peek()
      if (token?.type !== 'op') break
      // 百分号后缀
      if (token.op === '%') {
        if (PERCENT_BP <= minBp) break
        this.pos++
        left = { kind: 'percent', operand: left }
        continue
      }
      const bp = INFIX_BP[token.op]
      if (!bp || bp[0] <= minBp) break
      this.pos++
      const right = this.parseExpression(bp[1])
      left = { kind: 'binary', op: token.op as BinaryOperator, left, right }
    }
    return left
  }

  private parsePrimary(): AstNode {
    const token = this.next()
    if (!token) throw new FormulaParseError('表达式不完整')

    if (token.type === 'number') return { kind: 'number', value: token.value }
    if (token.type === 'string') return { kind: 'string', value: token.value }

    if (token.type === 'quoted-name') {
      // 带引号表名只能作为跨表引用前缀
      this.expectOp('!')
      return this.parseCellRefOrRange(token.name)
    }

    if (token.type === 'ident') {
      const name = token.name
      if (this.peekOp('(')) return this.parseCall(name)
      if (this.peekOp('!')) {
        this.pos++
        return this.parseCellRefOrRange(name)
      }
      const addr = parseCellRef(name)
      if (addr) return this.parseRangeTail({ sheet: undefined, addr })
      if (name.toUpperCase() === 'TRUE') return { kind: 'boolean', value: true }
      if (name.toUpperCase() === 'FALSE') return { kind: 'boolean', value: false }
      return { kind: 'name', name }
    }

    // 运算符位置：括号 / 一元 +-
    if (token.type === 'op') {
      if (token.op === '(') {
        const inner = this.parseExpression(0)
        this.expectOp(')')
        return inner
      }
      if (token.op === '-' || token.op === '+') {
        return { kind: 'unary', op: token.op, operand: this.parseExpression(UNARY_OPERAND_BP) }
      }
    }
    throw new FormulaParseError(`意外的 ${describeToken(token)}`)
  }

  /** 函数调用：ident 已消费，当前 token 为 '(' */
  private parseCall(name: string): AstNode {
    this.pos++ // 消费 '('
    const args: AstNode[] = []
    if (!this.peekOp(')')) {
      for (;;) {
        args.push(this.parseExpression(0))
        if (this.peekOp(',')) {
          this.pos++
          continue
        }
        break
      }
    }
    this.expectOp(')')
    return { kind: 'call', name, args }
  }

  /** 表名前缀（Sheet2! / 'My Sheet'!）之后的单元格或区域引用 */
  private parseCellRefOrRange(sheet: string): AstNode {
    const token = this.next()
    const addr = token?.type === 'ident' ? parseCellRef(token.name) : null
    if (!addr) {
      throw new FormulaParseError(`表名 "${sheet}" 后应为单元格引用，得到 ${describeToken(token)}`)
    }
    return this.parseRangeTail({ sheet, addr })
  }

  /** 单元格引用之后的可选区域后缀（:B9） */
  private parseRangeTail(ref: { sheet: string | undefined; addr: CellAddress }): AstNode {
    if (!this.peekOp(':')) return { kind: 'cell', sheet: ref.sheet, addr: ref.addr }
    this.pos++
    const token = this.next()
    const end = token?.type === 'ident' ? parseCellRef(token.name) : null
    if (!end) {
      throw new FormulaParseError(`区域 ":" 后应为单元格引用，得到 ${describeToken(token)}`)
    }
    return { kind: 'range', sheet: ref.sheet, range: createRange(ref.addr, end) }
  }
}

/** 按单元格引用形态解析（列限 3 字母）；不匹配返回 null */
function parseCellRef(name: string): CellAddress | null {
  if (!CELL_REF_RE.test(name)) return null
  return parseAddress(name)
}

function describeToken(token: FormulaToken | undefined): string {
  if (!token) return '输入末尾'
  switch (token.type) {
    case 'number':
      return `数字 ${token.value}`
    case 'string':
      return `字符串 "${token.value}"`
    case 'ident':
      return `名称 "${token.name}"`
    case 'quoted-name':
      return `表名 '${token.name}'`
    case 'op':
      return `"${token.op}"`
  }
}

/** 解析公式文本（不含 '='）→ AST；非法输入抛 FormulaParseError */
export function parseFormula(text: string): AstNode {
  return new Parser(tokenizeFormula(text)).parse()
}
