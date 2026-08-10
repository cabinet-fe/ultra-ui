import {
  listFormulaFunctions,
  type FormulaFunctionMeta
} from '@veltra/sheet-core/core/formula/functions'

/** 补全候选上限 */
export const FORMULA_SUGGEST_LIMIT = 10

/**
 * 空前缀时优先展示的常用函数（其余按名称升序补齐至上限）。
 * 纯字典序会把 SUM / OR / ROUND 挤出前 10（ABS…NOT），导致输入 `=` 看不到 SUM。
 */
export const COMMON_FORMULA_NAMES = [
  'SUM',
  'AVERAGE',
  'COUNT',
  'MAX',
  'MIN',
  'IF',
  'ROUND',
  'ABS',
  'AND',
  'OR'
] as const

/** 函数名 token 前合法的「触发」字符（= / 运算符 / ( / ,） */
const SUGGEST_TRIGGER_CHARS = new Set(['=', '(', ',', '+', '-', '*', '/', '^', '&', '<', '>'])

export interface FormulaSuggestItem {
  name: string
  params: string[]
  description: string
  /** 签名展示：`SUM(number1, number2, ...)`；无 params 时仅名称 */
  signature: string
}

export interface FormulaSuggestContext {
  /** 当前前缀（可能为空：紧跟 `=` 后） */
  prefix: string
  /** 前缀在文本中的起始下标（含） */
  start: number
  /** 光标位置（= 前缀结束下标） */
  end: number
}

/** 格式化函数签名；无 params 时仅返回名称 */
export function formatFunctionSignature(name: string, params: string[]): string {
  if (params.length === 0) return name
  return `${name}(${params.join(', ')})`
}

/**
 * 判定补全上下文：光标前向匹配函数名 token（或紧跟 `=` 的空前缀），
 * 且 token 前一个非空字符 ∈ 触发字符集。
 * 镜像只读期由调用方跳过，本函数不做只读判断。
 */
export function getSuggestContext(text: string, cursor: number): FormulaSuggestContext | null {
  if (cursor < 0 || cursor > text.length) return null
  const before = text.slice(0, cursor)
  const tokenMatch = /[A-Za-z][A-Za-z0-9_.]*$/.exec(before)
  const prefix = tokenMatch?.[0] ?? ''
  const start = tokenMatch ? cursor - prefix.length : cursor

  // 空前缀仅在紧跟 `=` 后弹出（验证清单：输入 `=` → 候选出现）。
  // `<=` / `>=` 的尾随 `=` 是比较运算符一部分，不是函数名起点。
  if (!tokenMatch) {
    const trimmed = before.replace(/\s+$/, '')
    if (!trimmed.endsWith('=')) return null
    if (trimmed.endsWith('<=') || trimmed.endsWith('>=')) return null
    return { prefix: '', start, end: cursor }
  }

  const beforeToken = before.slice(0, start).replace(/\s+$/, '')
  if (beforeToken.length === 0) return null
  const last = beforeToken[beforeToken.length - 1]!
  if (!SUGGEST_TRIGGER_CHARS.has(last)) return null
  return { prefix, start, end: cursor }
}

/**
 * 前缀过滤函数表（大小写不敏感），上限 FORMULA_SUGGEST_LIMIT。
 * 空前缀：常用函数优先，其余名称升序补齐；有前缀：名称升序。
 */
export function filterFormulaSuggestions(prefix: string): FormulaSuggestItem[] {
  const upper = prefix.toUpperCase()
  const all = listFormulaFunctions()
  if (!upper) {
    const byName = new Map(all.map((fn) => [fn.name, fn]))
    const items: FormulaSuggestItem[] = []
    const used = new Set<string>()
    for (const name of COMMON_FORMULA_NAMES) {
      const fn = byName.get(name)
      if (!fn) continue
      items.push(toSuggestItem(fn))
      used.add(name)
      if (items.length >= FORMULA_SUGGEST_LIMIT) return items
    }
    for (const fn of all) {
      if (used.has(fn.name)) continue
      items.push(toSuggestItem(fn))
      if (items.length >= FORMULA_SUGGEST_LIMIT) break
    }
    return items
  }

  const items: FormulaSuggestItem[] = []
  for (const fn of all) {
    if (!fn.name.startsWith(upper)) continue
    items.push(toSuggestItem(fn))
    if (items.length >= FORMULA_SUGGEST_LIMIT) break
  }
  return items
}

function toSuggestItem(fn: { name: string } & FormulaFunctionMeta): FormulaSuggestItem {
  return {
    name: fn.name,
    params: fn.params,
    description: fn.description,
    signature: formatFunctionSignature(fn.name, fn.params)
  }
}

export interface ApplySuggestResult {
  text: string
  /** 替换后光标位置（落在 `NAME()` 的括号内） */
  cursor: number
}

/** 将 [start, end) 的 token 替换为 `NAME()`，光标入括号内（免手动补右括号） */
export function applySuggest(
  text: string,
  start: number,
  end: number,
  name: string
): ApplySuggestResult {
  const insert = `${name}()`
  const next = text.slice(0, start) + insert + text.slice(end)
  return { text: next, cursor: start + name.length + 1 }
}

/**
 * 键盘导航：↑↓ 循环；返回新的高亮下标。
 * activeIndex 越界时按 0 处理。
 */
export function moveSuggestIndex(activeIndex: number, length: number, delta: 1 | -1): number {
  if (length <= 0) return 0
  const cur = ((activeIndex % length) + length) % length
  return (cur + delta + length) % length
}
