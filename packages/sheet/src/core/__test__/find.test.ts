import { describe, expect, it } from 'vitest'

import { findAll, findNext, findPrev } from '../find'
import { Sheet } from '../sheet'

/** A1..C3 铺数据，供查找用例 */
function createSheet() {
  const sheet = new Sheet()
  // A1: hello, B1: hello world, C1: 42
  sheet.setCellValue({ row: 0, col: 0 }, 'hello')
  sheet.setCellValue({ row: 0, col: 1 }, 'hello world')
  sheet.setCellValue({ row: 0, col: 2 }, 42)
  // A2: HELLO（大写）, B2: =A1&"!"（公式，显示值 hello!）
  sheet.setCellValue({ row: 1, col: 0 }, 'HELLO')
  sheet.setCellFormula({ row: 1, col: 1 }, '=A1&"!"')
  return sheet
}

describe('findAll', () => {
  it("包含匹配（默认）：'hello' 命中 A1 / B1 / A2（HELLO 不敏感）/ B1 公式格（显示值 hello!）", () => {
    const sheet = createSheet()
    const matches = findAll(sheet, 'hello')
    expect(matches.map((m) => m.addr)).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 } // 公式格按显示值 hello! 匹配
    ])
  })

  it('数字值按字符串化匹配：42 → A1 显示值 "42"', () => {
    const sheet = createSheet()
    const matches = findAll(sheet, '42')
    expect(matches).toEqual([{ addr: { row: 0, col: 2 }, text: '42' }])
  })

  it("caseSensitive：'HELLO' 大小写敏感只命中 A2；不敏感命中 A1/B1/A2/B1 公式", () => {
    const sheet = createSheet()
    const sensitive = findAll(sheet, 'HELLO', { caseSensitive: true })
    expect(sensitive.map((m) => m.addr)).toEqual([{ row: 1, col: 0 }])

    const insensitive = findAll(sheet, 'HELLO')
    // A1 hello / B1 hello world / A2 HELLO / B1 公式显示值 hello!（大小写不敏感）
    expect(insensitive.map((m) => m.addr)).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 }
    ])
  })

  it("wholeCell 整格匹配：'hello' 命中 A1 与 A2（HELLO 大小写不敏感时整格相等），B1（hello world）不命中", () => {
    const sheet = createSheet()
    const matches = findAll(sheet, 'hello', { wholeCell: true })
    expect(matches.map((m) => m.addr)).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 }
    ])
  })

  it("searchIn formula：按公式原文匹配（不含 '='），显示值不参与", () => {
    const sheet = createSheet()
    // 'A1&' 是公式原文 B1 的子串；显示值 hello! 不含 A1&
    const byFormula = findAll(sheet, 'A1&', { searchIn: 'formula' })
    expect(byFormula).toEqual([{ addr: { row: 1, col: 1 }, text: 'A1&"!"' }])

    // 显示值模式：'A1&' 不命中任何显示值
    const byValue = findAll(sheet, 'A1&')
    expect(byValue).toEqual([])
  })

  it('空关键词 → 空数组；无命中 → 空数组', () => {
    const sheet = createSheet()
    expect(findAll(sheet, '')).toEqual([])
    expect(findAll(sheet, '不存在')).toEqual([])
  })

  it('乱序写入仍按行主序返回（store 按 Map 插入序迭代，findAll 显式排序）', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 5, col: 0 }, 'x') // 先写后面的行
    sheet.setCellValue({ row: 0, col: 1 }, 'x')
    sheet.setCellValue({ row: 2, col: 3 }, 'x')

    const matches = findAll(sheet, 'x')
    expect(matches.map((m) => m.addr)).toEqual([
      { row: 0, col: 1 },
      { row: 2, col: 3 },
      { row: 5, col: 0 }
    ])
  })

  it('合并格只匹配一次（锚点语义，被覆盖格不重复）', () => {
    const sheet = createSheet()
    sheet.mergeCells({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })
    // 合并后锚点 A1 = hello（B1/A2 被清空）；查找 hello 只命中锚点一次
    const matches = findAll(sheet, 'hello')
    expect(matches.map((m) => m.addr)).toEqual([{ row: 0, col: 0 }])
  })
})

describe('findNext / findPrev（行主序、到边界循环）', () => {
  it('findNext 从 from 之后找下一个；到末尾循环回第一个', () => {
    const sheet = createSheet()
    const fromA1 = findNext(sheet, 'hello', { row: 0, col: 0 })
    expect(fromA1?.addr).toEqual({ row: 0, col: 1 }) // B1

    const fromB1 = findNext(sheet, 'hello', { row: 0, col: 1 })
    expect(fromB1?.addr).toEqual({ row: 1, col: 0 }) // A2（HELLO 不敏感）

    // 从最后一个之后 → 循环回第一个
    const wrap = findNext(sheet, 'hello', { row: 1, col: 1 })
    expect(wrap?.addr).toEqual({ row: 0, col: 0 })
  })

  it('findPrev 从 from 之前找上一个；到开头循环回最后一个', () => {
    const sheet = createSheet()
    const fromB1 = findPrev(sheet, 'hello', { row: 0, col: 1 })
    expect(fromB1?.addr).toEqual({ row: 0, col: 0 }) // A1

    // 从第一个之前 → 循环回最后一个
    const wrap = findPrev(sheet, 'hello', { row: 0, col: 0 })
    expect(wrap?.addr).toEqual({ row: 1, col: 1 })
  })

  it('from 不位于命中格时按行主序相对位置判定', () => {
    const sheet = createSheet()
    // from = A2（row 1, col 0）：之后的下一个命中 = B1 公式格
    const next = findNext(sheet, 'hello', { row: 1, col: 0 })
    expect(next?.addr).toEqual({ row: 1, col: 1 })
    // from = C1（row 0, col 2）：之前的上一个命中 = B1
    const prev = findPrev(sheet, 'hello', { row: 0, col: 2 })
    expect(prev?.addr).toEqual({ row: 0, col: 1 })
  })

  it('无命中 → null', () => {
    const sheet = createSheet()
    expect(findNext(sheet, '不存在', { row: 0, col: 0 })).toBeNull()
    expect(findPrev(sheet, '不存在', { row: 0, col: 0 })).toBeNull()
  })

  it('唯一命中时 findNext/findPrev 都返回自身（循环语义）', () => {
    const sheet = createSheet()
    const next = findNext(sheet, '42', { row: 0, col: 0 })
    expect(next?.addr).toEqual({ row: 0, col: 2 })
    const prev = findPrev(sheet, '42', { row: 0, col: 0 })
    expect(prev?.addr).toEqual({ row: 0, col: 2 })
  })
})
