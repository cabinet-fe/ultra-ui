import type { CellPatch } from './command/types'
import { TypedEventEmitter } from './events'
import { DependencyGraph } from './formula/dependency-graph'
import { Sheet } from './sheet'

/**
 * Workbook：多 Sheet 管理。
 * 所有 sheet 共享一个公式依赖图（跨表引用与增量重算的中枢）。
 */

export type WorkbookEvents = {
  /** 激活 sheet 切换 */
  'active-sheet-change': { sheet: Sheet; index: number }
  /** sheet 增删 */
  'sheets-change': { sheets: Sheet[] }
  /** sheet 重命名（跨表公式引用已跟随新名） */
  'sheet-rename': { sheet: Sheet; oldName: string; newName: string }
}

export class Workbook {
  private sheets: Sheet[] = []
  private activeIndex = 0
  private emitter = new TypedEventEmitter<WorkbookEvents>()
  /** 工作簿级公式依赖图（全部 sheet 共享） */
  readonly formulaGraph = new DependencyGraph()

  /** 批量结构变更深度（beginBatch/endBatch；>0 时结构事件抑制，endBatch 合并补发） */
  private batchDepth = 0
  private batchSheetsChanged = false
  private batchRenamed: WorkbookEvents['sheet-rename'] | null = null
  /** batch 开始时的激活项（endBatch 时对比补发 active-sheet-change） */
  private batchActive: { sheet: Sheet; index: number } | null = null

  constructor() {
    this.addSheet()
  }

  get sheetCount(): number {
    return this.sheets.length
  }

  get activeSheet(): Sheet {
    return this.sheets[this.activeIndex]!
  }

  get activeSheetIndex(): number {
    return this.activeIndex
  }

  getSheets(): Sheet[] {
    return [...this.sheets]
  }

  /**
   * 批量结构变更（可嵌套）：beginBatch 后 addSheet / removeSheet / renameSheet /
   * activateSheet 的事件抑制，endBatch 合并补发一次（sheets-change → sheet-rename
   * → active-sheet-change，各自仅在确有变化时补发）。模型状态在 batch 中照常
   * 生效（列表/激活修正/公式联动），只是事件收尾——导入替换 196 sheet 时避免
   * 195 次 sheets-change 事件风暴（vue 层反复重渲染 tabs / pruneCache / bump）。
   */
  beginBatch(): void {
    if (this.batchDepth === 0) {
      this.batchActive = { sheet: this.activeSheet, index: this.activeIndex }
      this.batchSheetsChanged = false
      this.batchRenamed = null
    }
    this.batchDepth++
  }

  endBatch(): void {
    if (this.batchDepth === 0) {
      throw new Error('Workbook.endBatch：没有进行中的批量')
    }
    this.batchDepth--
    if (this.batchDepth > 0) return
    if (this.batchSheetsChanged) {
      this.emitter.emit('sheets-change', { sheets: this.getSheets() })
    }
    if (this.batchRenamed) {
      this.emitter.emit('sheet-rename', this.batchRenamed)
    }
    if (this.batchActive && this.batchActive.sheet !== this.activeSheet) {
      this.emitter.emit('active-sheet-change', { sheet: this.activeSheet, index: this.activeIndex })
    }
    this.batchActive = null
  }

  /** 批量结构变更是否进行中（内部事件抑制判断） */
  private get inBatch(): boolean {
    return this.batchDepth > 0
  }

  getSheet(name: string): Sheet | undefined {
    return this.sheets.find((sheet) => sheet.name === name)
  }

  /** 新增 sheet，名称缺省为 Sheet{n}（保证唯一） */
  addSheet(name?: string): Sheet {
    const sheet = new Sheet(name ?? this.nextDefaultName(), this.formulaGraph)
    this.sheets.push(sheet)
    if (this.inBatch) {
      this.batchSheetsChanged = true
    } else {
      this.emitter.emit('sheets-change', { sheets: this.getSheets() })
    }
    return sheet
  }

  /**
   * 删除 sheet；至少保留一个。删除激活项时激活相邻 sheet；
   * 注销前收集引用该表的公式节点，注销后立即重算——引用方变为 #REF!（不入 undo）。
   */
  removeSheet(name: string): boolean {
    if (this.sheets.length <= 1) return false
    const index = this.sheets.findIndex((sheet) => sheet.name === name)
    if (index < 0) return false
    const [removed] = this.sheets.splice(index, 1)
    // 注销表 + 重算引用方（返回派生补丁，未应用）
    const patches = this.formulaGraph.unregisterSheet(removed!)
    // 派生补丁按目标 sheet 路由应用（同一变更通道；不入 undo 历史）
    const bySheet = new Map<Sheet, CellPatch[]>()
    for (const patch of patches) {
      const target = patch.sheet ?? removed!
      let list = bySheet.get(target)
      if (!list) {
        list = []
        bySheet.set(target, list)
      }
      list.push(patch)
    }
    for (const [sheet, list] of bySheet) sheet.applyDerivedPatches(list)
    // 激活项修正：删除的是激活项之前的项 → 前移；越界（删除末尾）→ 指向新末尾
    if (index < this.activeIndex) {
      this.activeIndex--
    } else if (this.activeIndex >= this.sheets.length) {
      this.activeIndex = this.sheets.length - 1
    }
    if (this.inBatch) {
      this.batchSheetsChanged = true
    } else {
      this.emitter.emit('sheets-change', { sheets: this.getSheets() })
      this.emitter.emit('active-sheet-change', { sheet: this.activeSheet, index: this.activeIndex })
    }
    return true
  }

  /**
   * 重命名 sheet。校验：空名（trim 后）拒绝；与现有表重名拒绝
   * （不区分大小写，含自身大小写变体——与 Excel 一致）。
   * 成功后依赖图按新名重索引：既有跨表公式引用保持有效（跟随改名）；
   * 发 `sheet-rename` 事件（sheets-change 不发——sheet 列表本身未变）。
   */
  renameSheet(oldName: string, newName: string): boolean {
    const next = newName.trim()
    if (next === '') return false
    const index = this.sheets.findIndex((sheet) => sheet.name === oldName)
    if (index < 0) return false
    const sheet = this.sheets[index]!
    const lower = next.toLowerCase()
    if (this.sheets.some((s) => s.name.toLowerCase() === lower)) return false
    sheet.setName(next)
    this.formulaGraph.renameSheet(oldName, next)
    const payload: WorkbookEvents['sheet-rename'] = { sheet, oldName, newName: next }
    if (this.inBatch) {
      this.batchRenamed = payload
    } else {
      this.emitter.emit('sheet-rename', payload)
    }
    return true
  }

  /** 激活指定 sheet */
  activateSheet(name: string): boolean {
    const index = this.sheets.findIndex((sheet) => sheet.name === name)
    if (index < 0 || index === this.activeIndex) return false
    this.activeIndex = index
    if (!this.inBatch) {
      this.emitter.emit('active-sheet-change', { sheet: this.activeSheet, index })
    }
    return true
  }

  on<K extends keyof WorkbookEvents>(
    type: K,
    handler: (payload: WorkbookEvents[K]) => void
  ): () => void {
    return this.emitter.on(type, handler)
  }

  off<K extends keyof WorkbookEvents>(
    type: K,
    handler: (payload: WorkbookEvents[K]) => void
  ): void {
    this.emitter.off(type, handler)
  }

  private nextDefaultName(): string {
    let n = this.sheets.length + 1
    while (this.getSheet(`Sheet${n}`)) n++
    return `Sheet${n}`
  }
}
