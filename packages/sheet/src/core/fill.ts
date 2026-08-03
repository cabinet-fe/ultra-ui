import type { CellAddress, CellRange } from './address'
import { colIndexToName, colNameToIndex, createRange, iterateRange } from './address'
import type { CellData, CellType } from './cell-store'
import type { SetCellValueItem } from './command/set-cell-value'

/** 填充柄拖拽方向（与 VTable drag_fill_handle_end 一致） */
export type FillDirection = 'top' | 'bottom' | 'left' | 'right'

export interface GenerateFillOptions {
  /** 拖拽前的源选区（模型坐标） */
  source: CellRange
  /** 需要写入的目标区（不含源区，模型坐标） */
  target: CellRange
  /** 填充方向 */
  direction: FillDirection
  /** 读取源区单元格（原始存储语义） */
  getCellData: (addr: CellAddress) => CellData | undefined
}

/**
 * 由源选区 + 拖拽后扩展选区 + 方向，计算需要填充的目标区（模型坐标）。
 * 算法对齐 VTable 官方 fill-handle 示例（扩展选区含源区，目标为扩展部分）。
 */
export function computeFillTargetRange(
  source: CellRange,
  direction: FillDirection,
  expanded: CellRange
): CellRange | null {
  const src = createRange(source.start, source.end)
  const exp = createRange(expanded.start, expanded.end)

  if (direction === 'bottom') {
    if (exp.end.row <= src.end.row) return null
    return {
      start: { row: src.end.row + 1, col: src.start.col },
      end: { row: exp.end.row, col: src.end.col }
    }
  }
  if (direction === 'top') {
    if (exp.start.row >= src.start.row) return null
    return {
      start: { row: exp.start.row, col: src.start.col },
      end: { row: src.start.row - 1, col: src.end.col }
    }
  }
  if (direction === 'right') {
    if (exp.end.col <= src.end.col) return null
    return {
      start: { row: src.start.row, col: src.end.col + 1 },
      end: { row: src.end.row, col: exp.end.col }
    }
  }
  // left
  if (exp.start.col >= src.start.col) return null
  return {
    start: { row: src.start.row, col: exp.start.col },
    end: { row: src.end.row, col: src.start.col - 1 }
  }
}

/**
 * 生成填充写入项（tile / 数字日期等差 / 公式相对引用位移）。
 * 调用方一次 `sheet.setCells(items)` 即可（单 undo 单元）。
 */
export function generateFill(options: GenerateFillOptions): SetCellValueItem[] {
  const { source, target, direction, getCellData } = options
  const src = createRange(source.start, source.end)
  const tgt = createRange(target.start, target.end)
  const srcRows = src.end.row - src.start.row + 1
  const srcCols = src.end.col - src.start.col + 1
  const vertical = direction === 'top' || direction === 'bottom'

  const seriesByLane = new Map<number, SeriesInfo | null>()
  if (vertical) {
    for (let col = src.start.col; col <= src.end.col; col++) {
      const values: number[] = []
      let cellType: CellType | undefined
      let ok = true
      for (let row = src.start.row; row <= src.end.row; row++) {
        const data = getCellData({ row, col })
        const num = readSeriesNumber(data)
        if (num == null) {
          ok = false
          break
        }
        values.push(num.value)
        cellType = num.t
      }
      seriesByLane.set(col, ok ? makeSeriesInfo(values, cellType) : null)
    }
  } else {
    for (let row = src.start.row; row <= src.end.row; row++) {
      const values: number[] = []
      let cellType: CellType | undefined
      let ok = true
      for (let col = src.start.col; col <= src.end.col; col++) {
        const data = getCellData({ row, col })
        const num = readSeriesNumber(data)
        if (num == null) {
          ok = false
          break
        }
        values.push(num.value)
        cellType = num.t
      }
      seriesByLane.set(row, ok ? makeSeriesInfo(values, cellType) : null)
    }
  }

  const items: SetCellValueItem[] = []
  for (const addr of iterateRange(tgt)) {
    const rowOffset = positiveMod(addr.row - src.start.row, srcRows)
    const colOffset = positiveMod(addr.col - src.start.col, srcCols)
    const srcAddr: CellAddress = { row: src.start.row + rowOffset, col: src.start.col + colOffset }
    const srcData = getCellData(srcAddr)

    if (srcData?.f != null && srcData.f !== '') {
      const deltaRow = addr.row - srcAddr.row
      const deltaCol = addr.col - srcAddr.col
      items.push({ addr, data: { f: shiftFormulaRefs(srcData.f, deltaRow, deltaCol) } })
      continue
    }

    const lane = vertical ? srcAddr.col : srcAddr.row
    const series = seriesByLane.get(lane)
    if (series) {
      const index = vertical ? addr.row - src.start.row : addr.col - src.start.col
      const value = series.first + index * series.delta
      items.push({ addr, data: { v: value, t: series.t ?? 'n' } })
      continue
    }

    // tile 复制（含空格 → 清除）
    items.push({ addr, data: cloneCellData(srcData) })
  }
  return items
}

interface SeriesInfo {
  first: number
  delta: number
  t?: CellType
}

function makeSeriesInfo(values: number[], t?: CellType): SeriesInfo {
  const first = values[0]!
  if (values.length === 1) {
    return { first, delta: 1, t }
  }
  const delta = (values[values.length - 1]! - first) / (values.length - 1)
  return { first, delta, t }
}

/** 可参与等差序列的数字/日期格；公式格与其它类型返回 null */
function readSeriesNumber(data: CellData | undefined): { value: number; t?: CellType } | null {
  if (!data) return null
  if (data.f != null && data.f !== '') return null
  if (typeof data.v !== 'number' || !Number.isFinite(data.v)) return null
  if (data.t != null && data.t !== 'n' && data.t !== 'd') return null
  return { value: data.v, t: data.t }
}

function cloneCellData(data: CellData | undefined): CellData | undefined {
  if (!data) return undefined
  const cloned: CellData = {}
  if (data.v !== undefined) cloned.v = data.v
  if (data.t !== undefined) cloned.t = data.t
  if (data.f !== undefined) cloned.f = data.f
  return cloned
}

function positiveMod(n: number, mod: number): number {
  return ((n % mod) + mod) % mod
}

/**
 * 公式引用字符串级位移：尊重 `$` 绝对行列；出界 → `#REF!`。
 * 跳过双引号字符串字面量，避免改写文本中的 A1 片段。
 */
export function shiftFormulaRefs(formula: string, deltaRow: number, deltaCol: number): string {
  if (deltaRow === 0 && deltaCol === 0) return formula

  let result = ''
  let i = 0
  while (i < formula.length) {
    const ch = formula[i]!
    if (ch === '"') {
      const end = skipExcelString(formula, i)
      result += formula.slice(i, end)
      i = end
      continue
    }

    const sheetMatch = matchSheetPrefix(formula, i)
    const addrStart = sheetMatch ? sheetMatch.end : i
    const addrMatch = matchCellOrRange(formula, addrStart)
    if (addrMatch && (sheetMatch || isRefBoundary(formula, i - 1))) {
      const sheetPrefix = sheetMatch ? formula.slice(sheetMatch.start, sheetMatch.end) : ''
      // 有 sheet 前缀时，前缀前也需是边界
      if (sheetMatch && !isRefBoundary(formula, sheetMatch.start - 1)) {
        result += ch
        i++
        continue
      }
      const shifted = shiftAddrPart(addrMatch.text, deltaRow, deltaCol)
      result += sheetPrefix + shifted
      i = addrMatch.end
      continue
    }

    result += ch
    i++
  }
  return result
}

function skipExcelString(text: string, start: number): number {
  // start 指向开引号；Excel 字符串内 "" 为转义
  let i = start + 1
  while (i < text.length) {
    if (text[i] === '"') {
      if (text[i + 1] === '"') {
        i += 2
        continue
      }
      return i + 1
    }
    i++
  }
  return text.length
}

function matchSheetPrefix(text: string, start: number): { start: number; end: number } | null {
  if (text[start] === "'") {
    let i = start + 1
    while (i < text.length) {
      if (text[i] === "'") {
        if (text[i + 1] === "'") {
          i += 2
          continue
        }
        if (text[i + 1] === '!') {
          return { start, end: i + 2 }
        }
        return null
      }
      i++
    }
    return null
  }

  // 简单表名：字母/下划线开头
  if (!/[A-Za-z_]/.test(text[start] ?? '')) return null
  let i = start + 1
  while (i < text.length && /[\w.]/.test(text[i]!)) i++
  if (text[i] === '!') return { start, end: i + 1 }
  return null
}

const CELL_REF_RE = /^(\$?)([A-Za-z]+)(\$?)([1-9]\d*)/

function matchCellOrRange(text: string, start: number): { text: string; end: number } | null {
  const first = matchOneCell(text, start)
  if (!first) return null
  if (text[first.end] === ':') {
    const second = matchOneCell(text, first.end + 1)
    if (!second) return { text: first.text, end: first.end }
    return { text: text.slice(start, second.end), end: second.end }
  }
  return first
}

function matchOneCell(text: string, start: number): { text: string; end: number } | null {
  const slice = text.slice(start)
  const m = CELL_REF_RE.exec(slice)
  if (!m) return null
  const end = start + m[0].length
  const next = text[end]
  // 行号后紧跟字母 → 不是 A1；紧跟 `(` → 函数名（如 LOG10(）
  if (next && (/[A-Za-z]/.test(next) || next === '(')) return null
  return { text: m[0], end }
}

function isRefBoundary(text: string, index: number): boolean {
  if (index < 0) return true
  const ch = text[index]!
  // 引用前不能是字母/数字（避免 FOOA1）；`!` 已由 sheet 前缀消费
  return !/[A-Za-z0-9_$]/.test(ch)
}

function shiftAddrPart(part: string, deltaRow: number, deltaCol: number): string {
  if (part.includes(':')) {
    const [a, b] = part.split(':')
    const left = shiftOneRef(a!, deltaRow, deltaCol)
    const right = shiftOneRef(b!, deltaRow, deltaCol)
    if (left === '#REF!' || right === '#REF!') return '#REF!'
    return `${left}:${right}`
  }
  return shiftOneRef(part, deltaRow, deltaCol)
}

function shiftOneRef(ref: string, deltaRow: number, deltaCol: number): string {
  const m = CELL_REF_RE.exec(ref)
  if (!m) return ref
  const colAbs = m[1] === '$'
  const rowAbs = m[3] === '$'
  let col = colNameToIndex(m[2]!)
  let row = Number.parseInt(m[4]!, 10) - 1
  if (col < 0 || row < 0) return '#REF!'
  if (!colAbs) col += deltaCol
  if (!rowAbs) row += deltaRow
  if (col < 0 || row < 0) return '#REF!'
  return `${colAbs ? '$' : ''}${colIndexToName(col)}${rowAbs ? '$' : ''}${row + 1}`
}
