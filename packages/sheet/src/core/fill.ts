import type { CellAddress, CellRange } from './address'
import { createRange, iterateRange } from './address'
import type { CellData, CellType } from './cell-store'
import type { SetCellValueItem } from './command/set-cell-value'
import { formatRef, parseRefParts, tokenText, type RefParts } from './formula/shift'
import { FormulaParseError, tokenizeFormula, type FormulaToken } from './formula/tokenizer'

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
 * 公式引用按 delta 平移（填充柄复制语义）：尊重 `$` 绝对行列；出界 → `#REF!`。
 *
 * 与 `formula/shift.ts` 的 `shiftFormulaText`（行列插入/删除的区间平移）共享同一套
 * token 级引用识别（tokenizeFormula + parseRefParts + formatRef，#18）：
 * 字符串字面量、数字精度、函数名等 token 原样保留，只平移引用 token。
 * 差异仅在于位移方式：本函数按 deltaRow/deltaCol 直接加减（填充复制），
 * shiftFormulaText 按插入/删除区间重映射。
 */
export function shiftFormulaRefs(formula: string, deltaRow: number, deltaCol: number): string {
  if (deltaRow === 0 && deltaCol === 0) return formula

  let tokens: FormulaToken[]
  try {
    tokens = tokenizeFormula(formula)
  } catch (error) {
    if (error instanceof FormulaParseError) return formula
    throw error
  }

  const out: string[] = []
  let i = 0
  while (i < tokens.length) {
    const tok = tokens[i]!
    // 跨表前缀：ident / quoted-name + '!'
    let sheetPrefix: string | null = null
    let j = i
    if (tok.type === 'ident' || tok.type === 'quoted-name') {
      const bang = tokens[j + 1]
      if (bang?.type === 'op' && bang.op === '!') {
        sheetPrefix = tok.name
        j += 2
      }
    }
    const refTok = tokens[j]
    const startParts = refTok?.type === 'ident' ? parseRefParts(refTok.name) : null
    if (!startParts) {
      // 原样输出（含前缀 token；无引用时前缀是函数名/表名的一部分）
      if (sheetPrefix !== null && j > i) {
        out.push(sheetPrefix, '!')
        i = j
        continue
      }
      out.push(tokenText(tok))
      i++
      continue
    }
    // 引用形态后紧跟 '(' → 函数名（如 LOG10(），不平移（fill 语义比 shift 更严格，
    // 原手写 matchOneCell 即有此保护）
    const after = tokens[j + 1]
    if (after?.type === 'op' && after.op === '(') {
      if (sheetPrefix !== null && j > i) {
        out.push(sheetPrefix, '!')
        i = j
        continue
      }
      out.push(tokenText(tok))
      i++
      continue
    }
    // 区域终点
    let endParts: RefParts | null = null
    let k = j + 1
    const colon = tokens[k]
    const endTok = tokens[k + 1]
    if (colon?.type === 'op' && colon.op === ':' && endTok?.type === 'ident') {
      const parsed = parseRefParts(endTok.name)
      if (parsed) {
        endParts = parsed
        k += 2
      }
    }
    const startAddr = shiftRefByDelta(startParts, deltaRow, deltaCol)
    const endAddr = endParts ? shiftRefByDelta(endParts, deltaRow, deltaCol) : null
    if (sheetPrefix !== null) out.push(sheetPrefix, '!')
    // 任一端出界 → 整个引用 #REF!（与原实现 shiftAddrPart 语义一致）
    if (startAddr === null || (endParts !== null && endAddr === null)) {
      out.push('#REF!')
    } else {
      out.push(formatRef(startParts, startAddr))
      if (endParts !== null && endAddr !== null) {
        out.push(':', formatRef(endParts, endAddr))
      }
    }
    i = k
  }
  return out.join('')
}

/** 引用按 delta 平移（非绝对轴）；出界（负坐标）返回 null */
function shiftRefByDelta(parts: RefParts, deltaRow: number, deltaCol: number): CellAddress | null {
  const col = parts.colAbs ? parts.addr.col : parts.addr.col + deltaCol
  const row = parts.rowAbs ? parts.addr.row : parts.addr.row + deltaRow
  if (col < 0 || row < 0) return null
  return { row, col }
}
