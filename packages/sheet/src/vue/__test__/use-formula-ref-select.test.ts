import { describe, expect, it } from 'vitest'

import { insertRefText, isRefSelectContext } from '../use-formula-ref-select'

describe('isRefSelectContext', () => {
  it('运算符 / ( / , / = 之后可插入引用', () => {
    expect(isRefSelectContext('=', 1)).toBe(true)
    expect(isRefSelectContext('=SUM(', 5)).toBe(true)
    expect(isRefSelectContext('=SUM(A1,', 8)).toBe(true)
    expect(isRefSelectContext('=A1+', 4)).toBe(true)
    expect(isRefSelectContext('=A1-', 4)).toBe(true)
  })

  it('引用中途 / 非公式 / 闭合括号后不可插入', () => {
    expect(isRefSelectContext('=A1', 3)).toBe(false)
    expect(isRefSelectContext('=SUM(A1)', 8)).toBe(false)
    expect(isRefSelectContext('hello', 5)).toBe(false)
    expect(isRefSelectContext('SUM(', 4)).toBe(false)
  })

  it('忽略光标前空白', () => {
    expect(isRefSelectContext('=SUM(  ', 7)).toBe(true)
  })
})

describe('insertRefText', () => {
  it('在光标处插入并移动光标到引用后', () => {
    expect(insertRefText('=SUM(', 5, 'A1:B2')).toEqual({ text: '=SUM(A1:B2', cursor: 10 })
    expect(insertRefText('=A1+', 4, 'B1')).toEqual({ text: '=A1+B1', cursor: 6 })
  })

  it('有选区时覆盖选区', () => {
    expect(insertRefText('=SUM(XX)', 5, 'A1', 7)).toEqual({ text: '=SUM(A1)', cursor: 7 })
  })
})
