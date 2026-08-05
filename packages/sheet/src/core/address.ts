/**
 * A1 地址系统（纯函数）。
 *
 * 坐标统一 0-based：`{ row: 0, col: 0 }` 即 A1。
 * 区域为闭区间，且经过规范化：start 恒为左上角，end 恒为右下角。
 */

/** 单元格地址（0-based） */
export interface CellAddress {
  row: number
  col: number
}

/** 单元格区域（闭区间，start 左上角，end 右下角） */
export interface CellRange {
  start: CellAddress
  end: CellAddress
}

/**
 * cellKey 的列基数（2^20）。
 * key = row * COL_KEY_BASE + col，要求 col < COL_KEY_BASE；
 * JS 安全整数范围内可容纳约 8.5e9 行，远超实际使用。
 */
const COL_KEY_BASE = 2 ** 20

/** 地址 → 数值 key（Map 索引用） */
export function cellKey(addr: CellAddress): number {
  return addr.row * COL_KEY_BASE + addr.col
}

/** 列号（0-based）→ 列名：0 → 'A'，25 → 'Z'，26 → 'AA' */
export function colIndexToName(col: number): string {
  if (!Number.isInteger(col) || col < 0) {
    throw new RangeError(`列号必须是非负整数: ${col}`)
  }
  let name = ''
  let n = col
  do {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return name
}

/** 列名 → 列号（0-based）：'A' → 0，'AA' → 26；非法列名返回 -1 */
export function colNameToIndex(name: string): number {
  if (!/^[A-Za-z]+$/.test(name)) return -1
  let index = 0
  for (const ch of name.toUpperCase()) {
    index = index * 26 + (ch.charCodeAt(0) - 64)
  }
  return index - 1
}

const ADDRESS_RE = /^\$?([A-Za-z]+)\$?([1-9]\d*)$/

/** 解析 A1 记法（兼容 `$A$1` 绝对引用写法）→ 地址；非法返回 null */
export function parseAddress(text: string): CellAddress | null {
  const match = ADDRESS_RE.exec(text.trim())
  if (!match) return null
  const col = colNameToIndex(match[1]!)
  const row = Number.parseInt(match[2]!, 10) - 1
  return { row, col }
}

/** 地址 → A1 记法：{ row: 1, col: 1 } → 'B2' */
export function formatAddress(addr: CellAddress): string {
  return `${colIndexToName(addr.col)}${addr.row + 1}`
}

/** 由两个角点构造规范化区域（start ≤ end） */
export function createRange(a: CellAddress, b: CellAddress): CellRange {
  return {
    start: { row: Math.min(a.row, b.row), col: Math.min(a.col, b.col) },
    end: { row: Math.max(a.row, b.row), col: Math.max(a.col, b.col) }
  }
}

/** 解析区域记法：'B2' 或 'B2:D5'（兼容绝对引用）；非法返回 null */
export function parseRange(text: string): CellRange | null {
  const parts = text.trim().split(':')
  if (parts.length > 2) return null
  const start = parseAddress(parts[0]!)
  if (!start) return null
  if (parts.length === 1) return { start, end: { ...start } }
  const end = parseAddress(parts[1]!)
  if (!end) return null
  return createRange(start, end)
}

/** 区域 → 记法：单格 → 'B2'，多格 → 'B2:D5' */
export function formatRange(range: CellRange): string {
  const start = formatAddress(range.start)
  if (range.start.row === range.end.row && range.start.col === range.end.col) return start
  return `${start}:${formatAddress(range.end)}`
}

/** 地址相等 */
function addressesEqual(a: CellAddress, b: CellAddress): boolean {
  return a.row === b.row && a.col === b.col
}

/** 区域相等 */
export function rangesEqual(a: CellRange, b: CellRange): boolean {
  return addressesEqual(a.start, b.start) && addressesEqual(a.end, b.end)
}

/** 两区域是否相交 */
export function rangesIntersect(a: CellRange, b: CellRange): boolean {
  return (
    a.start.row <= b.end.row &&
    a.end.row >= b.start.row &&
    a.start.col <= b.end.col &&
    a.end.col >= b.start.col
  )
}

/** 区域是否包含地址 */
export function rangeContainsAddress(range: CellRange, addr: CellAddress): boolean {
  return (
    addr.row >= range.start.row &&
    addr.row <= range.end.row &&
    addr.col >= range.start.col &&
    addr.col <= range.end.col
  )
}

/** 区域是否完整包含另一区域 */
export function rangeContainsRange(outer: CellRange, inner: CellRange): boolean {
  return rangeContainsAddress(outer, inner.start) && rangeContainsAddress(outer, inner.end)
}

/** 一组区域的最小包围盒（至少传入一个区域） */
export function boundingBox(ranges: readonly [CellRange, ...CellRange[]]): CellRange {
  let minRow = Infinity
  let minCol = Infinity
  let maxRow = -Infinity
  let maxCol = -Infinity
  for (const range of ranges) {
    minRow = Math.min(minRow, range.start.row)
    minCol = Math.min(minCol, range.start.col)
    maxRow = Math.max(maxRow, range.end.row)
    maxCol = Math.max(maxCol, range.end.col)
  }
  return { start: { row: minRow, col: minCol }, end: { row: maxRow, col: maxCol } }
}

/** 按行主序遍历区域内的所有地址 */
export function* iterateRange(range: CellRange): Generator<CellAddress, void, undefined> {
  for (let row = range.start.row; row <= range.end.row; row++) {
    for (let col = range.start.col; col <= range.end.col; col++) {
      yield { row, col }
    }
  }
}
