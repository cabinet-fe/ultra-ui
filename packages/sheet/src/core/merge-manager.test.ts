import { describe, expect, it } from 'vitest'

import { parseRange } from './address'
import { MergeManager } from './merge-manager'

const B2 = { row: 1, col: 1 }
const C3 = { row: 2, col: 2 }
const A1 = { row: 0, col: 0 }

describe('MergeManager 基本合并', () => {
  it('merge(B2:C3) 后 getCellInfo 三种 kind 区分正确', () => {
    const mgr = new MergeManager()
    mgr.merge(parseRange('B2:C3')!)

    expect(mgr.getCellInfo(B2)).toEqual({
      kind: 'merged-anchor',
      anchor: B2,
      mergeRange: parseRange('B2:C3')!
    })
    expect(mgr.getCellInfo(C3)).toEqual({
      kind: 'merged-covered',
      anchor: B2,
      mergeRange: parseRange('B2:C3')!
    })
    expect(mgr.getCellInfo(A1)).toEqual({ kind: 'normal', anchor: A1 })
  })

  it('resolveAnchor / isCovered / getMergeAt', () => {
    const mgr = new MergeManager()
    mgr.merge(parseRange('B2:C3')!)

    expect(mgr.resolveAnchor(C3)).toEqual(B2)
    expect(mgr.resolveAnchor(B2)).toEqual(B2)
    expect(mgr.resolveAnchor(A1)).toEqual(A1)

    expect(mgr.isCovered(C3)).toBe(true)
    expect(mgr.isCovered(B2)).toBe(false)
    expect(mgr.isMerged(B2)).toBe(true)

    expect(mgr.getMergeAt(C3)).toEqual(parseRange('B2:C3'))
    expect(mgr.getMergeAt(A1)).toBeUndefined()
  })
})

describe('MergeManager 嵌套场景', () => {
  it('已有 B2:C3，再 merge C3:D4 → 旧合并解除，新合并 = 包围盒 B2:D4，锚点 B2', () => {
    const mgr = new MergeManager()
    mgr.merge(parseRange('B2:C3')!)
    const result = mgr.merge(parseRange('C3:D4')!)

    expect(result.range).toEqual(parseRange('B2:D4'))
    expect(result.removed).toEqual([parseRange('B2:C3')])
    expect(mgr.getMerges()).toEqual([parseRange('B2:D4')])

    // 旧区域内所有格都解析到新锚点
    expect(mgr.getCellInfo(B2).kind).toBe('merged-anchor')
    expect(mgr.getCellInfo(C3)).toMatchObject({ kind: 'merged-covered', anchor: B2 })
    expect(mgr.getCellInfo({ row: 3, col: 3 })).toMatchObject({
      kind: 'merged-covered',
      anchor: B2
    })
  })
})

describe('MergeManager 边界', () => {
  it('单行合并与单列合并', () => {
    const mgr = new MergeManager()
    mgr.merge(parseRange('B2:D2')!)
    expect(mgr.getCellInfo({ row: 1, col: 3 })).toMatchObject({
      kind: 'merged-covered',
      anchor: B2
    })

    const mgr2 = new MergeManager()
    mgr2.merge(parseRange('B2:B5')!)
    expect(mgr2.getCellInfo({ row: 4, col: 1 })).toMatchObject({
      kind: 'merged-covered',
      anchor: B2
    })
  })

  it('相邻但不重叠的合并互不影响', () => {
    const mgr = new MergeManager()
    mgr.merge(parseRange('B2:C3')!)
    const result = mgr.merge(parseRange('D2:D3')!)

    expect(result.range).toEqual(parseRange('D2:D3'))
    expect(result.removed).toEqual([])
    expect(mgr.size).toBe(2)
    expect(mgr.getCellInfo({ row: 1, col: 3 })).toMatchObject({
      kind: 'merged-anchor',
      anchor: { row: 1, col: 3 }
    })
    expect(mgr.getCellInfo(B2).kind).toBe('merged-anchor')
  })

  it('unmerge 解除相交合并', () => {
    const mgr = new MergeManager()
    mgr.merge(parseRange('B2:C3')!)
    const removed = mgr.unmerge(parseRange('C3:C3')!)

    expect(removed).toEqual([parseRange('B2:C3')])
    expect(mgr.size).toBe(0)
    expect(mgr.getCellInfo(C3)).toEqual({ kind: 'normal', anchor: C3 })
  })
})
