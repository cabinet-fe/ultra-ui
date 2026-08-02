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
}

export class Workbook {
  private sheets: Sheet[] = []
  private activeIndex = 0
  private emitter = new TypedEventEmitter<WorkbookEvents>()
  /** 工作簿级公式依赖图（全部 sheet 共享） */
  readonly formulaGraph = new DependencyGraph()

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

  getSheet(name: string): Sheet | undefined {
    return this.sheets.find((sheet) => sheet.name === name)
  }

  /** 新增 sheet，名称缺省为 Sheet{n}（保证唯一） */
  addSheet(name?: string): Sheet {
    const sheet = new Sheet(name ?? this.nextDefaultName(), this.formulaGraph)
    this.sheets.push(sheet)
    this.emitter.emit('sheets-change', { sheets: this.getSheets() })
    return sheet
  }

  /** 删除 sheet；至少保留一个。删除激活项时激活相邻 sheet */
  removeSheet(name: string): boolean {
    if (this.sheets.length <= 1) return false
    const index = this.sheets.findIndex((sheet) => sheet.name === name)
    if (index < 0) return false
    const [removed] = this.sheets.splice(index, 1)
    this.formulaGraph.unregisterSheet(removed!)
    if (this.activeIndex >= this.sheets.length) {
      this.activeIndex = this.sheets.length - 1
    }
    this.emitter.emit('sheets-change', { sheets: this.getSheets() })
    this.emitter.emit('active-sheet-change', { sheet: this.activeSheet, index: this.activeIndex })
    return true
  }

  /** 激活指定 sheet */
  activateSheet(name: string): boolean {
    const index = this.sheets.findIndex((sheet) => sheet.name === name)
    if (index < 0 || index === this.activeIndex) return false
    this.activeIndex = index
    this.emitter.emit('active-sheet-change', { sheet: this.activeSheet, index })
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
