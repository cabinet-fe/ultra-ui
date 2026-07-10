import { StreamLanguage, type StringStream } from '@codemirror/language'

/** 词法状态：跟踪 T(...) 类型引用与属性访问 */
interface SpelState {
  /** T(...) 内括号深度，>0 表示处于类型名上下文 */
  typeDepth: number
  /** 刚消费完 `.`，下一标识符按属性名着色 */
  afterDot: boolean
  /** 刚消费完类型引用关键字 `T`，下一 `(` 进入类型上下文 */
  afterT: boolean
}

const KEYWORDS = new Set([
  'new',
  'instanceof',
  'matches',
  'between',
  'and',
  'or',
  'not',
  'eq',
  'ne',
  'lt',
  'le',
  'gt',
  'ge'
])

const BOOL_LITERALS = new Set(['true', 'false'])

/** 多字符运算符，按长度优先匹配 */
const OPERATORS = ['?.', '?:', '?[', '![', '==', '!=', '<=', '>=', '&&', '||', '++', '--']

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_]/.test(ch)
}

function isIdentChar(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch)
}

function tokenString(stream: StringStream, quote: string): string {
  let escaped = false
  while (!stream.eol()) {
    const next = stream.next()
    if (next === quote && !escaped) break
    escaped = !escaped && next === '\\'
  }
  return 'string'
}

function tokenNumber(stream: StringStream): string {
  stream.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/)
  return 'number'
}

function tokenIdentifier(stream: StringStream, state: SpelState): string {
  stream.eatWhile(isIdentChar)
  const word = stream.current()
  state.afterT = false

  if (state.typeDepth > 0) {
    state.afterDot = false
    return 'typeName'
  }

  if (state.afterDot) {
    state.afterDot = false
    return 'propertyName'
  }

  if (BOOL_LITERALS.has(word)) return 'bool'
  if (word === 'null') return 'null'
  if (KEYWORDS.has(word)) return 'keyword'

  // T(...) 类型引用
  if (word === 'T' && stream.peek() === '(') {
    state.afterT = true
    return 'typeName'
  }

  return 'name'
}

function tokenSpel(stream: StringStream, state: SpelState): string | null {
  if (stream.eatSpace()) return null

  const ch = stream.peek()
  if (!ch) return null

  // 字符串
  if (ch === "'" || ch === '"') {
    stream.next()
    state.afterDot = false
    state.afterT = false
    return tokenString(stream, ch)
  }

  // 数字
  if (/\d/.test(ch)) {
    state.afterDot = false
    state.afterT = false
    return tokenNumber(stream)
  }

  // #变量 / #this / #root
  if (ch === '#') {
    stream.next()
    state.afterDot = false
    state.afterT = false
    const peek = stream.peek()
    if (peek && isIdentStart(peek)) {
      stream.eatWhile(isIdentChar)
      return 'variableName'
    }
    return 'operator'
  }

  // 多字符运算符
  for (const op of OPERATORS) {
    if (stream.match(op)) {
      state.afterDot = false
      state.afterT = false
      return 'operator'
    }
  }

  // 单字符运算符
  if ('+-*/%^!=<>&|?:'.includes(ch)) {
    stream.next()
    state.afterDot = false
    state.afterT = false
    return 'operator'
  }

  if (ch === '(') {
    stream.next()
    state.afterDot = false
    if (state.afterT || state.typeDepth > 0) {
      state.typeDepth++
      state.afterT = false
    }
    return 'paren'
  }

  if (ch === ')') {
    stream.next()
    state.afterDot = false
    state.afterT = false
    if (state.typeDepth > 0) state.typeDepth--
    return 'paren'
  }

  if (ch === '[' || ch === ']') {
    stream.next()
    state.afterDot = false
    state.afterT = false
    return 'paren'
  }

  if (ch === '{' || ch === '}') {
    stream.next()
    state.afterDot = false
    state.afterT = false
    return 'brace'
  }

  if (ch === ',') {
    stream.next()
    state.afterDot = false
    state.afterT = false
    return 'punctuation'
  }

  if (ch === '.') {
    stream.next()
    state.afterDot = true
    state.afterT = false
    return 'punctuation'
  }

  if (isIdentStart(ch)) {
    return tokenIdentifier(stream, state)
  }

  stream.next()
  state.afterDot = false
  state.afterT = false
  return 'punctuation'
}

/** SpEL StreamLanguage */
export const spelLanguage = StreamLanguage.define<SpelState>({
  name: 'spel',
  startState: () => ({ typeDepth: 0, afterDot: false, afterT: false }),
  token: tokenSpel,
  languageData: { closeBrackets: { brackets: ['(', '[', '{', "'", '"'] } }
})
