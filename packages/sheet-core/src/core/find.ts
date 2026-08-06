import type { CellAddress } from './address'
import { cellKey } from './address'
import type { Sheet } from './sheet'

/**
 * 查找纯逻辑（框架无关、无头可测）。
 *
 * - 遍历范围 = 存储中真实存在的格（行主序）：空单元格没有文本可匹配；
 *   合并格只存锚点，getDisplayValue 解析锚点语义天然不重复。
 * - findNext / findPrev：从 from 之后 / 之前开始（严格大于 / 小于，按行主序 key），
 *   到边界后循环（findNext 末尾回绕到开头，findPrev 开头回绕到末尾）。
 * - options：
 *   - caseSensitive：大小写敏感（默认 false）
 *   - wholeCell：整格匹配（默认 false = 包含匹配）
 *   - searchIn：'value' = 匹配显示值（getDisplayValue），'formula' = 匹配公式原文（f，不含 '='）
 */

/** 查找选项 */
export interface FindOptions {
  /** 大小写敏感，默认 false */
  caseSensitive?: boolean
  /** 整格匹配（文本完全相等），默认 false = 包含匹配 */
  wholeCell?: boolean
  /** 查找对象：'value' = 显示值（默认），'formula' = 公式原文 f */
  searchIn?: 'value' | 'formula'
}

/** 查找命中 */
export interface FindMatch {
  addr: CellAddress
  /** 命中的单元格文本（value = 显示值字符串化；formula = 公式原文，不含 '='） */
  text: string
}

/** 单元格参与匹配的文本；无匹配文本（空格 / 无公式）返回 undefined */
function cellText(
  sheet: Sheet,
  addr: CellAddress,
  searchIn: 'value' | 'formula'
): string | undefined {
  if (searchIn === 'formula') {
    const anchor = sheet.merges.resolveAnchor(addr)
    return sheet.getCellData(anchor)?.f
  }
  const value = sheet.getDisplayValue(addr)
  return value == null ? undefined : String(value)
}

/** 文本匹配判定（大小写 / 整格）；target 已由调用方预计算（避免每格重复 toLowerCase，#9） */
function textMatches(text: string, target: string, options: FindOptions): boolean {
  const subject = options.caseSensitive ? text : text.toLowerCase()
  return options.wholeCell ? subject === target : subject.includes(target)
}

/** 查找全部命中（行主序；空关键词返回空数组） */
export function findAll(sheet: Sheet, query: string, options: FindOptions = {}): FindMatch[] {
  if (query === '') return []
  const searchIn = options.searchIn ?? 'value'
  // target 只计算一次：原实现每格重复 query.toLowerCase()，百万格 = 百万次重复分配（#9）
  const target = options.caseSensitive ? query : query.toLowerCase()
  const result: FindMatch[] = []
  for (const [addr] of sheet.store.entries()) {
    const text = cellText(sheet, addr, searchIn)
    if (text !== undefined && textMatches(text, target, options)) {
      result.push({ addr: { ...addr }, text })
    }
  }
  // store.entries 按 Map 插入序迭代（首次写入顺序），显式按行主序排序保证
  // findNext/findPrev 的「行主序、到边界循环」语义与文档一致
  result.sort((a, b) => cellKey(a.addr) - cellKey(b.addr))
  return result
}

/**
 * 在已按行主序排序的命中数组上定位下一个命中（二分查找，O(log n)）。
 * 供缓存命中导航使用——原 findNext 每次重跑 findAll 全表扫描（#9）。
 */
export function findNextFrom(matches: FindMatch[], from: CellAddress): FindMatch | null {
  if (matches.length === 0) return null
  const fromKey = cellKey(from)
  let lo = 0
  let hi = matches.length - 1
  let first = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (cellKey(matches[mid]!.addr) > fromKey) {
      first = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }
  // 到边界循环：末尾之后回绕到第一个
  return first >= 0 ? matches[first]! : matches[0]!
}

/**
 * 在已按行主序排序的命中数组上定位上一个命中（二分查找，O(log n)）。
 */
export function findPrevFrom(matches: FindMatch[], from: CellAddress): FindMatch | null {
  if (matches.length === 0) return null
  const fromKey = cellKey(from)
  let lo = 0
  let hi = matches.length - 1
  let last = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (cellKey(matches[mid]!.addr) < fromKey) {
      last = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  // 到边界循环：开头之前回绕到最后一个
  return last >= 0 ? matches[last]! : matches[matches.length - 1]!
}

/**
 * 下一个命中：行主序上严格位于 from 之后；到末尾后循环回第一个。
 * 无任何命中返回 null（此时 from 不参与匹配判定）。
 */
export function findNext(
  sheet: Sheet,
  query: string,
  from: CellAddress,
  options: FindOptions = {}
): FindMatch | null {
  return findNextFrom(findAll(sheet, query, options), from)
}

/**
 * 上一个命中：行主序上严格位于 from 之前；到开头后循环回最后一个。
 * 无任何命中返回 null。
 */
export function findPrev(
  sheet: Sheet,
  query: string,
  from: CellAddress,
  options: FindOptions = {}
): FindMatch | null {
  return findPrevFrom(findAll(sheet, query, options), from)
}
