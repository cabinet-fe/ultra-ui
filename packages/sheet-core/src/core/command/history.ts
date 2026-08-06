import { TypedEventEmitter } from '../events'
import type { Mutation, Patch, PatchDirection } from './types'

/**
 * HistoryManager：undo/redo 栈 + 事务。
 *
 * - 一个 undo 单元 = 一次命令（或一次事务）的全部 Mutation
 * - 事务：beginTransaction / commit，支持嵌套（深度计数，拍平到最外层）；
 *   rollback 回滚缓冲区中已应用的变更并放弃事务
 * - 容量上限（默认 200）：超出淘汰最旧条目
 * - 新命令入栈即清空 redo 栈
 */

/** 历史栈容量默认值 */
const DEFAULT_HISTORY_CAPACITY = 200

/** 历史状态（history-change 事件负载） */
export interface HistoryState {
  canUndo: boolean
  canRedo: boolean
}

type HistoryEvents = { change: HistoryState }

/** 一个 undo 单元 = 一组 Mutation */
type HistoryEntry = Mutation[]

export class HistoryManager {
  private undoStack: HistoryEntry[] = []
  private redoStack: HistoryEntry[] = []
  /** 事务深度（>0 表示事务进行中） */
  private transactionDepth = 0
  /** 事务缓冲：commit 时合并为一个 undo 单元 */
  private transactionBuffer: Mutation[] = []
  private emitter = new TypedEventEmitter<HistoryEvents>()

  constructor(
    /** 补丁应用器（由 Sheet 注入，命令执行与回放共用） */
    private readonly applyPatch: (patch: Patch, direction: PatchDirection) => void,
    private readonly capacity: number = DEFAULT_HISTORY_CAPACITY
  ) {}

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /** undo 栈深度（调试/测试用） */
  get undoSize(): number {
    return this.undoStack.length
  }

  /** redo 栈深度（调试/测试用） */
  get redoSize(): number {
    return this.redoStack.length
  }

  /** 是否处于事务中 */
  get inTransaction(): boolean {
    return this.transactionDepth > 0
  }

  /** 命令执行产生的 mutation 入栈（事务中则缓冲）；空列表直接忽略 */
  push(mutations: Mutation[]): void {
    if (mutations.length === 0) return
    if (this.transactionDepth > 0) {
      this.transactionBuffer.push(...mutations)
      return
    }
    this.pushEntry(mutations)
  }

  /** 开启事务（可嵌套，拍平到最外层） */
  beginTransaction(): void {
    this.transactionDepth++
  }

  /** 提交事务：缓冲的 mutation 合并为一个 undo 单元入栈 */
  commit(): void {
    if (this.transactionDepth === 0) {
      throw new Error('HistoryManager.commit：没有进行中的事务')
    }
    this.transactionDepth--
    if (this.transactionDepth === 0 && this.transactionBuffer.length > 0) {
      const entry = this.transactionBuffer
      this.transactionBuffer = []
      this.pushEntry(entry)
    }
  }

  /**
   * 回滚事务：逆序应用缓冲区中各 mutation 的 undo 补丁还原模型，
   * 丢弃缓冲并结束事务（含嵌套）；不动 undo/redo 栈。
   */
  rollback(): void {
    if (this.transactionDepth === 0) return
    const buffer = this.transactionBuffer
    this.transactionBuffer = []
    this.transactionDepth = 0
    for (let i = buffer.length - 1; i >= 0; i--) {
      for (const patch of buffer[i]!.undo) {
        this.applyPatch(patch, 'undo')
      }
    }
  }

  /** 撤销一个单元；事务进行中或栈空时返回 false */
  undo(): boolean {
    if (this.transactionDepth > 0) return false
    const entry = this.undoStack.pop()
    if (!entry) return false
    for (let i = entry.length - 1; i >= 0; i--) {
      for (const patch of entry[i]!.undo) {
        this.applyPatch(patch, 'undo')
      }
    }
    this.redoStack.push(entry)
    this.emitChange()
    return true
  }

  /** 重做一个单元；事务进行中或栈空时返回 false */
  redo(): boolean {
    if (this.transactionDepth > 0) return false
    const entry = this.redoStack.pop()
    if (!entry) return false
    for (const mutation of entry) {
      for (const patch of mutation.redo) {
        this.applyPatch(patch, 'redo')
      }
    }
    this.undoStack.push(entry)
    this.emitChange()
    return true
  }

  /** 清空全部历史（含事务缓冲） */
  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.transactionBuffer = []
    this.transactionDepth = 0
    this.emitChange()
  }

  onChange(handler: (state: HistoryState) => void): () => void {
    return this.emitter.on('change', handler)
  }

  private pushEntry(entry: HistoryEntry): void {
    this.undoStack.push(entry)
    if (this.undoStack.length > this.capacity) {
      // 淘汰最旧条目；redo 栈不受影响（淘汰只发生在 undo 栈底部）
      this.undoStack.shift()
    }
    // 新命令清空 redo 栈
    this.redoStack = []
    this.emitChange()
  }

  private emitChange(): void {
    this.emitter.emit('change', { canUndo: this.canUndo, canRedo: this.canRedo })
  }
}
