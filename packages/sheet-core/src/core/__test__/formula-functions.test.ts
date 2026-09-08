import { describe, expect, it } from 'vitest'

import type { CellAddress } from '../address'
import { listFormulaFunctions, registerFormulaFunction } from '../formula/functions'
import { Sheet } from '../sheet'

const A1 = { row: 0, col: 0 }

/** 写入公式并读回计算缓存值 */
function calcValue(sheet: Sheet, formula: string, addr: CellAddress = { row: 20, col: 20 }) {
  sheet.setCellFormula(addr, formula)
  return sheet.getCellData(addr)
}

/** 当天日期的 1900 系统序列数（锚点：spec 给定 serial 45000 = 2023-03-15，与实现独立） */
function todaySerial(): number {
  const now = new Date()
  const days =
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(2023, 2, 15)) /
    86_400_000
  return 45000 + days
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

  it('SUM：UI 数字文本经 setCellValue 规范化后可被区域求和', () => {
    const sheet = new Sheet()
    // 网格/公式栏回写是字符串；setCellValue 应落为 number，否则 SUM 区域忽略文本得 0
    sheet.setCellValue(A1, '1')
    sheet.setCellValue({ row: 0, col: 1 }, '2')
    sheet.setCellValue({ row: 0, col: 2 }, '3')
    expect(sheet.getCellData(A1)).toEqual({ v: 1, t: 'n' })
    expect(calcValue(sheet, '=SUM(A1:C1)')).toMatchObject({ v: 6, t: 'n' })
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

describe('易失性函数：TODAY / NOW / RAND / RANDBETWEEN', () => {
  it('TODAY 返回当天日期的 1900 系统序列数（整数）', () => {
    const sheet = new Sheet()
    const expected = todaySerial()
    const data = calcValue(sheet, '=TODAY()')
    expect(data?.t).toBe('n')
    expect(Number.isInteger(data?.v)).toBe(true)
    // +1 容忍跨午夜执行
    expect([expected, expected + 1]).toContain(data?.v)
  })

  it('NOW 返回当前日期时间序列数（含时间小数部分）', () => {
    const sheet = new Sheet()
    const before = new Date()
    const data = calcValue(sheet, '=NOW()')
    const after = new Date()
    expect(data?.t).toBe('n')
    const v = data?.v as number
    const serial = todaySerial()
    expect([serial, serial + 1]).toContain(Math.floor(v))
    // 小数部分 = 日内时间（秒级容差，容忍求值耗时与跨午夜）
    const dayFraction = (date: Date) =>
      (date.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86_400_000
    const fraction = v - Math.floor(v)
    expect(fraction).toBeGreaterThanOrEqual(dayFraction(before) - 1 / 86_400_000)
    expect(fraction).toBeLessThanOrEqual(dayFraction(after) + 1 / 86_400_000)
  })

  it('RAND 返回 [0, 1) 区间随机数', () => {
    const sheet = new Sheet()
    for (let i = 0; i < 10; i++) {
      const data = calcValue(sheet, '=RAND()', { row: 20, col: 20 + i })
      const v = data?.v as number
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('RANDBETWEEN 返回 [bottom, top] 闭区间整数；非整数参数向零截断', () => {
    const sheet = new Sheet()
    for (let i = 0; i < 20; i++) {
      const v = calcValue(sheet, '=RANDBETWEEN(1,6)', { row: 20, col: 20 + i })?.v as number
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(6)
    }
    expect(calcValue(sheet, '=RANDBETWEEN(5,5)')).toMatchObject({ v: 5 })
    // 1.9/2.1 截断为 [1,2]
    const truncated = calcValue(sheet, '=RANDBETWEEN(1.9,2.1)')?.v as number
    expect([1, 2]).toContain(truncated)
  })

  it('RANDBETWEEN 参数非法按既有错误语义报错', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=RANDBETWEEN("x",5)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    // bottom > top
    expect(calcValue(sheet, '=RANDBETWEEN(6,1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    // 参数个数非法
    expect(calcValue(sheet, '=RANDBETWEEN(1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=RANDBETWEEN(1,2,3)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    // 错误值传播
    expect(calcValue(sheet, '=RANDBETWEEN(1/0,5)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
  })

  it('易失性语义：变更无关单元格后易失性格必刷新，非易失性格不误刷新', () => {
    let volatileCalls = 0
    let plainCalls = 0
    registerFormulaFunction('VOLATILE_COUNT', { volatile: true, impl: () => ++volatileCalls })
    registerFormulaFunction('PLAIN_COUNT', { impl: () => ++plainCalls })
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=VOLATILE_COUNT()')
    expect(volatileCalls).toBe(1)
    // 再写一个非易失性公式：写入本身是单元格变更，易失性格随之刷新一次
    sheet.setCellFormula({ row: 0, col: 1 }, '=PLAIN_COUNT()')
    expect(volatileCalls).toBe(2)
    expect(plainCalls).toBe(1)
    // 变更无关单元格 → 易失性格重新求值，非易失性格不刷新
    sheet.setCellValue({ row: 5, col: 5 }, 42)
    expect(volatileCalls).toBe(3)
    expect(plainCalls).toBe(1)
    expect(sheet.getCellData(A1)).toMatchObject({ v: 3, t: 'n' })
  })

  it('易失性刷新沿依赖图传播给下游公式', () => {
    let calls = 0
    registerFormulaFunction('VOLATILE_PROP', { volatile: true, impl: () => ++calls })
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=VOLATILE_PROP()')
    // 写入 B1 公式本身是单元格变更：A1 刷新为 2，B1 = 4
    sheet.setCellFormula({ row: 0, col: 1 }, '=A1*2')
    expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 4 })
    // 变更无关格：A1 刷新为 3，下游 B1 沿依赖图传播为 6
    sheet.setCellValue({ row: 5, col: 5 }, 42)
    expect(sheet.getCellData(A1)).toMatchObject({ v: 3 })
    expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 6 })
  })

  it('易失性重算的派生补丁并入同一 undo 单元：undo/redo 回放缓存值不重算', () => {
    let calls = 0
    registerFormulaFunction('VOLATILE_UNDO', { volatile: true, impl: () => ++calls })
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=VOLATILE_UNDO()')
    sheet.setCellValue({ row: 1, col: 1 }, 5)
    expect(sheet.getCellData(A1)).toMatchObject({ v: 2 })
    // undo 撤销「写入 B2 + 易失性刷新」整个单元：A1 回放到 1，不重算
    sheet.undo()
    expect(sheet.getCellData(A1)).toMatchObject({ v: 1 })
    expect(calls).toBe(2)
    sheet.redo()
    expect(sheet.getCellData(A1)).toMatchObject({ v: 2 })
    expect(calls).toBe(2)
  })

  it('四个易失性函数经 listFormulaFunctions 可见（fx 公式栏补全自动生效）', () => {
    const names = listFormulaFunctions().map((f) => f.name)
    expect(names).toEqual(expect.arrayContaining(['TODAY', 'NOW', 'RAND', 'RANDBETWEEN']))
    const rand = listFormulaFunctions().find((f) => f.name === 'RANDBETWEEN')
    expect(rand?.params).toEqual(['bottom', 'top'])
  })
})
