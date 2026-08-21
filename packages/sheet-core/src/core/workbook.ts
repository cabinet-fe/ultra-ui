import type { CellData, CellValue } from './cell-store'
import { inferCellType, isEmptyCellData } from './cell-store'
import type { SetCellValueItem } from './command/set-cell-value'
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

/**
 * addSheet 初始数据的单元格输入：原始值（string/number/boolean/null）或数据对象
 * （f 为公式原文，不带 '='；不支持 s 样式引用；日期用 `{ v: 序列数, t: 'd' }`，
 * 不支持 Date 对象）。
 */
export type AddSheetCellInput = CellValue | undefined | Omit<CellData, 's'>

/** Workbook.addSheet 的初始数据配置 */
export interface AddSheetOptions {
  /** 初始单元格数据：二维数组，从 A1 起按行列写入。null/undefined/'' 跳过（空单元格不占存储） */
  data?: readonly (readonly AddSheetCellInput[])[]
  /** 初始渲染行数（与数据行数取大；仅传入时校验，非正整数抛错） */
  rows?: number
  /** 初始渲染列数（与数据列数取大；仅传入时校验，非正整数抛错） */
  cols?: number
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

  /**
   * 新增 sheet，名称缺省为 Sheet{n}（保证唯一）。
   *
   * options.data：二维数组初始数据，从 A1 起按行列写入——原始值（string/number/boolean）
   * 按 inferCellType 推断类型；null/undefined/'' 跳过（空单元格不占存储）；对象形式
   * 透传 { v, t, f }（f 为公式原文，不带 '='；公式格可不传 v，写入后立即重算填充缓存，
   * 用户传的 v 会被重算覆盖）。初始数据经一次 setCells 写入（单命令，公式注册进共享
   * 依赖图并立即有计算缓存），随后清空历史——初始数据是基线状态，不进 undo
   * （Excel 模板语义）。
   *
   * options.rows/cols：初始渲染尺寸（高水位），与数据行/列数取大；仅传入时校验，
   * 非正整数（含 NaN、小数、Infinity）抛错。
   *
   * 数据在 sheets-change 事件发出前就位（grid 在事件后构建，直接读模型）。
   */
  addSheet(name?: string, options?: AddSheetOptions): Sheet {
    const optRows = options?.rows
    const optCols = options?.cols
    if (optRows !== undefined && (!Number.isInteger(optRows) || optRows <= 0)) {
      throw new Error(`Workbook.addSheet：options.rows 必须是正整数，收到 ${optRows}`)
    }
    if (optCols !== undefined && (!Number.isInteger(optCols) || optCols <= 0)) {
      throw new Error(`Workbook.addSheet：options.cols 必须是正整数，收到 ${optCols}`)
    }
    const sheet = new Sheet(name ?? this.nextDefaultName(), this.formulaGraph)
    // 初始数据展开为批量写入项（先写数据后发 sheets-change：grid 在事件后直接读模型）
    const data = options?.data
    let dataRows = 0
    let dataCols = 0
    if (data) {
      dataRows = data.length
      const items: SetCellValueItem[] = []
      for (let r = 0; r < data.length; r++) {
        const row = data[r]
        if (!row) continue
        // 空行/宽行也算进列数（对齐 importCsv 的渲染高水位语义）
        dataCols = Math.max(dataCols, row.length)
        for (let c = 0; c < row.length; c++) {
          const input = row[c]
          if (input == null || input === '') continue
          let cellData: Omit<CellData, 's'>
          if (typeof input === 'object') {
            // 数据对象：透传 { v, t, f }；空格（无公式且 v 为空）不占存储
            if (isEmptyCellData(input)) continue
            cellData = { v: input.v, t: input.t, f: input.f }
          } else {
            // 原始值：类型自动推断（对齐 importCsv 的写法）
            const t = inferCellType(input)
            cellData = { v: input, ...(t ? { t } : {}) }
          }
          items.push({ addr: { row: r, col: c }, data: cellData })
        }
      }
      if (items.length > 0) {
        // 一次 setCells = 单命令：公式注册进依赖图 + 立即重算填充缓存
        sheet.setCells(items)
        // 初始数据是基线状态，不进 undo（新表历史本为空，clear 保持为空）
        sheet.history.clear()
      }
    }
    // 渲染尺寸：显式值与数据高水位取大（不进 undo）
    const finalRows = Math.max(optRows ?? 0, dataRows)
    const finalCols = Math.max(optCols ?? 0, dataCols)
    if (finalRows > 0 || finalCols > 0) sheet.ensureTableSize(finalRows, finalCols)
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

  private nextDefaultName(): string {
    let n = this.sheets.length + 1
    while (this.getSheet(`Sheet${n}`)) n++
    return `Sheet${n}`
  }
}
