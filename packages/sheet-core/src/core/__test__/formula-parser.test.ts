import { describe, expect, it } from 'vitest'

import { parseRange, type CellAddress } from '../address'
import { parseFormula } from '../formula/parser'
import { FormulaParseError } from '../formula/tokenizer'
import { Sheet } from '../sheet'
import { Workbook } from '../workbook'

const A1 = { row: 0, col: 0 }
const B1 = { row: 0, col: 1 }
const B2 = { row: 1, col: 1 }

/** 写入公式并读回 CellData */
function calc(sheet: Sheet, addr: CellAddress, formula: string) {
  sheet.setCellFormula(addr, formula)
  return sheet.getCellData(addr)
}

describe('公式解析：AST 形态', () => {
  it('二元优先级：1+2*3 → 1+(2*3)', () => {
    expect(parseFormula('1+2*3')).toEqual({
      kind: 'binary',
      op: '+',
      left: { kind: 'number', value: 1 },
      right: {
        kind: 'binary',
        op: '*',
        left: { kind: 'number', value: 2 },
        right: { kind: 'number', value: 3 }
      }
    })
  })

  it('括号改变优先级：(1+2)*3', () => {
    const ast = parseFormula('(1+2)*3')
    expect(ast).toMatchObject({ kind: 'binary', op: '*', left: { op: '+' } })
  })

  it('单元格引用 / 区域 / 跨表 / 带引号表名', () => {
    expect(parseFormula('A1')).toEqual({ kind: 'cell', sheet: undefined, addr: A1 })
    expect(parseFormula('A1:B9')).toEqual({
      kind: 'range',
      sheet: undefined,
      range: parseRange('A1:B9')
    })
    expect(parseFormula('Sheet2!A1')).toEqual({ kind: 'cell', sheet: 'Sheet2', addr: A1 })
    expect(parseFormula("'My Sheet'!A1")).toEqual({ kind: 'cell', sheet: 'My Sheet', addr: A1 })
    expect(parseFormula("'S2'!A1:B2")).toEqual({
      kind: 'range',
      sheet: 'S2',
      range: parseRange('A1:B2')
    })
  })

  it('绝对引用 $A$1 等价 A1', () => {
    expect(parseFormula('$A$1')).toEqual({ kind: 'cell', sheet: undefined, addr: A1 })
  })

  it('一元负号紧于幂次（Excel 行为）：-2^2 → (-2)^2', () => {
    const ast = parseFormula('-2^2')
    expect(ast).toMatchObject({
      kind: 'binary',
      op: '^',
      left: { kind: 'unary', op: '-', operand: { kind: 'number', value: 2 } }
    })
  })

  it('幂次右结合：2^3^2 → 2^(3^2)', () => {
    const ast = parseFormula('2^3^2')
    expect(ast).toMatchObject({
      kind: 'binary',
      op: '^',
      left: { kind: 'number', value: 2 },
      right: { kind: 'binary', op: '^' }
    })
  })

  it('百分号后缀与函数调用', () => {
    expect(parseFormula('50%')).toEqual({ kind: 'percent', operand: { kind: 'number', value: 50 } })
    expect(parseFormula('SUM(A1:A10, 2)')).toMatchObject({
      kind: 'call',
      name: 'SUM',
      args: [{ kind: 'range' }, { kind: 'number', value: 2 }]
    })
  })

  it('布尔字面量与未知名称', () => {
    expect(parseFormula('TRUE')).toEqual({ kind: 'boolean', value: true })
    expect(parseFormula('false')).toEqual({ kind: 'boolean', value: false })
    // 列限 3 字母：Sheet2 不是合法单元格引用 → 未知名称节点
    expect(parseFormula('Sheet2')).toEqual({ kind: 'name', name: 'Sheet2' })
  })

  it('非法输入抛 FormulaParseError', () => {
    for (const text of ['1+', 'SUM(A1', '*2', 'A1:', "'OnlyName'", '1 2', '()']) {
      expect(() => parseFormula(text), text).toThrow(FormulaParseError)
    }
    // 含连续点的标识符是合法形态（未知名称），求值为 #NAME? 而非解析失败
    const sheet = new Sheet()
    expect(calc(sheet, A1, '=A1..B2')).toMatchObject({ v: '#NAME?', t: 'e' })
  })
})

describe('公式解析：求值（经 Sheet）', () => {
  it('=1+2*3 → 7；=(1+2)*3 → 9', () => {
    const sheet = new Sheet()
    expect(calc(sheet, A1, '=1+2*3')).toMatchObject({ f: '1+2*3', v: 7, t: 'n' })
    expect(calc(sheet, B1, '=(1+2)*3')).toMatchObject({ v: 9 })
  })

  it('=A1+B2 引用求值；空格按 0', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellValue(B2, 2)
    expect(calc(sheet, B1, '=A1+B2')).toMatchObject({ v: 3 })
    // C1 为空格 → 按 0
    expect(calc(sheet, { row: 0, col: 3 }, '=A1+C1')).toMatchObject({ v: 1 })
  })

  it('=SUM(A1:A10) 区域聚合', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 5)
    sheet.setCellValue({ row: 9, col: 0 }, 7)
    expect(calc(sheet, B1, '=SUM(A1:A10)')).toMatchObject({ v: 12 })
  })

  it('=Sheet2!A1*2 跨表引用', () => {
    const workbook = new Workbook()
    const sheet1 = workbook.activeSheet
    const sheet2 = workbook.addSheet('Sheet2')
    sheet2.setCellValue(A1, 21)
    expect(calc(sheet1, A1, '=Sheet2!A1*2')).toMatchObject({ v: 42 })
  })

  it("='My Sheet'!A1 带引号表名", () => {
    const workbook = new Workbook()
    const sheet1 = workbook.activeSheet
    const named = workbook.addSheet('My Sheet')
    named.setCellValue(A1, 'hello')
    expect(calc(sheet1, A1, "='My Sheet'!A1")).toMatchObject({ v: 'hello', t: 'str' })
  })

  it('幂/一元/百分号/拼接/比较', () => {
    const sheet = new Sheet()
    expect(calc(sheet, A1, '=2^3^2')).toMatchObject({ v: 512 })
    expect(calc(sheet, B1, '=-2^2')).toMatchObject({ v: 4 })
    expect(calc(sheet, { row: 0, col: 2 }, '=10%+1')).toMatchObject({ v: 1.1 })
    expect(calc(sheet, { row: 0, col: 3 }, '="a"&"b"&1')).toMatchObject({ v: 'ab1' })
    expect(calc(sheet, { row: 0, col: 4 }, '=1+1=2')).toMatchObject({ v: true, t: 'b' })
    expect(calc(sheet, { row: 0, col: 5 }, '=2<>2')).toMatchObject({ v: false })
    expect(calc(sheet, { row: 0, col: 6 }, '=TRUE+1')).toMatchObject({ v: 2 })
  })

  it('未知名称 → #NAME?；解析失败 → #ERROR!（f 仍保留原文）', () => {
    const sheet = new Sheet()
    expect(calc(sheet, A1, '=Sheet2')).toMatchObject({ f: 'Sheet2', v: '#NAME?', t: 'e' })
    expect(calc(sheet, B1, '=1+')).toMatchObject({ f: '1+', v: '#ERROR!', t: 'e' })
    expect(calc(sheet, B2, '=SUM(A1')).toMatchObject({ v: '#ERROR!', t: 'e' })
  })
})
