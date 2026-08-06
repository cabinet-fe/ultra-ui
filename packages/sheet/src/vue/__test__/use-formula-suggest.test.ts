import { registerFormulaFunction } from '@veltra/sheet-core/core/formula/functions'
import { describe, expect, it } from 'vitest'

import {
  applySuggest,
  filterFormulaSuggestions,
  FORMULA_SUGGEST_LIMIT,
  formatFunctionSignature,
  getSuggestContext,
  moveSuggestIndex
} from '../use-formula-suggest'

describe('getSuggestContext', () => {
  it('输入 = 后（空前缀）进入补全上下文', () => {
    expect(getSuggestContext('=', 1)).toEqual({ prefix: '', start: 1, end: 1 })
  })

  it('=SU 前缀过滤上下文', () => {
    expect(getSuggestContext('=SU', 3)).toEqual({ prefix: 'SU', start: 1, end: 3 })
  })

  it('运算符 / ( / , 后的 token 可补全', () => {
    expect(getSuggestContext('=1+AB', 5)).toMatchObject({ prefix: 'AB', start: 3 })
    expect(getSuggestContext('=SUM(AV', 7)).toMatchObject({ prefix: 'AV', start: 5 })
    expect(getSuggestContext('=SUM(1,MA', 9)).toMatchObject({ prefix: 'MA', start: 7 })
  })

  it('非触发位置不补全；引用 token 可判定但过滤为空', () => {
    // =A1：token 合法但无匹配函数 → 候选列表不展示（filter 空）
    expect(getSuggestContext('=A1', 3)).toMatchObject({ prefix: 'A1' })
    expect(filterFormulaSuggestions('A1')).toEqual([])
    expect(getSuggestContext('hello', 5)).toBeNull()
    expect(getSuggestContext('=SUM(A1)', 8)).toBeNull()
  })

  it('空前缀仅紧跟 = 时出现（( 后空前缀不弹）', () => {
    expect(getSuggestContext('=SUM(', 5)).toBeNull()
  })

  it('<= / >= 尾随 = 不弹空前缀候选（比较运算符）', () => {
    expect(getSuggestContext('=A1<=', 5)).toBeNull()
    expect(getSuggestContext('=A1>=', 5)).toBeNull()
    // 二元比较 = 后仍可空前缀（=A1=ABS(...)）
    expect(getSuggestContext('=A1=', 4)).toEqual({ prefix: '', start: 4, end: 4 })
  })
})

describe('filterFormulaSuggestions / applySuggest / moveSuggestIndex', () => {
  it('空前缀优先常用函数（含 SUM），至多 10 条；SU 过滤到 SUM', () => {
    const all = filterFormulaSuggestions('')
    expect(all.length).toBeGreaterThan(0)
    expect(all.length).toBeLessThanOrEqual(FORMULA_SUGGEST_LIMIT)
    expect(all[0]!.name).toBe('SUM')
    expect(all.map((s) => s.name)).toContain('SUM')
    const su = filterFormulaSuggestions('SU')
    expect(su.map((s) => s.name)).toEqual(['SUM'])
    expect(su[0]!.signature).toBe(formatFunctionSignature('SUM', su[0]!.params))
  })

  it('无 meta 函数签名仅为名称', () => {
    registerFormulaFunction('__SUGGEST_TMP__', { impl: () => 1 })
    try {
      const hit = filterFormulaSuggestions('__SUGGEST_TMP__')
      expect(hit[0]?.signature).toBe('__SUGGEST_TMP__')
    } finally {
      // 注册表无 unregister：覆盖为无 meta 占位，避免污染后续用例
      registerFormulaFunction('__SUGGEST_TMP__', { impl: () => null })
    }
  })

  it('applySuggest：token → NAME() 且光标入括号', () => {
    const r = applySuggest('=SU', 1, 3, 'SUM')
    expect(r).toEqual({ text: '=SUM()', cursor: 5 })
    const r2 = applySuggest('=1+av', 3, 5, 'AVERAGE')
    expect(r2).toEqual({ text: '=1+AVERAGE()', cursor: 11 })
  })

  it('moveSuggestIndex 循环', () => {
    expect(moveSuggestIndex(0, 3, 1)).toBe(1)
    expect(moveSuggestIndex(2, 3, 1)).toBe(0)
    expect(moveSuggestIndex(0, 3, -1)).toBe(2)
  })
})
