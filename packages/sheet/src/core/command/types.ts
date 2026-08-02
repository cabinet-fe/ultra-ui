import type { CellAddress, CellRange } from '../address'
import type { CellData } from '../cell-store'
import type { Sheet } from '../sheet'

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

export type Patch = CellPatch | MergePatch

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
