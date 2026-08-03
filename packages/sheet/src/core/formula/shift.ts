import { colIndexToName, colNameToIndex, type CellAddress } from '../address'
import { FormulaParseError, tokenizeFormula, type FormulaToken } from './tokenizer'

/**
 * 公式引用平移（行列插入/删除，Excel 语义）。
 *
 * token 级处理：只平移引用 token（含 $ 绝对引用、跨表 `Sheet!A1`、区域 `A1:B2`），
 * 其余 token 原样保留——数字精度、运算符、函数名等公式文本不被规范化。
 *
 * 平移规则（以行为例，列对称）：
 * - 插入 at, count：
 *   - start.row >= at → 整体下移 count；
 *   - start.row < at <= end.row → 区域扩展（end.row + count）；
 * - 删除 [at, at+count)：
 *   - end.row < at → 不动；
 *   - start.row >= at+count → 整体上移 count；
 *   - 相交 → 按保留行数裁剪（区域收缩）；保留 0 行 / 单格引用被删 → broken（#REF!）。
 * - 绝对引用：`$1`（行绝对）不随行平移，`$A`（列绝对）不随列平移。
 */

export interface FormulaShiftResult {
  /** 平移后的公式文本（broken 时引用以 `#REF!` 占位，由调用方决定如何落库） */
  text: string
  /** 存在被删除区间覆盖的引用（需转 #REF!） */
  broken: boolean
}

/** 带绝对标志的引用坐标 */
interface RefParts {
  colAbs: boolean
  rowAbs: boolean
  addr: CellAddress
}

function parseRefParts(text: string): RefParts | null {
  const match = /^\$?([A-Za-z]+)\$?([1-9]\d*)$/.exec(text.trim())
  if (!match) return null
  const colAbs = text.trim().startsWith('$')
  const rowAbs = /\$([1-9]\d*)$/.test(text.trim())
  return {
    colAbs,
    rowAbs,
    addr: { row: Number.parseInt(match[2]!, 10) - 1, col: colNameToIndex(match[1]!) }
  }
}

function formatRef(parts: RefParts, addr: CellAddress): string {
  const col = parts.colAbs ? `$${colIndexToName(addr.col)}` : colIndexToName(addr.col)
  const row = parts.rowAbs ? `$${addr.row + 1}` : `${addr.row + 1}`
  return `${col}${row}`
}

export interface ShiftedRange {
  start: CellAddress
  end: CellAddress
  broken: boolean
}

/**
 * 平移一个引用（单格 = start === end）。
 * 绝对引用语义：`$1` 行绝对不随行平移、`$A` 列绝对不随列平移；
 * 区域整体绝对（起点绝对）时整区域不随该轴移动（Excel 行为）。
 */
export function shiftRange(
  start: CellAddress,
  end: CellAddress,
  axis: 'rows' | 'cols',
  at: number,
  count: number,
  mode: 'insert' | 'delete',
  startAbs?: RefParts
): ShiftedRange {
  const min = { row: Math.min(start.row, end.row), col: Math.min(start.col, end.col) }
  const max = { row: Math.max(start.row, end.row), col: Math.max(start.col, end.col) }
  const isSingle = min.row === max.row && min.col === max.col

  const shiftAxis = (v: number): number => {
    if (mode === 'insert') return v >= at ? v + count : v
    if (v < at) return v
    if (v >= at + count) return v - count
    return -1 // 删除区间内
  }

  const rowAbs = startAbs?.rowAbs ?? false
  const colAbs = startAbs?.colAbs ?? false
  const newStart = { ...min }
  const newEnd = { ...max }

  if (axis === 'rows') {
    if (isSingle) {
      if (mode === 'delete') {
        const shifted = rowAbs ? min.row : shiftAxis(min.row)
        if (shifted < 0) return { start: min, end: max, broken: true }
        newStart.row = shifted
        newEnd.row = shifted
      } else {
        newStart.row = rowAbs ? min.row : shiftAxis(min.row)
        newEnd.row = newStart.row
      }
      return { start: newStart, end: newEnd, broken: false }
    }
    if (rowAbs) return { start: min, end: max, broken: false }
    if (mode === 'insert') {
      if (min.row >= at) {
        newStart.row = min.row + count
        newEnd.row = max.row + count
      } else if (max.row >= at) {
        newEnd.row = max.row + count
      }
      return { start: newStart, end: newEnd, broken: false }
    }
    if (max.row < at) return { start: min, end: max, broken: false }
    if (min.row >= at + count) {
      newStart.row = min.row - count
      newEnd.row = max.row - count
      return { start: newStart, end: newEnd, broken: false }
    }
    const above = Math.max(0, Math.min(max.row, at - 1) - min.row + 1)
    const below = Math.max(0, max.row - Math.max(min.row, at + count) + 1)
    const kept = above + below
    if (kept <= 0) return { start: min, end: max, broken: true }
    const newStartRow = min.row < at ? min.row : at
    return {
      start: { ...min, row: newStartRow },
      end: { ...max, row: newStartRow + kept - 1 },
      broken: false
    }
  }

  // cols 轴（与 rows 对称）
  if (isSingle) {
    if (mode === 'delete') {
      const shifted = colAbs ? min.col : shiftAxis(min.col)
      if (shifted < 0) return { start: min, end: max, broken: true }
      newStart.col = shifted
      newEnd.col = shifted
    } else {
      newStart.col = colAbs ? min.col : shiftAxis(min.col)
      newEnd.col = newStart.col
    }
    return { start: newStart, end: newEnd, broken: false }
  }
  if (colAbs) return { start: min, end: max, broken: false }
  if (mode === 'insert') {
    if (min.col >= at) {
      newStart.col = min.col + count
      newEnd.col = max.col + count
    } else if (max.col >= at) {
      newEnd.col = max.col + count
    }
    return { start: newStart, end: newEnd, broken: false }
  }
  if (max.col < at) return { start: min, end: max, broken: false }
  if (min.col >= at + count) {
    newStart.col = min.col - count
    newEnd.col = max.col - count
    return { start: newStart, end: newEnd, broken: false }
  }
  const left = Math.max(0, Math.min(max.col, at - 1) - min.col + 1)
  const right = Math.max(0, max.col - Math.max(min.col, at + count) + 1)
  const kept = left + right
  if (kept <= 0) return { start: min, end: max, broken: true }
  const newStartCol = min.col < at ? min.col : at
  return {
    start: { ...min, col: newStartCol },
    end: { ...max, col: newStartCol + kept - 1 },
    broken: false
  }
}

/** 平移公式文本中的全部引用；解析失败时原样返回（broken=false） */
export function shiftFormulaText(
  formula: string,
  axis: 'rows' | 'cols',
  at: number,
  count: number,
  mode: 'insert' | 'delete'
): FormulaShiftResult {
  let tokens: FormulaToken[]
  try {
    tokens = tokenizeFormula(formula)
  } catch (error) {
    if (error instanceof FormulaParseError) return { text: formula, broken: false }
    throw error
  }

  const out: string[] = []
  let broken = false
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
    const isRef = refTok?.type === 'ident' && parseRefParts(refTok.name) !== null
    if (!isRef) {
      // 原样输出（含前缀 token，若无引用则前缀是函数名/表名的一部分）
      if (sheetPrefix !== null && j > i) {
        out.push(sheetPrefix, '!')
        i = j
        continue
      }
      out.push(tokenText(tok))
      i++
      continue
    }

    const startParts = parseRefParts(refTok!.name)!
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
    const shifted = shiftRange(
      startParts.addr,
      endParts ? endParts.addr : startParts.addr,
      axis,
      at,
      count,
      mode,
      startParts
    )
    if (shifted.broken) broken = true
    if (sheetPrefix !== null) out.push(sheetPrefix, '!')
    // broken 引用以 #REF! 占位（调用方据此决定落库策略）
    if (shifted.broken) {
      out.push('#REF!')
    } else {
      out.push(formatRef(startParts, shifted.start))
      if (endParts) out.push(':', formatRef(endParts, shifted.end))
    }
    i = k
  }
  return { text: out.join(''), broken }
}

function tokenText(tok: FormulaToken): string {
  switch (tok.type) {
    case 'number':
      return tok.raw
    case 'string':
      return `"${tok.value.replace(/"/g, '""')}"`
    case 'ident':
    case 'quoted-name':
      return tok.type === 'quoted-name' ? `'${tok.name.replace(/'/g, "''")}'` : tok.name
    case 'op':
      return tok.op
  }
}
