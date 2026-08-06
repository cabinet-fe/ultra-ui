import { describe, expect, it } from 'vitest'

import { shiftFormulaText } from '../formula/shift'

describe('shiftFormulaText 行插入', () => {
  it('插入点之后的单格引用下移', () => {
    expect(shiftFormulaText('A5+1', 'rows', 2, 3, 'insert').text).toBe('A8+1')
  })

  it('插入点之前的引用不动', () => {
    expect(shiftFormulaText('A1+A2', 'rows', 2, 3, 'insert').text).toBe('A1+A2')
  })

  it('区域整体在插入点下方 → 整体下移', () => {
    expect(shiftFormulaText('SUM(A5:B7)', 'rows', 3, 2, 'insert').text).toBe('SUM(A7:B9)')
  })

  it('插入点位于区域内部 → 区域扩展', () => {
    expect(shiftFormulaText('SUM(A1:B3)', 'rows', 2, 2, 'insert').text).toBe('SUM(A1:B5)')
  })

  it('跨表引用与混合运算保留', () => {
    expect(shiftFormulaText('Sheet2!A5*2+SUM(C1:C3)', 'rows', 2, 1, 'insert').text).toBe(
      'Sheet2!A6*2+SUM(C1:C4)'
    )
  })

  it('绝对引用 $1 不随行平移（行绝对）', () => {
    expect(shiftFormulaText('A$5+1', 'rows', 2, 3, 'insert').text).toBe('A$5+1')
    expect(shiftFormulaText('$A$5+1', 'rows', 2, 3, 'insert').text).toBe('$A$5+1')
  })

  it('列插入不影响行号，$A 列绝对不随列平移', () => {
    expect(shiftFormulaText('C3+D4', 'cols', 2, 2, 'insert').text).toBe('E3+F4')
    expect(shiftFormulaText('$C3+$D4', 'cols', 2, 2, 'insert').text).toBe('$C3+$D4')
  })

  it('表尾插入：引用不动', () => {
    expect(shiftFormulaText('A1', 'rows', 10, 5, 'insert').text).toBe('A1')
  })
})

describe('shiftFormulaText 行删除', () => {
  it('删除区间下方的引用上移', () => {
    expect(shiftFormulaText('A8+1', 'rows', 2, 2, 'delete').text).toBe('A6+1')
  })

  it('单格引用被删除 → broken', () => {
    const r = shiftFormulaText('A3+1', 'rows', 2, 2, 'delete')
    expect(r.broken).toBe(true)
    expect(r.text).toBe('#REF!+1')
  })

  it('删除区间上方的引用不动', () => {
    expect(shiftFormulaText('A1+A2', 'rows', 3, 2, 'delete').text).toBe('A1+A2')
  })

  it('区域完全在删除区间内 → broken', () => {
    const r = shiftFormulaText('SUM(A2:B4)', 'rows', 1, 4, 'delete')
    expect(r.broken).toBe(true)
  })

  it('区域部分被删 → 收缩', () => {
    expect(shiftFormulaText('SUM(A1:B5)', 'rows', 2, 2, 'delete').text).toBe('SUM(A1:B3)')
  })

  it('区域锚点被删 → 收缩（下方行上移填补）', () => {
    expect(shiftFormulaText('SUM(A2:B4)', 'rows', 1, 2, 'delete').text).toBe('SUM(A2:B2)')
  })

  it('区域完全在下方 → 整体上移', () => {
    expect(shiftFormulaText('SUM(A5:B6)', 'rows', 1, 2, 'delete').text).toBe('SUM(A3:B4)')
  })

  it('绝对引用不随删除平移，也不 broken', () => {
    expect(shiftFormulaText('A$3+$A$3', 'rows', 2, 2, 'delete').text).toBe('A$3+$A$3')
  })

  it('跨表 + 混合引用删除', () => {
    const r = shiftFormulaText('Sheet2!A3+SUM(Sheet1!B1:B4)', 'rows', 2, 1, 'delete')
    expect(r.text).toBe('Sheet2!#REF!+SUM(Sheet1!B1:B3)')
    expect(r.broken).toBe(true)
  })

  it('列删除对称语义', () => {
    expect(shiftFormulaText('C3+D4', 'cols', 1, 2, 'delete').text).toBe('#REF!+B4')
    expect(shiftFormulaText('E3:F6', 'cols', 1, 1, 'delete').text).toBe('D3:E6')
  })

  it('非引用内容原样保留（数字精度/运算符）', () => {
    expect(shiftFormulaText('1.5E3+0.1*A2', 'rows', 1, 1, 'insert').text).toBe('1.5E3+0.1*A3')
  })

  it('解析失败的原样返回', () => {
    expect(shiftFormulaText('SUM(', 'rows', 1, 1, 'insert').text).toBe('SUM(')
  })

  it('函数名（引用形态 + 紧跟左括号）不平移', () => {
    // LOG10 命中引用形态（LOG 列 10 行），但后紧跟 '(' 是函数调用，必须原样保留；
    // 括号内真正的引用仍正常平移
    expect(shiftFormulaText('LOG10(A5)', 'rows', 2, 3, 'insert').text).toBe('LOG10(A8)')
    expect(shiftFormulaText('LOG10(A5)', 'rows', 2, 2, 'delete').text).toBe('LOG10(A3)')
    // 无括号的同名标识仍是合法单元格引用，照常平移
    expect(shiftFormulaText('LOG10+1', 'rows', 2, 3, 'insert').text).toBe('LOG13+1')
  })
})
