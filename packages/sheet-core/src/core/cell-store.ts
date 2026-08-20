import type { CellAddress, CellRange } from './address'
import type { StyleId } from './style/types'

/**
 * 稀疏矩阵存储：`Map<row, Map<col, CellData>>`。
 * 空单元格 = 存储中不存在该 key（稀疏的第一原则）；
 * rowCount/colCount 只是高水位，用于渲染行数，不分配空间。
 */

/** 单元格值类型：n=数字 s=字符串 b=布尔 str=公式结果字符串 e=错误 d=日期（序列数） */
export type CellType = 'n' | 's' | 'b' | 'str' | 'e' | 'd'

/** 单元格原始值 */
export type CellValue = string | number | boolean | null

/** 单元格数据（参考 univer ICellData 裁剪版） */
export interface CellData {
  /** 原始值（公式格为计算缓存值） */
  v?: CellValue
  /** 值类型，缺省按 v 推断 */
  t?: CellType
  /** 公式文本（不含 '='），如 'SUM(A1:B2)+Sheet2!C3' */
  f?: string
  /** 样式池引用（样式定义集中存储在 StylePool，相同样式共享同一 id） */
  s?: StyleId
}

/** 序列化条目（snapshot/restore 用） */
export interface CellSnapshotItem extends CellData {
  row: number
  col: number
}

/**
 * 数字文本正则（与公式引擎 `coerceToNumber` 共享同一份定义，见 #29；不含 TRUE/FALSE）。
 * 用户输入规范化（normalizeInputValue）与公式强转数字共用。
 */
export const NUMERIC_TEXT_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

/**
 * 规范化用户输入值（对齐 Excel 键入语义）：
 * - 数字文本 → number（`SUM` 等聚合才能计入区域）
 * - `TRUE`/`FALSE`（忽略大小写）→ boolean
 * - 前导 `'` → 强制文本（去掉撇号，保留其余）
 * - 其余字符串 / 非字符串原样返回
 */
export function normalizeInputValue(value: CellValue): CellValue {
  if (typeof value !== 'string') return value
  if (value.startsWith("'")) return value.slice(1)
  const text = value.trim()
  if (text === '') return value
  const upper = text.toUpperCase()
  if (upper === 'TRUE') return true
  if (upper === 'FALSE') return false
  if (NUMERIC_TEXT_RE.test(text)) {
    const n = Number.parseFloat(text)
    if (Number.isFinite(n)) return n
  }
  return value
}

/** 按原始值推断类型 */
export function inferCellType(v: CellValue): CellType | undefined {
  switch (typeof v) {
    case 'number':
      return 'n'
    case 'boolean':
      return 'b'
    case 'string':
      return 's'
    default:
      return undefined
  }
}

/** 判定为空：无公式、无样式且值为 null/undefined/''（只有样式的格不算空） */
export function isEmptyCellData(data: CellData | undefined): boolean {
  if (!data) return true
  if (data.s != null) return false
  if (data.f != null && data.f !== '') return false
  return data.v == null || data.v === ''
}

/** CellData 相等（v/t/f/s 四字段逐一比较；命令系统据此跳过无实际变更的补丁） */
export function cellDataEqual(a: CellData | undefined, b: CellData | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.v === b.v && a.t === b.t && a.f === b.f && a.s === b.s
}

export class CellStore {
  private cells = new Map<number, Map<number, CellData>>()
  private _rowCount = 0
  private _colCount = 0

  /** 行数高水位（只增不减，restore 时重算） */
  get rowCount(): number {
    return this._rowCount
  }

  /** 列数高水位 */
  get colCount(): number {
    return this._colCount
  }

  /** 真实存在的单元格数量 */
  get size(): number {
    let size = 0
    for (const rowMap of this.cells.values()) size += rowMap.size
    return size
  }

  /** 读取（返回副本，外部修改不影响存储） */
  getCell(addr: CellAddress): CellData | undefined {
    const data = this.cells.get(addr.row)?.get(addr.col)
    return data ? { ...data } : undefined
  }

  /** 写入（存储副本）；空数据等价于删除 */
  setCell(addr: CellAddress, data?: CellData): void {
    if (isEmptyCellData(data)) {
      this.deleteCell(addr)
      return
    }
    let rowMap = this.cells.get(addr.row)
    if (!rowMap) {
      rowMap = new Map()
      this.cells.set(addr.row, rowMap)
    }
    rowMap.set(addr.col, { ...data })
    this._rowCount = Math.max(this._rowCount, addr.row + 1)
    this._colCount = Math.max(this._colCount, addr.col + 1)
  }

  /** 便捷写入原始值，类型自动推断；空值等价于删除 */
  setCellValue(addr: CellAddress, value: CellValue): void {
    if (value == null || value === '') {
      this.deleteCell(addr)
      return
    }
    const normalized = normalizeInputValue(value)
    this.setCell(addr, { v: normalized, t: inferCellType(normalized) })
  }

  deleteCell(addr: CellAddress): boolean {
    const rowMap = this.cells.get(addr.row)
    if (!rowMap) return false
    const deleted = rowMap.delete(addr.col)
    if (rowMap.size === 0) this.cells.delete(addr.row)
    return deleted
  }

  /** 只遍历真实存在的单元格（行主序） */
  *entries(): Generator<[CellAddress, CellData], void, undefined> {
    for (const [row, rowMap] of this.cells) {
      for (const [col, data] of rowMap) {
        yield [{ row, col }, { ...data }]
      }
    }
  }

  /** 只遍历区域内真实存在的单元格（行主序；公式区域展开用，空行/空格不分配不访问） */
  *entriesInRange(range: CellRange): Generator<[CellAddress, CellData], void, undefined> {
    for (let row = range.start.row; row <= range.end.row; row++) {
      const rowMap = this.cells.get(row)
      if (!rowMap) continue
      // 迭代行内稀疏键再按列范围过滤：宽区域（如 =SUM(A1:XFD100000)）下
      // 代价 = O(有数据的行数 + 行内键数)，而非 O(行数 × 列范围宽)（#7）
      for (const [col, data] of rowMap) {
        if (col < range.start.col || col > range.end.col) continue
        yield [{ row, col }, { ...data }]
      }
    }
  }

  /**
   * 该列有数据的行号（稀疏遍历各行的列 Map，O(有数据的行数)）。
   * 列宽拖拽等「按列找行」场景替代全表 entries() 扫描（#10）。
   */
  *rowsForColumn(col: number): Generator<number, void, undefined> {
    for (const [row, rowMap] of this.cells) {
      if (rowMap.has(col)) yield row
    }
  }

  /** 只读访问内部引用（渲染层热路径用；调用方不得修改返回对象，#11） */
  peekCell(addr: CellAddress): CellData | undefined {
    return this.cells.get(addr.row)?.get(addr.col)
  }

  /** 只读遍历已存格（不拷贝 data；调用方不得修改返回对象） */
  *peekEntries(): Generator<[CellAddress, CellData], void, undefined> {
    for (const [row, rowMap] of this.cells) {
      for (const [col, data] of rowMap) {
        yield [{ row, col }, data]
      }
    }
  }

  /** 只读遍历某行已存格 [col, data]（不拷贝） */
  *peekRow(row: number): Generator<[number, CellData], void, undefined> {
    const rowMap = this.cells.get(row)
    if (!rowMap) return
    yield* rowMap
  }

  /** 有数据的行号（稀疏） */
  *rowKeys(): Generator<number, void, undefined> {
    yield* this.cells.keys()
  }

  /** 序列化（只含真实存在的格） */
  snapshot(): CellSnapshotItem[] {
    const items: CellSnapshotItem[] = []
    for (const [addr, data] of this.entries()) {
      items.push({ row: addr.row, col: addr.col, ...data })
    }
    return items
  }

  /** 从序列化恢复（清空重建，重算高水位） */
  restore(items: readonly CellSnapshotItem[]): void {
    this.clear()
    for (const item of items) {
      const { row, col, ...data } = item
      if (isEmptyCellData(data)) continue
      let rowMap = this.cells.get(row)
      if (!rowMap) {
        rowMap = new Map()
        this.cells.set(row, rowMap)
      }
      rowMap.set(col, { ...data })
      this._rowCount = Math.max(this._rowCount, row + 1)
      this._colCount = Math.max(this._colCount, col + 1)
    }
  }

  clear(): void {
    this.cells.clear()
    this._rowCount = 0
    this._colCount = 0
  }

  // ─── 行列插入/删除（坐标平移）─────────────────────────

  /**
   * 插入 count 行：所有 row >= at 的行整体下移 count。
   * 仅平移坐标，不产生新数据；高水位按真实数据重算。
   */
  insertRows(at: number, count: number): void {
    if (count <= 0) return
    const shifted: Array<[number, Map<number, CellData>]> = []
    for (const [row, rowMap] of this.cells) {
      if (row >= at) shifted.push([row, rowMap])
    }
    // 两阶段：先全部删除再写入，避免目标键覆盖未处理的源键
    for (const [row] of shifted) this.cells.delete(row)
    for (const [row, rowMap] of shifted) this.cells.set(row + count, rowMap)
    this.recomputeExtent()
  }

  /** 删除 [at, at+count) 行：区间内行移除，之后的行整体上移 count */
  deleteRows(at: number, count: number): void {
    if (count <= 0) return
    const end = at + count
    for (const row of Array.from(this.cells.keys())) {
      if (row >= at && row < end) this.cells.delete(row)
    }
    const shifted: Array<[number, Map<number, CellData>]> = []
    for (const [row, rowMap] of this.cells) {
      if (row >= end) shifted.push([row, rowMap])
    }
    for (const [row] of shifted) this.cells.delete(row)
    for (const [row, rowMap] of shifted) this.cells.set(row - count, rowMap)
    this.recomputeExtent()
  }

  /** 插入 count 列：所有 col >= at 的列整体右移 count */
  insertCols(at: number, count: number): void {
    if (count <= 0) return
    for (const [row, rowMap] of this.cells) {
      const newMap = new Map<number, CellData>()
      for (const [col, data] of rowMap) {
        newMap.set(col >= at ? col + count : col, data)
      }
      this.cells.set(row, newMap)
    }
    this.recomputeExtent()
  }

  /** 删除 [at, at+count) 列：区间内列移除，之后的列整体左移 count */
  deleteCols(at: number, count: number): void {
    if (count <= 0) return
    const end = at + count
    for (const [row, rowMap] of this.cells) {
      const newMap = new Map<number, CellData>()
      for (const [col, data] of rowMap) {
        if (col >= at && col < end) continue
        newMap.set(col >= end ? col - count : col, data)
      }
      this.cells.set(row, newMap)
    }
    this.recomputeExtent()
  }

  /** 重算行/列高水位（行列平移后真实数据范围可能收缩） */
  private recomputeExtent(): void {
    let maxRow = -1
    let maxCol = -1
    for (const [row, rowMap] of this.cells) {
      if (row > maxRow) maxRow = row
      for (const col of rowMap.keys()) {
        if (col > maxCol) maxCol = col
      }
    }
    this._rowCount = maxRow + 1
    this._colCount = maxCol + 1
  }
}
