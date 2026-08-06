import { describe, expect, it, vi } from 'vitest'

import type { CellAddress } from '../address'
import type { CellData } from '../cell-store'
import { HistoryManager } from '../command/history'
import type { CellPatch, Mutation, Patch, PatchDirection } from '../command/types'

/** 构造一个可区分的 cell 补丁 */
function cellPatch(row: number, before?: CellData, after?: CellData): CellPatch {
  const addr: CellAddress = { row, col: 0 }
  return { kind: 'cell', addr, before, after }
}

/** 单补丁 mutation（undo/redo 共享补丁，方向决定应用哪一侧） */
function mutationOf(...patches: Patch[]): Mutation {
  return { redo: patches, undo: [...patches].reverse() }
}

function createHistory(capacity?: number) {
  const applyPatch = vi.fn<(patch: Patch, direction: PatchDirection) => void>()
  const history = new HistoryManager(applyPatch, capacity)
  return { history, applyPatch }
}

describe('HistoryManager 基本流转', () => {
  it('push → undo 应用 undo 补丁 → redo 应用 redo 补丁', () => {
    const { history, applyPatch } = createHistory()
    const patch = cellPatch(0, undefined, { v: 'x', t: 's' })

    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)

    history.push([mutationOf(patch)])
    expect(history.canUndo).toBe(true)

    expect(history.undo()).toBe(true)
    expect(applyPatch).toHaveBeenLastCalledWith(patch, 'undo')
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(true)

    expect(history.redo()).toBe(true)
    expect(applyPatch).toHaveBeenLastCalledWith(patch, 'redo')
    expect(history.canUndo).toBe(true)
    expect(history.canRedo).toBe(false)
  })

  it('空栈 undo/redo 返回 false，不调用 applyPatch', () => {
    const { history, applyPatch } = createHistory()
    expect(history.undo()).toBe(false)
    expect(history.redo()).toBe(false)
    expect(applyPatch).not.toHaveBeenCalled()
  })

  it('undo 按 entry 逆序、mutation.undo 列表序应用补丁', () => {
    const { history, applyPatch } = createHistory()
    const a = cellPatch(0, undefined, { v: 'a' })
    const b = cellPatch(1, undefined, { v: 'b' })
    const c = cellPatch(2, undefined, { v: 'c' })
    const m1: Mutation = { redo: [a], undo: [a] }
    const m2: Mutation = { redo: [b, c], undo: [c, b] }

    history.push([m1, m2])
    history.undo()

    expect(applyPatch.mock.calls).toEqual([
      [c, 'undo'],
      [b, 'undo'],
      [a, 'undo']
    ])

    applyPatch.mockClear()
    history.redo()
    expect(applyPatch.mock.calls).toEqual([
      [a, 'redo'],
      [b, 'redo'],
      [c, 'redo']
    ])
  })

  it('新命令清空 redo 栈', () => {
    const { history } = createHistory()
    history.push([mutationOf(cellPatch(0, undefined, { v: 'a' }))])
    history.undo()
    expect(history.canRedo).toBe(true)

    history.push([mutationOf(cellPatch(1, undefined, { v: 'b' }))])
    expect(history.canRedo).toBe(false)
    expect(history.redo()).toBe(false)
  })

  it('空 mutation 列表直接忽略', () => {
    const { history } = createHistory()
    history.push([])
    expect(history.canUndo).toBe(false)
  })
})

describe('HistoryManager 容量上限', () => {
  it('超出容量淘汰最旧条目', () => {
    const { history } = createHistory(3)
    for (let i = 0; i < 5; i++) {
      history.push([mutationOf(cellPatch(i, undefined, { v: i }))])
    }
    expect(history.undoSize).toBe(3)

    // 只能 undo 最近 3 条；最旧 2 条已被淘汰
    expect(history.undo()).toBe(true)
    expect(history.undo()).toBe(true)
    expect(history.undo()).toBe(true)
    expect(history.undo()).toBe(false)

    // redo 栈一致性：3 条全部可重做
    expect(history.redoSize).toBe(3)
    expect(history.redo()).toBe(true)
    expect(history.redo()).toBe(true)
    expect(history.redo()).toBe(true)
    expect(history.redo()).toBe(false)
  })
})

describe('HistoryManager 事务', () => {
  it('事务内多次 push 合并为一个 undo 单元', () => {
    const { history, applyPatch } = createHistory()
    const a = cellPatch(0, undefined, { v: 'a' })
    const b = cellPatch(1, undefined, { v: 'b' })

    history.beginTransaction()
    history.push([mutationOf(a)])
    history.push([mutationOf(b)])
    // 提交前不入栈
    expect(history.canUndo).toBe(false)
    history.commit()

    expect(history.undoSize).toBe(1)
    history.undo()
    expect(applyPatch.mock.calls).toEqual([
      [b, 'undo'],
      [a, 'undo']
    ])
  })

  it('嵌套事务拍平到最外层', () => {
    const { history } = createHistory()
    history.beginTransaction()
    history.push([mutationOf(cellPatch(0, undefined, { v: 'a' }))])
    history.beginTransaction()
    history.push([mutationOf(cellPatch(1, undefined, { v: 'b' }))])
    history.commit()
    // 内层 commit 后仍未入栈
    expect(history.canUndo).toBe(false)
    history.commit()

    expect(history.undoSize).toBe(1)
  })

  it('没有进行中事务时 commit 抛错', () => {
    const { history } = createHistory()
    expect(() => history.commit()).toThrow('没有进行中的事务')
  })

  it('rollback 还原缓冲中的变更，不影响 undo/redo 栈', () => {
    const { history, applyPatch } = createHistory()
    const before = cellPatch(0, undefined, { v: 'old' })
    history.push([mutationOf(before)])

    const a = cellPatch(1, undefined, { v: 'a' })
    const b = cellPatch(2, undefined, { v: 'b' })
    history.beginTransaction()
    history.push([mutationOf(a)])
    history.push([mutationOf(b)])
    history.rollback()

    // 缓冲被逆序回放 undo
    expect(applyPatch.mock.calls).toEqual([
      [b, 'undo'],
      [a, 'undo']
    ])
    // 事务已结束，缓冲丢弃；栈中只剩最初一条
    expect(history.inTransaction).toBe(false)
    expect(history.undoSize).toBe(1)
    expect(history.canRedo).toBe(false)
  })

  it('事务进行中 undo/redo 返回 false', () => {
    const { history, applyPatch } = createHistory()
    history.push([mutationOf(cellPatch(0, undefined, { v: 'a' }))])
    history.beginTransaction()
    expect(history.undo()).toBe(false)
    expect(history.redo()).toBe(false)
    history.commit()
    expect(applyPatch).not.toHaveBeenCalled()
  })
})

describe('HistoryManager 事件与清理', () => {
  it('change 事件携带 canUndo/canRedo 状态', () => {
    const { history } = createHistory()
    const handler = vi.fn()
    history.onChange(handler)

    history.push([mutationOf(cellPatch(0, undefined, { v: 'a' }))])
    expect(handler).toHaveBeenLastCalledWith({ canUndo: true, canRedo: false })

    history.undo()
    expect(handler).toHaveBeenLastCalledWith({ canUndo: false, canRedo: true })

    history.redo()
    expect(handler).toHaveBeenLastCalledWith({ canUndo: true, canRedo: false })
  })

  it('clear 清空全部历史与事务', () => {
    const { history } = createHistory()
    history.push([mutationOf(cellPatch(0, undefined, { v: 'a' }))])
    history.undo()
    history.beginTransaction()
    history.push([mutationOf(cellPatch(1, undefined, { v: 'b' }))])

    history.clear()
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
    expect(history.inTransaction).toBe(false)
    // clear 后事务状态已复位，commit 视为无事务
    expect(() => history.commit()).toThrow()
  })
})
