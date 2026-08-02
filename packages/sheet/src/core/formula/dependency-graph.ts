import { cellKey, rangeContainsAddress, type CellAddress, type CellRange } from '../address'
import type { CellData, CellType, CellValue } from '../cell-store'
import type { CellPatch } from '../command/types'
import type { Sheet } from '../sheet'
import { collectReferences, type AstNode } from './ast'
import { formulaError, isFormulaError, isFormulaErrorCode, type FormulaError } from './errors'
import { evaluateAst, type ScalarValue } from './evaluator'
import { invokeFormulaFunction } from './functions'
import { parseFormula } from './parser'
import { FormulaParseError } from './tokenizer'

/**
 * 依赖图（工作簿级计算中枢）：
 * - sheet 注册表：跨表引用按名解析（不存在 → #REF!）
 * - 正向索引：公式格 → 引用格集合（节点 deps）；反向索引：引用格 → 依赖者
 *   （单格引用走 cellKey 精确索引 O(1)，区域引用走线性扫描）
 * - 变更时标脏（向上 BFS 收集全部依赖者）+ 拓扑序增量重算（递归向下，memo 去重）
 * - 循环引用检测：求值在途栈遇回边 → 环上所有格 #CYCLE!；依赖环外格只传播错误，
 *   打破循环（编辑环上格）后经标脏重算自动恢复
 *
 * 图状态与单元格存储严格同步：所有 f 变更（命令/undo/redo/rollback 回放）都经
 * Sheet.applyPatch → syncCell 维护节点；重算只发生在命令执行后（见 Sheet.executeCommand），
 * undo/redo 靠派生补丁精确回放缓存值，不重算。
 */

/** 公式节点的一个依赖（sheet 名已补齐为具体值） */
export interface FormulaDependency {
  sheetName: string
  range: CellRange
}

/** 公式节点（依赖图管理的公式格状态；依赖图外部只读使用） */
export interface FormulaNode {
  readonly sheetName: string
  readonly addr: CellAddress
  readonly formula: string
  /** null = 解析失败（求值 #ERROR!，无依赖） */
  readonly ast: AstNode | null
  readonly deps: FormulaDependency[]
  /** 反向索引清理器（removeNode 时执行） */
  readonly cleanups: (() => void)[]
}

export class DependencyGraph {
  private readonly sheets = new Map<string, Sheet>()
  /** 正向索引宿主：sheetName → cellKey → 公式节点 */
  private readonly nodes = new Map<string, Map<number, FormulaNode>>()
  /** 反向索引（单格引用）：sheetName → cellKey → 依赖者集合 */
  private readonly exact = new Map<string, Map<number, Set<FormulaNode>>>()
  /** 反向索引（区域引用）：sheetName → { 区域, 依赖者 } 集合（线性扫描） */
  private readonly ranged = new Map<string, Set<{ range: CellRange; node: FormulaNode }>>()

  // ─── sheet 注册表 ─────────────────────────────────────────

  registerSheet(sheet: Sheet): void {
    this.sheets.set(sheet.name, sheet)
  }

  /** 注销 sheet 并移除其全部公式节点（引用它的公式在下次重算时得 #REF!） */
  unregisterSheet(sheet: Sheet): void {
    if (this.sheets.get(sheet.name) !== sheet) return
    this.sheets.delete(sheet.name)
    const sheetNodes = this.nodes.get(sheet.name)
    if (sheetNodes) {
      for (const node of sheetNodes.values()) this.removeNode(node)
    }
  }

  getSheet(name: string): Sheet | undefined {
    return this.sheets.get(name)
  }

  // ─── 节点查询 ─────────────────────────────────────────────

  getNode(sheetName: string, addr: CellAddress): FormulaNode | undefined {
    return this.nodes.get(sheetName)?.get(cellKey(addr))
  }

  /** 公式节点总数（测试/调试用） */
  get nodeCount(): number {
    let count = 0
    for (const sheetNodes of this.nodes.values()) count += sheetNodes.size
    return count
  }

  // ─── 图同步 ───────────────────────────────────────────────

  /**
   * 单元格补丁后的图同步：f 增/删/改 → 节点增/删/重建。
   * 由 Sheet.applyPatch（唯一变更通道）调用，命令与 undo/redo 回放均覆盖。
   */
  syncCell(sheet: Sheet, addr: CellAddress, before?: CellData, after?: CellData): void {
    const beforeF = before?.f
    const afterF = after?.f
    if (beforeF === afterF) return
    const existing = this.getNode(sheet.name, addr)
    if (existing) this.removeNode(existing)
    if (afterF != null && afterF !== '') this.addNode(sheet, addr, afterF)
  }

  // ─── 增量重算 ─────────────────────────────────────────────

  /**
   * 变更集 → 标脏 + 拓扑序重算 → 派生补丁（未应用）。
   * 调用方（Sheet.executeCommand）负责应用补丁并并入同一 undo 单元。
   */
  recalc(changed: readonly { sheet: Sheet; addr: CellAddress }[]): CellPatch[] {
    // 1. 标脏：变更格自身（若是公式）+ 向上 BFS 全部传递依赖者
    const dirty = new Set<FormulaNode>()
    const queue: FormulaNode[] = []
    const mark = (node: FormulaNode | undefined): void => {
      if (node && !dirty.has(node)) {
        dirty.add(node)
        queue.push(node)
      }
    }
    for (const { sheet, addr } of changed) {
      mark(this.getNode(sheet.name, addr))
      for (const dep of this.dependentsOf(sheet.name, addr)) mark(dep)
    }
    for (let i = 0; i < queue.length; i++) {
      const node = queue[i]!
      for (const dep of this.dependentsOf(node.sheetName, node.addr)) mark(dep)
    }
    if (dirty.size === 0) return []

    // 2. 拓扑序求值：递归向下（依赖先于使用求值），memo 保证每格最多算一次；
    //    在途栈遇回边 → 栈中自回边点起全部入环（#CYCLE!）
    const passValues = new Map<FormulaNode, ScalarValue | FormulaError>()
    const inProgress = new Set<FormulaNode>()
    const stack: FormulaNode[] = []
    const cycleMembers = new Set<FormulaNode>()
    const cycleError = formulaError('#CYCLE!')

    const evaluateNode = (node: FormulaNode): ScalarValue | FormulaError => {
      const cached = passValues.get(node)
      if (cached !== undefined) return cached
      if (inProgress.has(node)) {
        const start = stack.indexOf(node)
        for (let i = start; i < stack.length; i++) cycleMembers.add(stack[i]!)
        return cycleError
      }
      if (!node.ast) {
        const error = formulaError('#ERROR!')
        passValues.set(node, error)
        return error
      }
      inProgress.add(node)
      stack.push(node)
      let value: ScalarValue | FormulaError | (ScalarValue | FormulaError)[]
      try {
        value = evaluateAst(node.ast, {
          currentSheet: node.sheetName,
          readCell,
          readRange,
          callFunction: invokeFormulaFunction
        })
      } catch {
        // 求值期异常（如自定义函数抛错）不应击穿重算 → 记为 #ERROR!
        value = formulaError('#ERROR!')
      }
      inProgress.delete(node)
      stack.pop()
      // 区域直接作为公式结果（'=A1:B2'）→ #VALUE!
      if (Array.isArray(value)) value = formulaError('#VALUE!')
      if (cycleMembers.has(node)) value = cycleError
      passValues.set(node, value)
      return value
    }

    const readCell = (sheetName: string, addr: CellAddress): ScalarValue | FormulaError => {
      const sheet = this.sheets.get(sheetName)
      if (!sheet) return formulaError('#REF!')
      const dep = this.getNode(sheetName, addr)
      if (dep && dirty.has(dep)) return evaluateNode(dep)
      return cellDataToScalar(sheet.store.getCell(addr))
    }

    const readRange = (
      sheetName: string,
      range: CellRange
    ): (ScalarValue | FormulaError)[] | FormulaError => {
      const sheet = this.sheets.get(sheetName)
      if (!sheet) return formulaError('#REF!')
      const values: (ScalarValue | FormulaError)[] = []
      // 只迭代稀疏存在的格
      for (const [addr, data] of sheet.store.entriesInRange(range)) {
        const dep = this.getNode(sheetName, addr)
        values.push(dep && dirty.has(dep) ? evaluateNode(dep) : cellDataToScalar(data))
      }
      return values
    }

    for (const node of dirty) evaluateNode(node)

    // 3. 派生补丁：缓存值与重算结果一致的跳过（收敛时不产生冗余变更）
    const patches: CellPatch[] = []
    for (const node of dirty) {
      const value = passValues.get(node)!
      const { v, t } = serializeResult(value)
      const sheet = this.sheets.get(node.sheetName)
      if (!sheet) continue
      const before = sheet.store.getCell(node.addr)
      if (before && before.f === node.formula && before.v === v && before.t === t) continue
      patches.push({
        kind: 'cell',
        sheet,
        addr: node.addr,
        before,
        after: { f: node.formula, v, t }
      })
    }
    return patches
  }

  // ─── 内部 ─────────────────────────────────────────────────

  private addNode(sheet: Sheet, addr: CellAddress, formula: string): void {
    let ast: AstNode | null = null
    try {
      ast = parseFormula(formula)
    } catch (error) {
      if (!(error instanceof FormulaParseError)) throw error
      // 解析失败：ast 保持 null（求值 #ERROR!，无依赖）
    }
    const deps: FormulaDependency[] = []
    if (ast) {
      const seen = new Set<string>()
      for (const ref of collectReferences(ast)) {
        const sheetName = ref.sheet ?? sheet.name
        const { start, end } = ref.range
        const key = `${sheetName}|${start.row},${start.col},${end.row},${end.col}`
        if (seen.has(key)) continue
        seen.add(key)
        deps.push({ sheetName, range: ref.range })
      }
    }
    const node: FormulaNode = {
      sheetName: sheet.name,
      addr: { ...addr },
      formula,
      ast,
      deps,
      cleanups: []
    }
    let sheetNodes = this.nodes.get(sheet.name)
    if (!sheetNodes) {
      sheetNodes = new Map()
      this.nodes.set(sheet.name, sheetNodes)
    }
    sheetNodes.set(cellKey(addr), node)

    for (const dep of deps) {
      const isSingleCell =
        dep.range.start.row === dep.range.end.row && dep.range.start.col === dep.range.end.col
      if (isSingleCell) {
        let sheetExact = this.exact.get(dep.sheetName)
        if (!sheetExact) {
          sheetExact = new Map()
          this.exact.set(dep.sheetName, sheetExact)
        }
        const key = cellKey(dep.range.start)
        let set = sheetExact.get(key)
        if (!set) {
          set = new Set()
          sheetExact.set(key, set)
        }
        set.add(node)
        node.cleanups.push(() => {
          set.delete(node)
          if (set.size === 0) sheetExact.delete(key)
        })
      } else {
        let set = this.ranged.get(dep.sheetName)
        if (!set) {
          set = new Set()
          this.ranged.set(dep.sheetName, set)
        }
        const entry = { range: dep.range, node }
        set.add(entry)
        node.cleanups.push(() => set.delete(entry))
      }
    }
  }

  private removeNode(node: FormulaNode): void {
    for (const cleanup of node.cleanups) cleanup()
    const sheetNodes = this.nodes.get(node.sheetName)
    if (!sheetNodes) return
    sheetNodes.delete(cellKey(node.addr))
    if (sheetNodes.size === 0) this.nodes.delete(node.sheetName)
  }

  private dependentsOf(sheetName: string, addr: CellAddress): Set<FormulaNode> {
    const result = new Set<FormulaNode>()
    const exactSet = this.exact.get(sheetName)?.get(cellKey(addr))
    if (exactSet) for (const node of exactSet) result.add(node)
    const rangedSet = this.ranged.get(sheetName)
    if (rangedSet) {
      for (const entry of rangedSet) {
        if (rangeContainsAddress(entry.range, addr)) result.add(entry.node)
      }
    }
    return result
  }
}

/** 单元格存储 → 求值标量（t='e' 还原为错误标记；空 → null） */
function cellDataToScalar(data: CellData | undefined): ScalarValue | FormulaError {
  if (!data || data.v == null) return null
  if (data.t === 'e') {
    return formulaError(isFormulaErrorCode(data.v) ? data.v : '#ERROR!')
  }
  return data.v
}

/** 求值结果 → 存储形态（str = 公式结果字符串，e = 错误；与决策 2 一致） */
function serializeResult(value: ScalarValue | FormulaError): { v: CellValue; t: CellType } {
  if (isFormulaError(value)) return { v: value.code, t: 'e' }
  if (value === null) return { v: 0, t: 'n' } // 防御：公式结果不会是 null
  switch (typeof value) {
    case 'number':
      return { v: value, t: 'n' }
    case 'boolean':
      return { v: value, t: 'b' }
    default:
      return { v: value, t: 'str' }
  }
}
