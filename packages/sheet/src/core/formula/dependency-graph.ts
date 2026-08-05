import { cellKey, type CellAddress, type CellRange } from '../address'
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

/** 内部可变节点（sheetName / deps 在 renameSheet 时原地更新；对外仍按 FormulaNode 只读暴露） */
type InternalNode = Omit<FormulaNode, 'sheetName' | 'deps' | 'cleanups'> & {
  sheetName: string
  deps: FormulaDependency[]
  cleanups: (() => void)[]
}

export class DependencyGraph {
  private readonly sheets = new Map<string, Sheet>()
  /** 表改名后的旧名 → 新名别名（求值解析层：AST 仍引用旧名，经别名解析到新名；
   *  公式文本不重写，与「引用跟随改名」语义一致；删除时随表清理） */
  private readonly aliases = new Map<string, string>()
  /** 正向索引宿主：sheetName → cellKey → 公式节点 */
  private readonly nodes = new Map<string, Map<number, InternalNode>>()
  /** 反向索引（单格引用）：sheetName → cellKey → 依赖者集合 */
  private readonly exact = new Map<string, Map<number, Set<InternalNode>>>()
  /** 反向索引（区域引用）：sheetName → { 区域, 依赖者 } 集合（线性扫描） */
  private readonly ranged = new Map<string, Set<{ range: CellRange; node: InternalNode }>>()

  // ─── sheet 注册表 ─────────────────────────────────────────

  registerSheet(sheet: Sheet): void {
    this.sheets.set(sheet.name, sheet)
  }

  /**
   * 注销 sheet 并移除其全部公式节点；随后重算所有引用该表的公式节点并返回
   * 派生补丁（未应用）——引用方立即变 #REF!（调用方负责应用补丁，不入 undo）。
   * 返回空数组 = 无引用方（或表未注册）。
   */
  unregisterSheet(sheet: Sheet): CellPatch[] {
    if (this.sheets.get(sheet.name) !== sheet) return []
    // 注销前收集引用该表的节点（exact/ranged 反向索引仍有效）
    const sources: InternalNode[] = []
    const exactSet = this.exact.get(sheet.name)
    if (exactSet) {
      for (const set of exactSet.values()) for (const node of set) sources.push(node)
    }
    const rangedSet = this.ranged.get(sheet.name)
    if (rangedSet) {
      for (const entry of rangedSet) sources.push(entry.node)
    }
    this.sheets.delete(sheet.name)
    // 清理指向该表的全部别名（旧名引用随之失效 → #REF!，与删除语义一致）
    for (const [old, next] of this.aliases) {
      if (next === sheet.name) this.aliases.delete(old)
    }
    const sheetNodes = this.nodes.get(sheet.name)
    if (sheetNodes) {
      for (const node of sheetNodes.values()) this.removeNode(node)
    }
    // 回收反向索引外层空壳（节点已全部移除；#26）
    this.exact.delete(sheet.name)
    this.ranged.delete(sheet.name)
    // 引用方重算：readCell/readRange 查不到该表 → #REF!
    return this.recalcFrom(sources)
  }

  /**
   * 表改名后的索引重排：sheet 注册表、被改名表自身节点、以及所有引用该表的
   * 公式节点（跨表公式引用跟随改名）全部切到新名。既有引用在改名后保持有效。
   * 必须在 Sheet.setName 之后调用（节点内部 sheetName 取自 sheet.name 的地方已统一）。
   */
  renameSheet(oldName: string, newName: string): void {
    const sheet = this.sheets.get(oldName)
    if (!sheet) return
    // 1. 收集受影响节点：被改名表自身的公式节点 + 所有引用该表的节点
    const affected = new Set<InternalNode>()
    const ownNodes = this.nodes.get(oldName)
    if (ownNodes) {
      for (const node of ownNodes.values()) affected.add(node)
    }
    const exactSet = this.exact.get(oldName)
    if (exactSet) {
      for (const set of exactSet.values()) for (const node of set) affected.add(node)
    }
    const rangedSet = this.ranged.get(oldName)
    if (rangedSet) {
      for (const entry of rangedSet) affected.add(entry.node)
    }
    // 2. 先全部移出索引（反向索引条目随 removeNode 清理）
    for (const node of affected) this.removeNode(node)
    // 回收旧名反向索引外层空壳（#26）；节点随后按新名重新注册
    this.exact.delete(oldName)
    this.ranged.delete(oldName)
    // 3. 更新 sheet 注册表 + 别名（求值层：AST 旧名引用经别名解析到新名）
    this.sheets.delete(oldName)
    this.sheets.set(newName, sheet)
    // 拍平别名链：所有指向 oldName 的条目改指 newName（连续改名 A→B→C 后引用 A 仍有效）；
    // 删除键为 newName 的残留条目（新名是真实表名，别名不得覆盖真实名——改名回改 A→B→A 场景）
    const toUpdate: [string, string][] = []
    for (const [key, next] of this.aliases) {
      if (next === oldName) toUpdate.push([key, newName])
    }
    for (const [key, next] of toUpdate) this.aliases.set(key, next)
    this.aliases.delete(newName)
    this.aliases.set(oldName, newName)
    // 4. 原地更新节点内部字段并按新名重新注册
    for (const node of affected) {
      if (node.sheetName === oldName) node.sheetName = newName
      for (const dep of node.deps) {
        if (dep.sheetName === oldName) dep.sheetName = newName
      }
      this.registerNode(node)
    }
  }

  getSheet(name: string): Sheet | undefined {
    return this.sheets.get(name)
  }

  /** 遍历全部公式节点（行列平移等批量操作用）：[sheet, 节点] */
  *allNodes(): Generator<[Sheet, FormulaNode], void, undefined> {
    for (const [name, map] of this.nodes) {
      const sheet = this.sheets.get(name)
      if (!sheet) continue
      for (const node of map.values()) yield [sheet, node]
    }
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
   * 批量优化（#8）：同一表多个变更格合并为一次 ranged 反向索引扫描
   * （原实现对每个变更格各扫一遍全部区域引用 → O(N×R) 放大）。
   */
  recalc(changed: readonly { sheet: Sheet; addr: CellAddress }[]): CellPatch[] {
    const sources: InternalNode[] = []
    const seen = new Set<InternalNode>()
    const mark = (node: FormulaNode | undefined): void => {
      if (node && !seen.has(node as InternalNode)) {
        seen.add(node as InternalNode)
        sources.push(node as InternalNode)
      }
    }
    const bySheet = new Map<string, CellAddress[]>()
    for (const { sheet, addr } of changed) {
      mark(this.getNode(sheet.name, addr))
      let list = bySheet.get(sheet.name)
      if (!list) {
        list = []
        bySheet.set(sheet.name, list)
      }
      list.push(addr)
    }
    for (const [sheetName, addrs] of bySheet) this.markDependents(sheetName, addrs, mark)
    return this.recalcFrom(sources)
  }

  /**
   * 从指定标脏源集合重算（删除 sheet 联动：引用方立即 #REF!）。
   * 源节点 + 其传递依赖者全部重算；派生补丁未应用。
   */
  private recalcFrom(sources: Iterable<FormulaNode>): CellPatch[] {
    // 1. 标脏：源节点自身（若是公式）+ 向上 BFS 全部传递依赖者
    const dirty = new Set<FormulaNode>()
    const queue: FormulaNode[] = []
    const mark = (node: FormulaNode | undefined): void => {
      if (node && !dirty.has(node)) {
        dirty.add(node)
        queue.push(node)
      }
    }
    for (const node of sources) mark(node)
    // BFS 逐层处理：同层节点按表合并 ranged 扫描（每表每层一次，而非每节点一次，#8）
    let head = 0
    while (head < queue.length) {
      const tail = queue.length
      const bySheet = new Map<string, CellAddress[]>()
      for (; head < tail; head++) {
        const node = queue[head]!
        let list = bySheet.get(node.sheetName)
        if (!list) {
          list = []
          bySheet.set(node.sheetName, list)
        }
        list.push(node.addr)
      }
      for (const [sheetName, addrs] of bySheet) this.markDependents(sheetName, addrs, mark)
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
      const resolved = this.aliases.get(sheetName) ?? sheetName
      const sheet = this.sheets.get(resolved)
      if (!sheet) return formulaError('#REF!')
      const dep = this.getNode(resolved, addr)
      if (dep && dirty.has(dep)) return evaluateNode(dep)
      return cellDataToScalar(sheet.store.getCell(addr))
    }

    const readRange = (
      sheetName: string,
      range: CellRange
    ): (ScalarValue | FormulaError)[] | FormulaError => {
      const resolved = this.aliases.get(sheetName) ?? sheetName
      const sheet = this.sheets.get(resolved)
      if (!sheet) return formulaError('#REF!')
      const values: (ScalarValue | FormulaError)[] = []
      // 只迭代稀疏存在的格
      for (const [addr, data] of sheet.store.entriesInRange(range)) {
        const dep = this.getNode(resolved, addr)
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
        // 只写缓存值（v/t），保留既有样式（s）——重算不得丢失格式
        after:
          before?.s != null ? { f: node.formula, v, t, s: before.s } : { f: node.formula, v, t }
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
    const node: InternalNode = {
      sheetName: sheet.name,
      addr: { ...addr },
      formula,
      ast,
      deps,
      cleanups: []
    }
    this.registerNode(node)
  }

  /** 注册节点到正向索引（nodes）与反向索引（exact/ranged）；renameSheet 重排后复用 */
  private registerNode(node: InternalNode): void {
    let sheetNodes = this.nodes.get(node.sheetName)
    if (!sheetNodes) {
      sheetNodes = new Map()
      this.nodes.set(node.sheetName, sheetNodes)
    }
    sheetNodes.set(cellKey(node.addr), node)

    for (const dep of node.deps) {
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

  private removeNode(node: InternalNode): void {
    for (const cleanup of node.cleanups) cleanup()
    // 清空清理器：renameSheet 会原地复用节点并重新注册，避免旧清理器累积
    node.cleanups.length = 0
    const sheetNodes = this.nodes.get(node.sheetName)
    if (!sheetNodes) return
    sheetNodes.delete(cellKey(node.addr))
    if (sheetNodes.size === 0) this.nodes.delete(node.sheetName)
  }

  /**
   * 收集指定表的反向依赖者（批量）：exact 每格 O(1)；ranged 每表一次扫描，
   * 变更格按行合并为列区间（连续矩形变更 → 区间数 ≪ 格数）加速相交判定（#8）。
   * @param mark 命中节点回调（去重由调用方负责）
   */
  private markDependents(
    sheetName: string,
    addrs: readonly CellAddress[],
    mark: (node: FormulaNode | undefined) => void
  ): void {
    const exactSet = this.exact.get(sheetName)
    if (exactSet) {
      for (const addr of addrs) {
        const set = exactSet.get(cellKey(addr))
        if (set) for (const node of set) mark(node)
      }
    }
    const rangedSet = this.ranged.get(sheetName)
    if (rangedSet && rangedSet.size > 0) {
      const spans = mergeAddrsIntoRowSpans(addrs)
      for (const entry of rangedSet) {
        if (spansOverlap(entry.range, spans)) mark(entry.node)
      }
    }
  }
}

/**
 * 地址数组 → 按行分组的列闭区间（相邻列合并）。
 * 批量粘贴/填充的变更格通常呈连续矩形，区间数 ≪ 格数；
 * 随机分散时区间数 ≈ 格数（退化到与逐格判定同阶，不更差）。
 */
function mergeAddrsIntoRowSpans(
  addrs: readonly CellAddress[]
): Map<number, Array<[number, number]>> {
  const byRow = new Map<number, number[]>()
  for (const addr of addrs) {
    let cols = byRow.get(addr.row)
    if (!cols) {
      cols = []
      byRow.set(addr.row, cols)
    }
    cols.push(addr.col)
  }
  const spans = new Map<number, Array<[number, number]>>()
  for (const [row, cols] of byRow) {
    cols.sort((a, b) => a - b)
    const rowSpans: Array<[number, number]> = []
    let start = cols[0]!
    let end = cols[0]!
    for (let i = 1; i < cols.length; i++) {
      if (cols[i] === end + 1) {
        end = cols[i]!
      } else {
        rowSpans.push([start, end])
        start = cols[i]!
        end = cols[i]!
      }
    }
    rowSpans.push([start, end])
    spans.set(row, rowSpans)
  }
  return spans
}

/** 区域与按行分组的列区间是否有交集（任一命中行的 span 与区域列区间相交） */
function spansOverlap(range: CellRange, spans: Map<number, Array<[number, number]>>): boolean {
  for (const [row, rowSpans] of spans) {
    if (row < range.start.row || row > range.end.row) continue
    for (const [colStart, colEnd] of rowSpans) {
      if (colEnd >= range.start.col && colStart <= range.end.col) return true
    }
  }
  return false
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
