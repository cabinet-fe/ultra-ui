import type { CellAddress, CellRange } from '../address'
import type { CellData } from '../cell-store'
import type { SheetImage } from '../image'
import type { Sheet, SheetSnapshot } from '../sheet'

/**
 * 命令系统类型定义（决策 5：命令 + 逆操作补丁）。
 *
 * - 一切模型变更都是 Command，执行时产出 Mutation
 * - Patch 是受影响单元格 / 合并记录的 before/after 差量，不是全量快照
 * - 同一批 Patch 双向回放：redo 方向应用 after，undo 方向应用 before
 */

/** 补丁回放方向 */
export type PatchDirection = 'undo' | 'redo'

/** 单元格数据差量补丁（原始存储语义；undefined = 该侧无此格） */
export interface CellPatch {
  kind: 'cell'
  addr: CellAddress
  /**
   * 目标 sheet（跨表公式重算的派生补丁会落在其它 sheet 上）；
   * 缺省 = 命令所在 sheet。回放时按此字段路由到目标 sheet 的变更通道。
   */
  sheet?: Sheet
  /** 变更前的数据（undefined = 原本为空格） */
  before?: CellData
  /** 变更后的数据（undefined = 变更后为空格） */
  after?: CellData
}

/** 合并记录差量补丁（before/after = 该侧是否存在此合并） */
export interface MergePatch {
  kind: 'merge'
  range: CellRange
  before: boolean
  after: boolean
}

/** 结构变更（行列插入/删除；undo = 反向结构操作，见 Sheet.reverseStructureChange） */
export type StructureChange =
  | { kind: 'insert-rows'; at: number; count: number }
  | { kind: 'delete-rows'; at: number; count: number }
  | { kind: 'insert-cols'; at: number; count: number }
  | { kind: 'delete-cols'; at: number; count: number }

/** 结构变更补丁（redo = 正向结构操作；undo = 反向结构操作） */
export interface StructurePatch {
  kind: 'structure'
  change: StructureChange
  /** 结构操作前的表格尺寸（undo 时精确还原；insert/delete 的尺寸计算不可逆） */
  beforeRows: number
  beforeCols: number
}

/**
 * 整表快照替换补丁（导入 replaceWorkbookWithSnapshots / undo/redo 回放）。
 * 与 cell/merge 差量补丁不同：整表内容一次替换，静默（不发逐格 cell-change），
 * 由调用方按 content-reset 事件全量刷新视图——避免十万级逐格视图同步。
 * 只替换 cells/styles/merges/images/rowStyles/colStyles（含公式图重建）；
 * 冻结/行高/列宽/尺寸/选区保持当前
 * （对齐「冻结与行高/列宽不进 undo」「选区不进 undo」「渲染尺寸不进 undo」约定）。
 */
export interface SnapshotPatch {
  kind: 'snapshot'
  /** 目标快照：redo 应用；mutation.undo 列表里放操作前快照（before） */
  snapshot: SheetSnapshot
}

/**
 * 图片差量补丁（插入 / 删除 / 更新）。
 * before/after = 该侧图片快照（undefined = 无）；更新时两侧均有值。
 * 结构平移在 applyStructureChange 内就地调整锚点（同 merges），被完整删除的图由
 * prepareDeletedImagePatches 捕获进 undo。
 */
export interface ImagePatch {
  kind: 'image'
  id: string
  /** 变更前（undefined = 原本无此图） */
  before?: SheetImage
  /** 变更后（undefined = 变更后无此图） */
  after?: SheetImage
}

/**
 * Cell Meta 差量补丁（按地址 + namespace）。
 * before/after = 该侧 meta 载荷（undefined = 无）；与 CellData 平行，不写入 v/f。
 */
export interface CellMetaPatch {
  kind: 'cell-meta'
  addr: CellAddress
  namespace: string
  /** 变更前（undefined = 原本无此 meta） */
  before?: unknown
  /** 变更后（undefined = 变更后无此 meta） */
  after?: unknown
}

/**
 * 行/列默认样式差量补丁（StyleId 引用同一 styles 池）。
 * before/after = 该侧 StyleId（undefined = 无）。
 */
export interface AxisStylePatch {
  kind: 'axis-style'
  axis: 'row' | 'col'
  index: number
  /** 变更前（undefined = 原本无默认样式） */
  before?: number
  /** 变更后（undefined = 变更后无默认样式） */
  after?: number
}

export type Patch =
  | CellPatch
  | MergePatch
  | StructurePatch
  | SnapshotPatch
  | ImagePatch
  | CellMetaPatch
  | AxisStylePatch

/**
 * 一次命令执行产生的变更单元。
 * `redo` 按列表顺序应用；`undo` 取同一批补丁的逆序（命令实现负责构造，
 * 保证 undo 先撤销后登记的副作用，例如先移除新合并再恢复旧合并）。
 */
export interface Mutation {
  redo: Patch[]
  undo: Patch[]
}

/** 命令执行结果 */
export interface CommandResult<R = unknown> {
  /** 产生的 mutation 列表（空数组 = 无实际变更，不入历史） */
  mutations: Mutation[]
  /** 命令附带返回值（如 MergeCellsCommand 返回最终生效区域） */
  result?: R
}

/** 命令执行上下文 */
export interface CommandContext {
  sheet: Sheet
  /**
   * 应用单个补丁。命令 handler 执行时对 redo 补丁逐项调用；
   * HistoryManager 回放 undo/redo 亦走此路径，保证只有一条变更通道。
   */
  applyPatch(patch: Patch, direction: PatchDirection): void
}

/** 命令：id + handler */
export interface Command<P = unknown, R = unknown> {
  readonly id: string
  handler(ctx: CommandContext, params: P): CommandResult<R> | undefined
}
