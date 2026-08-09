import type { DatasetField } from '../types'
import type { MockDatabase } from './database'
import type { ParamValues, QueryParamDef, QueryParamType } from './types'

const KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'AS',
  'BETWEEN',
  'IN',
  'LIKE',
  'NOT'
])

type TokenType = 'keyword' | 'ident' | 'op' | 'literal' | 'param' | 'punct' | 'star'

interface Token {
  type: TokenType
  value: string
  pos: number
}

type CompareOp = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'BETWEEN'

interface SelectItem {
  expr: string
  alias?: string
  column?: string
  isStar?: boolean
}

interface Condition {
  column: string
  op: CompareOp
  /** BETWEEN 第二界；IN 列表；其余为单值 */
  values: ValueRef[]
}

interface ValueRef {
  kind: 'literal' | 'param'
  value: string | number
  paramId?: string
}

type WhereNode =
  | { type: 'cond'; cond: Condition }
  | { type: 'and'; left: WhereNode; right: WhereNode }
  | { type: 'or'; left: WhereNode; right: WhereNode }

interface ParsedQuery {
  table: string
  selectItems: SelectItem[]
  where?: WhereNode
}

export interface SqlParseError {
  error: string
}

function isKeyword(word: string): boolean {
  return KEYWORDS.has(word.toUpperCase())
}

function tokenize(sql: string): Token[] | SqlParseError {
  const tokens: Token[] = []
  let i = 0

  while (i < sql.length) {
    const ch = sql[i]!
    if (/\s/.test(ch)) {
      i++
      continue
    }

    if (ch === '$' && sql[i + 1] === '{') {
      const close = sql.indexOf('}', i + 2)
      if (close === -1) return { error: `未闭合的参数占位符，位置 ${i}` }
      const paramId = sql.slice(i + 2, close).trim()
      if (!paramId) return { error: `空的参数占位符，位置 ${i}` }
      tokens.push({ type: 'param', value: paramId, pos: i })
      i = close + 1
      continue
    }

    if (ch === "'" || ch === '"') {
      const quote = ch
      let j = i + 1
      while (j < sql.length && sql[j] !== quote) j++
      if (j >= sql.length) return { error: `未闭合的字符串字面量，位置 ${i}` }
      tokens.push({ type: 'literal', value: sql.slice(i + 1, j), pos: i })
      i = j + 1
      continue
    }

    if (ch === '*') {
      tokens.push({ type: 'star', value: '*', pos: i })
      i++
      continue
    }

    if (ch === '(' || ch === ')' || ch === ',') {
      tokens.push({ type: 'punct', value: ch, pos: i })
      i++
      continue
    }

    if (ch === '=' || ch === '>' || ch === '<' || ch === '!') {
      let op = ch
      if (sql[i + 1] === '=') {
        op += '='
        i += 2
      } else {
        i++
      }
      tokens.push({ type: 'op', value: op, pos: i - op.length })
      continue
    }

    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(sql[i + 1] ?? ''))) {
      let j = i + 1
      while (j < sql.length && /[0-9.]/.test(sql[j]!)) j++
      tokens.push({ type: 'literal', value: sql.slice(i, j), pos: i })
      i = j
      continue
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1
      while (j < sql.length && /[a-zA-Z0-9_]/.test(sql[j]!)) j++
      const word = sql.slice(i, j)
      const upper = word.toUpperCase()
      if (isKeyword(upper)) {
        tokens.push({ type: 'keyword', value: upper, pos: i })
      } else {
        tokens.push({ type: 'ident', value: word, pos: i })
      }
      i = j
      continue
    }

    return { error: `无法解析的字符「${ch}」，位置 ${i}` }
  }

  return tokens
}

class Parser {
  private pos = 0

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    const token = this.tokens[this.pos]
    if (!token) throw new Error('SQL 解析意外结束')
    this.pos++
    return token
  }

  private expectKeyword(word: string): void {
    const token = this.consume()
    if (token.type !== 'keyword' || token.value !== word) {
      throw new Error(`期望关键字 ${word}，位置 ${token.pos}`)
    }
  }

  private matchKeyword(word: string): boolean {
    const token = this.peek()
    if (token?.type === 'keyword' && token.value === word) {
      this.pos++
      return true
    }
    return false
  }

  parse(): ParsedQuery | SqlParseError {
    try {
      this.expectKeyword('SELECT')
      const selectItems = this.parseSelectList()
      this.expectKeyword('FROM')
      const tableToken = this.consume()
      if (tableToken.type !== 'ident') {
        return { error: `期望表名，位置 ${tableToken.pos}` }
      }
      let where: WhereNode | undefined
      if (this.matchKeyword('WHERE')) {
        where = this.parseWhere()
      }
      if (this.peek()) {
        return { error: `SQL 超出支持范围，位置 ${this.peek()!.pos}` }
      }
      return { table: tableToken.value, selectItems, where }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  }

  private parseSelectList(): SelectItem[] {
    const items: SelectItem[] = []
    do {
      items.push(this.parseSelectItem())
    } while (this.matchPunct(',') && items.length > 0)
    return items
  }

  private parseSelectItem(): SelectItem {
    const start = this.peek()
    if (!start) throw new Error('SELECT 列表为空')

    if (start.type === 'star') {
      this.consume()
      const item: SelectItem = { expr: '*', isStar: true }
      if (this.matchKeyword('AS')) {
        const alias = this.consumeIdent('别名')
        item.alias = alias
      }
      return item
    }

    const first = this.consume()
    const exprParts: string[] = [first.value]
    let column: string | undefined = first.type === 'ident' ? first.value : undefined

    while (this.peek()) {
      if (this.peek()?.type === 'keyword' && this.peek()?.value === 'AS') {
        break
      }
      if (this.isSelectItemEnd()) break
      const token = this.consume()
      exprParts.push(token.value)
      column = undefined
    }

    const expr = exprParts.join(' ').trim()
    const item: SelectItem = { expr, column }
    if (this.matchKeyword('AS')) {
      item.alias = this.consumeIdent('别名')
    }
    return item
  }

  private isSelectItemEnd(): boolean {
    const token = this.peek()
    if (!token) return true
    if (token.type === 'punct' && token.value === ',') return true
    if (token.type === 'keyword' && (token.value === 'FROM' || token.value === 'WHERE')) return true
    return false
  }

  private parseWhere(): WhereNode {
    return this.parseOr()
  }

  private parseOr(): WhereNode {
    let node = this.parseAnd()
    while (this.matchKeyword('OR')) {
      node = { type: 'or', left: node, right: this.parseAnd() }
    }
    return node
  }

  private parseAnd(): WhereNode {
    let node = this.parsePrimary()
    while (this.matchKeyword('AND')) {
      node = { type: 'and', left: node, right: this.parsePrimary() }
    }
    return node
  }

  private parsePrimary(): WhereNode {
    if (this.matchPunct('(')) {
      const node = this.parseWhere()
      if (!this.matchPunct(')')) {
        throw new Error('缺少右括号')
      }
      return node
    }
    return { type: 'cond', cond: this.parseCondition() }
  }

  private parseCondition(): Condition {
    const column = this.consumeIdent('列名')
    const opToken = this.consume()
    let op: CompareOp

    if (opToken.type === 'keyword' && opToken.value === 'NOT') {
      const next = this.consume()
      if (next.type === 'op' && next.value === '=') {
        op = '!='
      } else if (next.type === 'keyword' && next.value === 'IN') {
        op = 'IN'
      } else {
        throw new Error(`NOT 后期望 = 或 IN，位置 ${next.pos}`)
      }
    } else if (opToken.type === 'keyword' && opToken.value === 'LIKE') {
      op = 'LIKE'
    } else if (opToken.type === 'keyword' && opToken.value === 'IN') {
      op = 'IN'
    } else if (opToken.type === 'keyword' && opToken.value === 'BETWEEN') {
      op = 'BETWEEN'
    } else if (opToken.type === 'op') {
      if (opToken.value === '=') op = '='
      else if (opToken.value === '!=') op = '!='
      else if (opToken.value === '>') op = '>'
      else if (opToken.value === '>=') op = '>='
      else if (opToken.value === '<') op = '<'
      else if (opToken.value === '<=') op = '<='
      else throw new Error(`不支持的比较运算符 ${opToken.value}`)
    } else {
      throw new Error(`期望比较运算符，位置 ${opToken.pos}`)
    }

    if (op === 'BETWEEN') {
      const low = this.parseValueRef()
      this.expectKeyword('AND')
      const high = this.parseValueRef()
      return { column, op, values: [low, high] }
    }

    if (op === 'IN') {
      if (!this.matchPunct('(')) throw new Error('IN 后期望 (')
      const values: ValueRef[] = []
      if (!this.matchPunct(')')) {
        do {
          values.push(this.parseValueRef())
        } while (this.matchPunct(','))
        if (!this.matchPunct(')')) throw new Error('IN 列表缺少 )')
      }
      return { column, op, values }
    }

    return { column, op, values: [this.parseValueRef()] }
  }

  private parseValueRef(): ValueRef {
    const token = this.peek()
    if (!token) throw new Error('期望值')
    if (token.type === 'param') {
      this.consume()
      return { kind: 'param', value: token.value, paramId: token.value }
    }
    if (token.type === 'literal') {
      this.consume()
      const num = Number(token.value)
      return {
        kind: 'literal',
        value: Number.isFinite(num) && token.value.trim() !== '' ? num : token.value
      }
    }
    if (token.type === 'ident') {
      this.consume()
      return { kind: 'literal', value: token.value }
    }
    throw new Error(`无法解析的值，位置 ${token.pos}`)
  }

  private consumeIdent(label: string): string {
    const token = this.consume()
    if (token.type !== 'ident') {
      throw new Error(`期望${label}，位置 ${token.pos}`)
    }
    return token.value
  }

  private matchPunct(ch: string): boolean {
    const token = this.peek()
    if (token?.type === 'punct' && token.value === ch) {
      this.pos++
      return true
    }
    return false
  }
}

/** 从 SQL 提取 `${param}` 占位符 id */
export function extractParamIds(sql: string): string[] {
  const ids: string[] = []
  const re = /\$\{([^}]+)\}/g
  let match: RegExpExecArray | null
  while ((match = re.exec(sql)) !== null) {
    const id = match[1]!.trim()
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

function inferParamTypeFromSql(sql: string, paramId: string): QueryParamType {
  const betweenSingle = new RegExp(
    `\\bBETWEEN\\s+\\$\\{${escapeRegExp(paramId)}\\}(?!\\s+AND)`,
    'i'
  )
  if (betweenSingle.test(sql)) return 'date-range'

  const betweenPair = new RegExp(
    `\\bBETWEEN\\s+\\$\\{${escapeRegExp(paramId)}\\}\\s+AND\\s+\\$\\{([^}]+)\\}`,
    'i'
  )
  const pairMatch = betweenPair.exec(sql)
  if (pairMatch && pairMatch[1]!.trim() !== paramId) return 'date'

  const like = new RegExp(`\\bLIKE\\s+\\$\\{${escapeRegExp(paramId)}\\}`, 'i')
  if (like.test(sql)) return 'text'

  const numericCompare = new RegExp(
    `[<>=]+\\s+\\$\\{${escapeRegExp(paramId)}\\}|\\$\\{${escapeRegExp(paramId)}\\}\\s*[<>=]+`,
    'i'
  )
  if (numericCompare.test(sql)) return 'number'

  return 'text'
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isEmptyParamValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function resolveParamValue(ref: ValueRef, params: ParamValues): unknown {
  if (ref.kind === 'literal') return ref.value
  return params[ref.paramId ?? ref.value]
}

function asString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function resolveBetweenBounds(values: unknown): [string, string] | null {
  if (Array.isArray(values) && values.length >= 2) {
    return [asString(values[0]), asString(values[1])]
  }
  if (values && typeof values === 'object' && !Array.isArray(values)) {
    const obj = values as Record<string, unknown>
    const from = asString(obj.from ?? obj.start ?? obj[0])
    const to = asString(obj.to ?? obj.end ?? obj[1])
    if (from || to) return [from, to]
  }
  return null
}

function evaluateCondition(
  row: Record<string, unknown>,
  cond: Condition,
  params: ParamValues
): boolean | 'skip' {
  const cellValue = row[cond.column]

  if (cond.op === 'BETWEEN') {
    if (cond.values.length === 1) {
      const paramVal = resolveParamValue(cond.values[0]!, params)
      if (isEmptyParamValue(paramVal)) return 'skip'
      const bounds = resolveBetweenBounds(paramVal)
      if (!bounds) return false
      const [from, to] = bounds
      const val = asString(cellValue)
      if (from && val < from) return false
      if (to && val > to) return false
      return true
    }

    const lowRef = cond.values[0]!
    const highRef = cond.values[1]!
    const lowVal = resolveParamValue(lowRef, params)
    const highVal = resolveParamValue(highRef, params)
    const lowEmpty = isEmptyParamValue(lowVal)
    const highEmpty = isEmptyParamValue(highVal)
    if (lowEmpty && highEmpty) return 'skip'
    const val = asString(cellValue)
    if (!lowEmpty && val < asString(lowVal)) return false
    if (!highEmpty && val > asString(highVal)) return false
    return true
  }

  if (cond.op === 'IN') {
    const resolved = cond.values.map((ref) => resolveParamValue(ref, params))
    const allEmpty = resolved.every((v) => isEmptyParamValue(v))
    if (allEmpty) return 'skip'
    const set = new Set(
      resolved.flatMap((v) => (Array.isArray(v) ? v : [v])).map((v) => asString(v))
    )
    return set.has(asString(cellValue))
  }

  const value = resolveParamValue(cond.values[0]!, params)
  if (isEmptyParamValue(value)) return 'skip'

  const left = cellValue
  const right = value

  switch (cond.op) {
    case '=':
      return asString(left) === asString(right)
    case '!=':
      return asString(left) !== asString(right)
    case '>':
      return asNumber(left) > asNumber(right)
    case '>=':
      return asNumber(left) >= asNumber(right)
    case '<':
      return asNumber(left) < asNumber(right)
    case '<=': {
      const numLeft = asNumber(left)
      const numRight = asNumber(right)
      if (typeof left === 'number' || typeof right === 'number') {
        return numLeft <= numRight
      }
      return asString(left) <= asString(right)
    }
    case 'LIKE': {
      const pattern = asString(right).replace(/%/g, '.*')
      return new RegExp(`^${pattern}$`, 'i').test(asString(left))
    }
    default:
      return false
  }
}

function evaluateWhere(
  row: Record<string, unknown>,
  node: WhereNode,
  params: ParamValues
): boolean {
  if (node.type === 'cond') {
    const result = evaluateCondition(row, node.cond, params)
    if (result === 'skip') return true
    return result
  }
  if (node.type === 'and') {
    return evaluateWhere(row, node.left, params) && evaluateWhere(row, node.right, params)
  }
  return evaluateWhere(row, node.left, params) || evaluateWhere(row, node.right, params)
}

function columnToField(col: {
  name: string
  label: string
  type: 'string' | 'number' | 'date'
}): DatasetField {
  return { name: col.name, label: col.label, type: col.type }
}

function snakeToCamel(name: string): string {
  return name.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function resolveOutputName(item: SelectItem): string {
  if (item.alias) return item.alias
  if (item.column) return item.column
  return item.expr.replace(/\s+AS\s+.+$/i, '').trim()
}

export function parseSql(sql: string): ParsedQuery | SqlParseError {
  const tokens = tokenize(sql.trim())
  if ('error' in tokens) return tokens
  return new Parser(tokens).parse()
}

export function buildParamDefs(
  sql: string,
  overrides?: Record<string, Partial<Omit<QueryParamDef, 'id'>>>
): QueryParamDef[] {
  const ids = extractParamIds(sql)
  return ids.map((id) => {
    const inferred = inferParamTypeFromSql(sql, id)
    const override = overrides?.[id]
    return {
      id,
      label: override?.label ?? id,
      type: override?.type ?? inferred,
      defaultValue: override?.defaultValue ?? defaultValueForType(override?.type ?? inferred),
      options: override?.options
    }
  })
}

function defaultValueForType(type: QueryParamType): unknown {
  switch (type) {
    case 'number':
      return 0
    case 'date-range':
      return ['', '']
    case 'select':
      return ''
    default:
      return ''
  }
}

export function describeSql(
  sql: string,
  db: MockDatabase,
  overrides?: Record<string, Partial<Omit<QueryParamDef, 'id'>>>,
  fieldOverrides?: Record<string, Partial<Pick<DatasetField, 'label'>>>
): { fields: DatasetField[]; params: QueryParamDef[]; error?: string } {
  const parsed = parseSql(sql)
  if ('error' in parsed) return { fields: [], params: [], error: parsed.error }

  const tableSchema = db.tables.find((t) => t.name === parsed.table)
  if (!tableSchema) {
    return { fields: [], params: [], error: `未知表 ${parsed.table}` }
  }

  const fields: DatasetField[] = []
  for (const item of parsed.selectItems) {
    if (item.isStar) {
      for (const col of tableSchema.columns) {
        const field = columnToField(col)
        const override = fieldOverrides?.[field.name]
        fields.push(override?.label ? { ...field, label: override.label } : field)
      }
      continue
    }
    const outputName = resolveOutputName(item)
    const sourceCol = tableSchema.columns.find(
      (c) => c.name === item.column || c.name === outputName
    )
    const base = sourceCol
      ? { name: outputName, label: sourceCol.label, type: sourceCol.type }
      : { name: outputName, label: outputName, type: 'string' as const }
    const override = fieldOverrides?.[outputName]
    fields.push(override?.label ? { ...base, label: override.label } : base)
  }

  return { fields, params: buildParamDefs(sql, overrides) }
}

export function executeSql(
  sql: string,
  db: MockDatabase,
  params: ParamValues = {}
): Record<string, unknown>[] | SqlParseError {
  const parsed = parseSql(sql)
  if ('error' in parsed) return parsed

  const rows = db.getTable(parsed.table)
  if (!rows) return { error: `未知表 ${parsed.table}` }

  const tableSchema = db.tables.find((t) => t.name === parsed.table)
  if (!tableSchema) return { error: `未知表 ${parsed.table}` }

  let filtered = rows
  if (parsed.where) {
    filtered = rows.filter((row) => evaluateWhere(row, parsed.where!, params))
  }

  const result: Record<string, unknown>[] = []
  for (const row of filtered) {
    const out: Record<string, unknown> = {}
    for (const item of parsed.selectItems) {
      if (item.isStar) {
        for (const col of tableSchema.columns) {
          const key = item.alias ? snakeToCamel(col.name) : col.name
          out[key] = row[col.name]
        }
        continue
      }
      const outputName = resolveOutputName(item)
      const sourceKey = item.column ?? item.expr
      out[outputName] = row[sourceKey] ?? row[outputName]
    }
    result.push(out)
  }

  return result
}

export function createDefaultParamValues(params: QueryParamDef[]): ParamValues {
  const values: ParamValues = {}
  for (const param of params) {
    values[param.id] = param.defaultValue
  }
  return values
}
