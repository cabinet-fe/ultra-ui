import { describe, expect, it } from 'vitest'

import type { CellAddress } from '../address'
import { Sheet } from '../sheet'

const A1 = { row: 0, col: 0 }

/** 写入公式并读回计算缓存值 */
function calcValue(sheet: Sheet, formula: string, addr: CellAddress = { row: 20, col: 20 }) {
  sheet.setCellFormula(addr, formula)
  return sheet.getCellData(addr)
}

describe('函数集：SUM / AVERAGE / MAX / MIN', () => {
  it('SUM：直接参数求和、数字文本强转、非法文本 #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=SUM(1,2,3)')).toMatchObject({ v: 6 })
    expect(calcValue(sheet, '=SUM("5",3)')).toMatchObject({ v: 8 })
    expect(calcValue(sheet, '=SUM("abc")')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('SUM：区域内文本/布尔忽略，空格按 0', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 2)
    sheet.setCellValue({ row: 1, col: 0 }, 'text')
    sheet.setCellValue({ row: 2, col: 0 }, true)
    expect(calcValue(sheet, '=SUM(A1:A5)')).toMatchObject({ v: 2 })
    // 全空区域 → 0
    expect(calcValue(sheet, '=SUM(C1:C9)')).toMatchObject({ v: 0 })
  })

  it('AVERAGE：均值；无数字 → #DIV/0!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=AVERAGE(2,4)')).toMatchObject({ v: 3 })
    expect(calcValue(sheet, '=AVERAGE(C1:C9)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
    sheet.setCellValue(A1, 2)
    sheet.setCellValue({ row: 1, col: 0 }, 'text')
    // 区域内文本忽略，只按数字格求均值
    expect(calcValue(sheet, '=AVERAGE(A1:A2)')).toMatchObject({ v: 2 })
  })

  it('MAX / MIN：极值；无数字 → 0', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=MAX(1,9,3)')).toMatchObject({ v: 9 })
    expect(calcValue(sheet, '=MIN(1,-9,3)')).toMatchObject({ v: -9 })
    expect(calcValue(sheet, '=MAX(C1:C9)')).toMatchObject({ v: 0 })
    expect(calcValue(sheet, '=MIN(C1:C9)')).toMatchObject({ v: 0 })
  })
})

describe('函数集：COUNT / COUNTA', () => {
  it('COUNT 只数数字（区域内文本/空格不计；直接参数可强转即计）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellValue({ row: 1, col: 0 }, 'text')
    sheet.setCellValue({ row: 2, col: 0 }, true)
    expect(calcValue(sheet, '=COUNT(A1:A5)')).toMatchObject({ v: 1 })
    expect(calcValue(sheet, '=COUNT(1,"x","5",TRUE)')).toMatchObject({ v: 3 })
  })

  it('COUNTA 数非空（文本/布尔/空串结果都计，空格不计）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellValue({ row: 1, col: 0 }, 'text')
    sheet.setCellValue({ row: 2, col: 0 }, true)
    expect(calcValue(sheet, '=COUNTA(A1:A5)')).toMatchObject({ v: 3 })
  })
})

describe('函数集：IF / AND / OR / NOT', () => {
  it('IF：分支选择；缺省 else → FALSE；条件非法 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=IF(1>0,"y","n")')).toMatchObject({ v: 'y' })
    expect(calcValue(sheet, '=IF(0,1,2)')).toMatchObject({ v: 2 })
    expect(calcValue(sheet, '=IF(1=1,7)')).toMatchObject({ v: 7 })
    expect(calcValue(sheet, '=IF(0,7)')).toMatchObject({ v: false, t: 'b' })
    expect(calcValue(sheet, '=IF("abc",1,2)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('IF 惰性求值：未选分支的除零不产生错误', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=IF(FALSE,1/0,2)')).toMatchObject({ v: 2 })
    expect(calcValue(sheet, '=IF(TRUE,1,1/0)')).toMatchObject({ v: 1 })
    // 条件本身是错误则传播
    expect(calcValue(sheet, '=IF(1/0,1,2)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
  })

  it('AND / OR / NOT：布尔逻辑与强转', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=AND(1,TRUE)')).toMatchObject({ v: true })
    expect(calcValue(sheet, '=AND(1,0)')).toMatchObject({ v: false })
    expect(calcValue(sheet, '=OR(0,FALSE)')).toMatchObject({ v: false })
    expect(calcValue(sheet, '=OR(0,1)')).toMatchObject({ v: true })
    expect(calcValue(sheet, '=NOT(0)')).toMatchObject({ v: true })
    expect(calcValue(sheet, '=NOT(TRUE)')).toMatchObject({ v: false })
    // 无有效操作数 / 非法文本 → #VALUE!
    expect(calcValue(sheet, '=AND(C1:C9)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=OR("x")')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=NOT("x")')).toMatchObject({ v: '#VALUE!', t: 'e' })
    // 区域内只取布尔格
    sheet.setCellValue(A1, true)
    sheet.setCellValue({ row: 1, col: 0 }, 5)
    expect(calcValue(sheet, '=AND(A1:A2)')).toMatchObject({ v: true })
  })
})

describe('函数集：ROUND / ABS / CONCATENATE', () => {
  it('ROUND：精度、负数位数、远离零取整', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=ROUND(3.14159,2)')).toMatchObject({ v: 3.14 })
    expect(calcValue(sheet, '=ROUND(2.5,0)')).toMatchObject({ v: 3 })
    expect(calcValue(sheet, '=ROUND(-2.5,0)')).toMatchObject({ v: -3 })
    expect(calcValue(sheet, '=ROUND(1234.567,-2)')).toMatchObject({ v: 1200 })
    // 浮点表示误差补偿（2.675 实际存储为 2.67499…）
    expect(calcValue(sheet, '=ROUND(2.675,2)')).toMatchObject({ v: 2.68 })
  })

  it('ABS：绝对值；非法参数 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=ABS(-3)')).toMatchObject({ v: 3 })
    expect(calcValue(sheet, '=ABS("x")')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('CONCATENATE：文本拼接（数字/布尔强转，区域展开，空格按空串）', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=CONCATENATE("a",1,TRUE)')).toMatchObject({ v: 'a1TRUE' })
    sheet.setCellValue(A1, 'x')
    sheet.setCellValue({ row: 2, col: 0 }, 'z')
    // A2 为空格 → 空串
    expect(calcValue(sheet, '=CONCATENATE(A1:A3)')).toMatchObject({ v: 'xz' })
  })
})

describe('函数集：通用语义', () => {
  it('嵌套函数与多层括号', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellValue({ row: 1, col: 0 }, 2)
    sheet.setCellValue({ row: 2, col: 0 }, 3)
    sheet.setCellValue({ row: 0, col: 1 }, 8)
    sheet.setCellValue({ row: 0, col: 2 }, 4)
    expect(calcValue(sheet, '=SUM(A1:A3, MAX(B1, MIN(C1, 10))) * 2')).toMatchObject({ v: 28 })
    expect(calcValue(sheet, '=((1+2)*(3+4))/(7-2)')).toMatchObject({ v: 4.2 })
  })

  it('参数个数非法 → #VALUE!；未知函数 → #NAME?', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=IF(1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=ROUND(1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=ABS(1,2)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=SUM()')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=NOSUCHFN(1)')).toMatchObject({ v: '#NAME?', t: 'e' })
  })

  it('函数名大小写不敏感', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=sum(1,2)')).toMatchObject({ v: 3 })
    expect(calcValue(sheet, '=If(1,2,3)')).toMatchObject({ v: 2 })
  })

  it('区域内错误值传播', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=1/0')
    sheet.setCellValue({ row: 1, col: 0 }, 5)
    expect(calcValue(sheet, '=SUM(A1:A2)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
  })

  it('稀疏性：大区域内只有少量格参与迭代', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellValue({ row: 9999, col: 0 }, 2)
    // A1:A10000 只有 2 个真实格；结果与迭代规模无关
    expect(sheet.store.size).toBe(2)
    expect(calcValue(sheet, '=SUM(A1:A10000)')).toMatchObject({ v: 3 })
    expect(calcValue(sheet, '=COUNT(A1:A10000)')).toMatchObject({ v: 2 })
    expect(calcValue(sheet, '=AVERAGE(A1:A10000)')).toMatchObject({ v: 1.5 })
  })
})
