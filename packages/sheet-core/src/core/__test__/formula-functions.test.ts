import { $n, n } from '@cat-kit/core'
import { describe, expect, it } from 'vite-plus/test'

import type { CellAddress } from '../address'
import { formulaError, isFormulaErrorCode } from '../formula/errors'
import {
  getFormulaFunction,
  listFormulaFunctions,
  registerFormulaFunction,
  type FormulaEvalContext
} from '../formula/functions'
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

  it('SUM / AVERAGE 精度对齐 $n 且为 number', () => {
    const sheet = new Sheet()
    const sum = calcValue(sheet, '=SUM(0.1,0.2)')
    expect(sum?.v).toBe(0.3)
    expect(typeof sum?.v).toBe('number')
    const avg = calcValue(sheet, '=AVERAGE(0.1,0.2)')
    expect(avg?.v).toBe($n.div($n.plus(0.1, 0.2), 2))
    expect(typeof avg?.v).toBe('number')
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
    expect(calcValue(sheet, '=ROUND(2.675,2)')).toMatchObject({ v: 2.68 })
    const rounded = calcValue(sheet, '=ROUND(1.005,2)')
    expect(rounded?.v).toBe(Number(n(1.005).fixed(2)))
    expect(typeof rounded?.v).toBe('number')
  })

  it('ABS：绝对值；非法参数 → #VALUE!', () => {
    const sheet = new Sheet()
    const abs = calcValue(sheet, '=ABS(-3)')
    expect(abs?.v).toBe(3)
    expect(typeof abs?.v).toBe('number')
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

describe('错误码 #N/A', () => {
  it('可构造、可被 isFormulaErrorCode 识别', () => {
    expect(isFormulaErrorCode('#N/A')).toBe(true)
    const err = formulaError('#N/A')
    expect(err.code).toBe('#N/A')
  })

  it('t="e" 单元格读回还原为 #N/A（引用该格传播 #N/A 而非 #ERROR!）', () => {
    registerFormulaFunction('NA_PROBE', {
      minArgs: 0,
      maxArgs: 0,
      impl: () => formulaError('#N/A')
    })
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=NA_PROBE()')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#N/A', t: 'e' })
    // 读回路径：cellDataToScalar 需经 isFormulaErrorCode 还原为 #N/A，
    // 未收录时会被兜成 #ERROR!
    expect(calcValue(sheet, '=A1')).toMatchObject({ v: '#N/A', t: 'e' })
  })
})

describe('查找与引用函数：VLOOKUP / HLOOKUP', () => {
  /** A1:B4 升序查找表：10→a、20→b、30→c、40→d */
  function setupSortedTable(sheet: Sheet): void {
    for (let i = 0; i < 4; i++) {
      sheet.setCellValue({ row: i, col: 0 }, (i + 1) * 10)
      sheet.setCellValue({ row: i, col: 1 }, 'abcd'[i]!)
    }
  }

  it('近似匹配（第 4 参省略或 TRUE）：升序区域取 ≤ lookup 的最大值', () => {
    const sheet = new Sheet()
    setupSortedTable(sheet)
    expect(calcValue(sheet, '=VLOOKUP(25, A1:B4, 2)')).toMatchObject({ v: 'b' })
    expect(calcValue(sheet, '=VLOOKUP(25, A1:B4, 2, TRUE)')).toMatchObject({ v: 'b' })
    // 恰好相等取自身；大于全部取末项
    expect(calcValue(sheet, '=VLOOKUP(20, A1:B4, 2, TRUE)')).toMatchObject({ v: 'b' })
    expect(calcValue(sheet, '=VLOOKUP(99, A1:B4, 2)')).toMatchObject({ v: 'd' })
  })

  it('近似匹配小于全部值 → #N/A', () => {
    const sheet = new Sheet()
    setupSortedTable(sheet)
    expect(calcValue(sheet, '=VLOOKUP(5, A1:B4, 2)')).toMatchObject({ v: '#N/A', t: 'e' })
    expect(calcValue(sheet, '=HLOOKUP(5, A1:B4, 2)')).toMatchObject({ v: '#N/A', t: 'e' })
  })

  it('精确匹配（FALSE）：文本大小写不敏感；未命中 → #N/A', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 'apple')
    sheet.setCellValue({ row: 0, col: 1 }, 5)
    sheet.setCellValue({ row: 1, col: 0 }, 'banana')
    sheet.setCellValue({ row: 1, col: 1 }, 6)
    expect(calcValue(sheet, '=VLOOKUP("APPLE", A1:B2, 2, FALSE)')).toMatchObject({ v: 5 })
    expect(calcValue(sheet, '=VLOOKUP("zz", A1:B2, 2, FALSE)')).toMatchObject({ v: '#N/A', t: 'e' })
  })

  it('HLOOKUP 按首行匹配，行序号取对应列的值', () => {
    const sheet = new Sheet()
    // 第一行 10/20/30/40，第二行 a/b/c/d
    for (let i = 0; i < 4; i++) {
      sheet.setCellValue({ row: 0, col: i }, (i + 1) * 10)
      sheet.setCellValue({ row: 1, col: i }, 'abcd'[i]!)
    }
    expect(calcValue(sheet, '=HLOOKUP(25, A1:D2, 2)')).toMatchObject({ v: 'b' })
    expect(calcValue(sheet, '=HLOOKUP(30, A1:D2, 2, FALSE)')).toMatchObject({ v: 'c' })
    expect(calcValue(sheet, '=HLOOKUP(31, A1:D2, 2, FALSE)')).toMatchObject({ v: '#N/A', t: 'e' })
  })

  it('列 / 行序号越界 → #REF!；序号 < 1 → #VALUE!', () => {
    const sheet = new Sheet()
    setupSortedTable(sheet)
    expect(calcValue(sheet, '=VLOOKUP(10, A1:B4, 3, FALSE)')).toMatchObject({ v: '#REF!', t: 'e' })
    expect(calcValue(sheet, '=VLOOKUP(10, A1:B4, 0, FALSE)')).toMatchObject({
      v: '#VALUE!',
      t: 'e'
    })
    expect(calcValue(sheet, '=HLOOKUP(10, A1:B4, 5, FALSE)')).toMatchObject({ v: '#REF!', t: 'e' })
  })

  it('非引用区域参数 → #VALUE!；参数个数非法 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=VLOOKUP(1, 2, 1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=VLOOKUP(1, A1:B2)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  // P2 的 IFERROR 落地后自动激活（本阶段先落 VLOOKUP 未命中侧锚点）
  it.skipIf(!getFormulaFunction('IFERROR'))('IFERROR 捕获 VLOOKUP 的 #N/A 并返回替代值', () => {
    const sheet = new Sheet()
    setupSortedTable(sheet)
    expect(calcValue(sheet, '=IFERROR(VLOOKUP(5, A1:B4, 2, FALSE), "none")')).toMatchObject({
      v: 'none'
    })
    expect(calcValue(sheet, '=IFERROR(VLOOKUP(25, A1:B4, 2), -1)')).toMatchObject({ v: 'b' })
  })
})

describe('查找与引用函数：MATCH / INDEX / CHOOSE', () => {
  it('MATCH match_type 1（省略同）：升序取 ≤ lookup 的最大项位置', () => {
    const sheet = new Sheet()
    for (let i = 0; i < 4; i++) sheet.setCellValue({ row: i, col: 0 }, (i + 1) * 10)
    expect(calcValue(sheet, '=MATCH(25, A1:A4)')).toMatchObject({ v: 2 })
    expect(calcValue(sheet, '=MATCH(25, A1:A4, 1)')).toMatchObject({ v: 2 })
    expect(calcValue(sheet, '=MATCH(10, A1:A4, 1)')).toMatchObject({ v: 1 })
    expect(calcValue(sheet, '=MATCH(5, A1:A4, 1)')).toMatchObject({ v: '#N/A', t: 'e' })
  })

  it('MATCH match_type 0：精确匹配，文本不区分大小写；未命中 → #N/A', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 'Apple')
    sheet.setCellValue({ row: 1, col: 0 }, 'banana')
    sheet.setCellValue({ row: 2, col: 0 }, 'Cherry')
    expect(calcValue(sheet, '=MATCH("BANANA", A1:A3, 0)')).toMatchObject({ v: 2 })
    expect(calcValue(sheet, '=MATCH("zz", A1:A3, 0)')).toMatchObject({ v: '#N/A', t: 'e' })
  })

  it('MATCH match_type -1：降序取 ≥ lookup 的最小项位置；单行区域同样支持', () => {
    const sheet = new Sheet()
    // 降序 A1:A4 = 40/30/20/10；单行 C1:F1 = 40/30/20/10
    for (let i = 0; i < 4; i++) {
      sheet.setCellValue({ row: i, col: 0 }, (4 - i) * 10)
      sheet.setCellValue({ row: 0, col: 2 + i }, (4 - i) * 10)
    }
    expect(calcValue(sheet, '=MATCH(25, A1:A4, -1)')).toMatchObject({ v: 2 })
    expect(calcValue(sheet, '=MATCH(40, A1:A4, -1)')).toMatchObject({ v: 1 })
    // lookup 大于全部值 → #N/A；小于全部值取末项
    expect(calcValue(sheet, '=MATCH(50, A1:A4, -1)')).toMatchObject({ v: '#N/A', t: 'e' })
    expect(calcValue(sheet, '=MATCH(5, A1:A4, -1)')).toMatchObject({ v: 4 })
    expect(calcValue(sheet, '=MATCH(25, C1:F1, -1)')).toMatchObject({ v: 2 })
  })

  it('MATCH 二维区域 → #N/A', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellValue({ row: 0, col: 1 }, 2)
    sheet.setCellValue({ row: 1, col: 0 }, 3)
    expect(calcValue(sheet, '=MATCH(1, A1:B2, 0)')).toMatchObject({ v: '#N/A', t: 'e' })
  })

  it('INDEX：1 基行列序号取值；越界 → #REF!', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 'a1')
    sheet.setCellValue({ row: 0, col: 1 }, 'b1')
    sheet.setCellValue({ row: 1, col: 0 }, 'a2')
    sheet.setCellValue({ row: 1, col: 1 }, 'b2')
    expect(calcValue(sheet, '=INDEX(A1:B2, 2, 1)')).toMatchObject({ v: 'a2' })
    expect(calcValue(sheet, '=INDEX(A1:B2, 1, 2)')).toMatchObject({ v: 'b1' })
    // 单列区域省略列序号；单行区域的 row_num 实为列序号（Excel 语义）
    expect(calcValue(sheet, '=INDEX(A1:A2, 2)')).toMatchObject({ v: 'a2' })
    expect(calcValue(sheet, '=INDEX(A1:B1, 2)')).toMatchObject({ v: 'b1' })
    expect(calcValue(sheet, '=INDEX(A1:B2, 3, 1)')).toMatchObject({ v: '#REF!', t: 'e' })
    expect(calcValue(sheet, '=INDEX(A1:B2, 1, 3)')).toMatchObject({ v: '#REF!', t: 'e' })
    expect(calcValue(sheet, '=INDEX(A1:B2, 2, 2)')).toMatchObject({ v: 'b2' })
    // 取到空格 → 0（空格参与引用的既有语义；C 列未写值）
    expect(calcValue(sheet, '=INDEX(A1:C2, 2, 3)')).toMatchObject({ v: 0 })
  })

  it('CHOOSE：1 基序号选参；越界 → #VALUE!；未选参数不求值', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=CHOOSE(2, "a", "b", "c")')).toMatchObject({ v: 'b' })
    expect(calcValue(sheet, '=CHOOSE(1, 5, 1/0)')).toMatchObject({ v: 5 })
    expect(calcValue(sheet, '=CHOOSE(4, "a", "b")')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=CHOOSE(0, "a", "b")')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=CHOOSE("x", "a", "b")')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('查找与引用函数：ROW / COLUMN', () => {
  it('省略参数返回公式所在格行 / 列号（1 基）', () => {
    const sheet = new Sheet()
    // calcValue 默认写入 { row: 20, col: 20 }（U21）
    expect(calcValue(sheet, '=ROW()')).toMatchObject({ v: 21 })
    expect(calcValue(sheet, '=COLUMN()')).toMatchObject({ v: 21 })
    expect(calcValue(sheet, '=ROW()', { row: 0, col: 2 })).toMatchObject({ v: 1 })
    expect(calcValue(sheet, '=COLUMN()', { row: 0, col: 2 })).toMatchObject({ v: 3 })
  })

  it('引用参数返回起始格行 / 列号；区域取左上角', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=ROW(B5)')).toMatchObject({ v: 5 })
    expect(calcValue(sheet, '=COLUMN(C2)')).toMatchObject({ v: 3 })
    expect(calcValue(sheet, '=ROW(B2:C9)')).toMatchObject({ v: 2 })
    expect(calcValue(sheet, '=COLUMN(B2:C9)')).toMatchObject({ v: 2 })
  })

  it('非引用参数 → #VALUE!；参数个数非法 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=ROW(1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=COLUMN("x")')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=ROW(A1, A2)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('文本函数：LEN / LEFT / RIGHT / MID', () => {
  it('LEN：字符个数（数字强转文本）；数组参数 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=LEN("hello")')).toMatchObject({ v: 5 })
    expect(calcValue(sheet, '=LEN(123)')).toMatchObject({ v: 3 })
    expect(calcValue(sheet, '=LEN("")')).toMatchObject({ v: 0 })
    expect(calcValue(sheet, '=LEN(A1:B2)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('LEFT / RIGHT：省略份数取 1 个；份数为负 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=LEFT("abcdef")')).toMatchObject({ v: 'a' })
    expect(calcValue(sheet, '=LEFT("abcdef", 3)')).toMatchObject({ v: 'abc' })
    expect(calcValue(sheet, '=LEFT("abc", 9)')).toMatchObject({ v: 'abc' })
    expect(calcValue(sheet, '=RIGHT("abcdef")')).toMatchObject({ v: 'f' })
    expect(calcValue(sheet, '=RIGHT("abcdef", 2)')).toMatchObject({ v: 'ef' })
    expect(calcValue(sheet, '=LEFT("abc", -1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=RIGHT("abc", -1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('MID：按位置取子串；start < 1 或份数为负 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=MID("abcdef", 2, 3)')).toMatchObject({ v: 'bcd' })
    expect(calcValue(sheet, '=MID("abcdef", 5, 9)')).toMatchObject({ v: 'ef' })
    expect(calcValue(sheet, '=MID("abc", 0, 2)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=MID("abc", 2, -1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('文本函数：UPPER / LOWER / TRIM / EXACT', () => {
  it('UPPER / LOWER：大小写转换；错误传播、数组参数 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=UPPER("aBc")')).toMatchObject({ v: 'ABC' })
    expect(calcValue(sheet, '=LOWER("aBc")')).toMatchObject({ v: 'abc' })
    expect(calcValue(sheet, '=UPPER(1/0)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
    expect(calcValue(sheet, '=LOWER(A1:B2)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('TRIM：去首尾空格并将内部连续空格压缩为一个；错误传播', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=TRIM("  a   b  ")')).toMatchObject({ v: 'a b' })
    expect(calcValue(sheet, '=TRIM("a")')).toMatchObject({ v: 'a' })
    expect(calcValue(sheet, '=TRIM("   ")')).toMatchObject({ v: '' })
    expect(calcValue(sheet, '=TRIM(1/0)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
  })

  it('EXACT：区分大小写比较；数组参数 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=EXACT("abc", "abc")')).toMatchObject({ v: true, t: 'b' })
    expect(calcValue(sheet, '=EXACT("abc", "ABC")')).toMatchObject({ v: false, t: 'b' })
    expect(calcValue(sheet, '=EXACT("1", 1)')).toMatchObject({ v: true, t: 'b' })
    expect(calcValue(sheet, '=EXACT(A1:B2, "a")')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('文本函数：SUBSTITUTE / REPLACE', () => {
  it('SUBSTITUTE：省略第 4 参替换全部；指定则只替换第 n 次出现', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=SUBSTITUTE("a-b-c", "-", "+")')).toMatchObject({ v: 'a+b+c' })
    expect(calcValue(sheet, '=SUBSTITUTE("a-b-c", "-", "+", 2)')).toMatchObject({ v: 'a-b+c' })
    // 出现次数不足 → 原样返回
    expect(calcValue(sheet, '=SUBSTITUTE("a-b-c", "-", "+", 5)')).toMatchObject({ v: 'a-b-c' })
    expect(calcValue(sheet, '=SUBSTITUTE("abc", "", "x")')).toMatchObject({ v: 'abc' })
    expect(calcValue(sheet, '=SUBSTITUTE("a-b", "-", "+", 0)')).toMatchObject({
      v: '#VALUE!',
      t: 'e'
    })
  })

  it('REPLACE：按 start_num / num_chars 字符位置替换', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=REPLACE("abcdef", 2, 3, "xy")')).toMatchObject({ v: 'axyef' })
    expect(calcValue(sheet, '=REPLACE("abc", 1, 0, "z")')).toMatchObject({ v: 'zabc' })
    expect(calcValue(sheet, '=REPLACE("abc", 0, 1, "z")')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=REPLACE("abc", 2, -1, "z")')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('函数集：财务 PMT / FV / PV', () => {
  it('PMT：等额年金付款额（rate=0 直除、type / fv 变体）', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=PMT(0,10,1000)')).toMatchObject({ v: -100, t: 'n' })
    // rate=0.5、2 期、pv=3：factor=2.25 → -(3×2.25)×0.5/1.25 = -2.7
    expect(calcValue(sheet, '=PMT(0.5,2,3)')).toMatchObject({ v: -2.7, t: 'n' })
    // 期初付款再除以 (1+rate)；fv 参与分子
    expect(calcValue(sheet, '=PMT(0.5,2,3,0,1)')).toMatchObject({ v: -1.8, t: 'n' })
    expect(calcValue(sheet, '=PMT(0.5,2,3,2)')).toMatchObject({ v: -3.5, t: 'n' })
  })

  it('PMT：期数为 0 → #DIV/0!；非法参数 / 个数 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=PMT(0.1,0,1000)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
    expect(calcValue(sheet, '=PMT(0,0,1000)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
    expect(calcValue(sheet, '=PMT("x",1,1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=PMT(0.1,2)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=PMT(0.1,2,1,0,0,1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('FV / PV：与 PMT 互为逆运算；非法参数 → #VALUE!', () => {
    const sheet = new Sheet()
    // FV(0.5,2,-2.7,3) = 0：按 PMT(0.5,2,3) 还款后贷款恰好清零
    expect(calcValue(sheet, '=FV(0.5,2,-2.7,3)')).toMatchObject({ v: 0, t: 'n' })
    expect(calcValue(sheet, '=FV(0,4,-100,-500)')).toMatchObject({ v: 900, t: 'n' })
    expect(calcValue(sheet, '=PV(0.5,2,-2.7)')).toMatchObject({ v: 3, t: 'n' })
    expect(calcValue(sheet, '=PV(0,4,-100,-500)')).toMatchObject({ v: 900, t: 'n' })
    expect(calcValue(sheet, '=FV("x",1,1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=PV("x",1,1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('函数集：财务 IPMT / PPMT', () => {
  it('IPMT / PPMT：利息与本金拆分，两期本金之和 = 本金', () => {
    const sheet = new Sheet()
    // 第 1 期利息 = -pv×rate；第 2 期 = 期初余额 1.8 × 0.5
    expect(calcValue(sheet, '=IPMT(0.5,1,2,3)')).toMatchObject({ v: -1.5, t: 'n' })
    expect(calcValue(sheet, '=IPMT(0.5,2,2,3)')).toMatchObject({ v: -0.9, t: 'n' })
    expect(calcValue(sheet, '=PPMT(0.5,1,2,3)')).toMatchObject({ v: -1.2, t: 'n' })
    expect(calcValue(sheet, '=PPMT(0.5,2,2,3)')).toMatchObject({ v: -1.8, t: 'n' })
    expect(calcValue(sheet, '=IPMT(0.5,1,2,3)+IPMT(0.5,2,2,3)')).toMatchObject({ v: -2.4, t: 'n' })
    expect(calcValue(sheet, '=PPMT(0.5,1,2,3)+PPMT(0.5,2,2,3)')).toMatchObject({ v: -3, t: 'n' })
    // 期初付款：第 1 期无利息，第 2 期利息按未抵扣余额计
    expect(calcValue(sheet, '=IPMT(0.5,1,2,3,0,1)')).toMatchObject({ v: 0, t: 'n' })
    expect(calcValue(sheet, '=IPMT(0.5,2,2,3,0,1)')).toMatchObject({ v: -1.5, t: 'n' })
  })

  it('IPMT / PPMT：per 越界 / 非法参数 / 个数 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=IPMT(0.5,3,2,3)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=IPMT(0.5,0,2,3)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=PPMT(0.5,3,2,3)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=IPMT(0.5,1,2,"x")')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=PPMT(0.5,1,2)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('函数集：COUNTIF / COUNTBLANK', () => {
  it('COUNTIF：六种前缀与裸值（数值按数值比较）', () => {
    const sheet = new Sheet()
    for (let i = 0; i < 5; i++) sheet.setCellValue({ row: i, col: 0 }, i + 1)
    expect(calcValue(sheet, '=COUNTIF(A1:A5,">3")')).toMatchObject({ v: 2, t: 'n' })
    expect(calcValue(sheet, '=COUNTIF(A1:A5,">=3")')).toMatchObject({ v: 3, t: 'n' })
    expect(calcValue(sheet, '=COUNTIF(A1:A5,"<3")')).toMatchObject({ v: 2, t: 'n' })
    expect(calcValue(sheet, '=COUNTIF(A1:A5,"<=3")')).toMatchObject({ v: 3, t: 'n' })
    expect(calcValue(sheet, '=COUNTIF(A1:A5,"<>3")')).toMatchObject({ v: 4, t: 'n' })
    expect(calcValue(sheet, '=COUNTIF(A1:A5,"=3")')).toMatchObject({ v: 1, t: 'n' })
    expect(calcValue(sheet, '=COUNTIF(A1:A5,3)')).toMatchObject({ v: 1, t: 'n' })
  })

  it('COUNTIF：文本相等不区分大小写；直接引用参数', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 'Apple')
    sheet.setCellValue({ row: 1, col: 0 }, 'banana')
    sheet.setCellValue({ row: 2, col: 0 }, 'APPLE')
    expect(calcValue(sheet, '=COUNTIF(A1:A3,"apple")')).toMatchObject({ v: 2, t: 'n' })
    expect(calcValue(sheet, '=COUNTIF(A1:A3,"<>apple")')).toMatchObject({ v: 1, t: 'n' })
    sheet.setCellValue({ row: 0, col: 1 }, 5)
    expect(calcValue(sheet, '=COUNTIF(B1,5)')).toMatchObject({ v: 1, t: 'n' })
    expect(calcValue(sheet, '=COUNTIF(B1,6)')).toMatchObject({ v: 0, t: 'n' })
  })

  it('COUNTIF：criteria 错误传播；区域内错误格不计数', () => {
    const sheet = new Sheet()
    for (let i = 0; i < 3; i++) sheet.setCellValue({ row: i, col: 0 }, i + 1)
    sheet.setCellFormula({ row: 3, col: 0 }, '=1/0')
    expect(calcValue(sheet, '=COUNTIF(A1:A4,">1")')).toMatchObject({ v: 2, t: 'n' })
    expect(calcValue(sheet, '=COUNTIF(A1:A4,1/0)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
  })

  it('COUNTBLANK：区域空白 = 几何边界 - 非空白格；单格与非引用参数', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellValue({ row: 2, col: 0 }, 'x')
    expect(calcValue(sheet, '=COUNTBLANK(A1:A5)')).toMatchObject({ v: 3, t: 'n' })
    expect(calcValue(sheet, '=COUNTBLANK(C1:C9)')).toMatchObject({ v: 9, t: 'n' })
    expect(calcValue(sheet, '=COUNTBLANK(C1)')).toMatchObject({ v: 1, t: 'n' })
    expect(calcValue(sheet, '=COUNTBLANK(5)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('函数集：MEDIAN / LARGE / SMALL / RANK', () => {
  it('MEDIAN：奇数个取中位数、偶数个取中间均值；区域只取数字格', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=MEDIAN(1,2,3)')).toMatchObject({ v: 2, t: 'n' })
    expect(calcValue(sheet, '=MEDIAN(1,2,3,4)')).toMatchObject({ v: 2.5, t: 'n' })
    sheet.setCellValue(A1, 5)
    sheet.setCellValue({ row: 1, col: 0 }, 1)
    sheet.setCellValue({ row: 2, col: 0 }, 3)
    expect(calcValue(sheet, '=MEDIAN(A1:A3)')).toMatchObject({ v: 3, t: 'n' })
  })

  it('MEDIAN：空集 / 非法参数 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=MEDIAN(C1:C9)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=MEDIAN("x")')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('LARGE / SMALL：第 k 个极值；k 越界与空集 → #VALUE!', () => {
    const sheet = new Sheet()
    for (let i = 0; i < 5; i++) sheet.setCellValue({ row: i, col: 0 }, i + 1)
    expect(calcValue(sheet, '=LARGE(A1:A5,1)')).toMatchObject({ v: 5, t: 'n' })
    expect(calcValue(sheet, '=LARGE(A1:A5,2)')).toMatchObject({ v: 4, t: 'n' })
    expect(calcValue(sheet, '=SMALL(A1:A5,2)')).toMatchObject({ v: 2, t: 'n' })
    expect(calcValue(sheet, '=LARGE(A1:A5,0)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=LARGE(A1:A5,6)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=SMALL(C1:C9,1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=LARGE(A1:A5,"x")')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('RANK：缺省降序 / order 升序、同值同名次、直接引用；未命中 → #N/A', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 10)
    sheet.setCellValue({ row: 1, col: 0 }, 30)
    sheet.setCellValue({ row: 2, col: 0 }, 20)
    expect(calcValue(sheet, '=RANK(30,A1:A3)')).toMatchObject({ v: 1, t: 'n' })
    expect(calcValue(sheet, '=RANK(10,A1:A3)')).toMatchObject({ v: 3, t: 'n' })
    expect(calcValue(sheet, '=RANK(20,A1:A3,1)')).toMatchObject({ v: 2, t: 'n' })
    sheet.setCellValue({ row: 0, col: 1 }, 30)
    expect(calcValue(sheet, '=RANK(30,B1)')).toMatchObject({ v: 1, t: 'n' })
    // 同值同名次：20、20、10 → 20 并列第 1，10 为第 3
    sheet.setCellValue({ row: 0, col: 2 }, 20)
    sheet.setCellValue({ row: 1, col: 2 }, 20)
    sheet.setCellValue({ row: 2, col: 2 }, 10)
    expect(calcValue(sheet, '=RANK(20,C1:C3)')).toMatchObject({ v: 1, t: 'n' })
    expect(calcValue(sheet, '=RANK(10,C1:C3)')).toMatchObject({ v: 3, t: 'n' })
    expect(calcValue(sheet, '=RANK(99,A1:A3)')).toMatchObject({ v: '#N/A', t: 'e' })
    expect(calcValue(sheet, '=RANK("x",A1:A3)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('函数集：IFERROR / TRUE / FALSE / XOR', () => {
  it('IFERROR：任意错误（含 #N/A）→ 替代值，正常值原样返回', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=IFERROR(1/0,"err")')).toMatchObject({ v: 'err', t: 'str' })
    expect(calcValue(sheet, '=IFERROR(5,"err")')).toMatchObject({ v: 5, t: 'n' })
    expect(calcValue(sheet, '=IFERROR("ok",1)')).toMatchObject({ v: 'ok', t: 'str' })
    // #N/A 同样被捕获（RANK 未命中）
    sheet.setCellValue({ row: 0, col: 1 }, 1)
    expect(calcValue(sheet, '=IFERROR(RANK(99,B1:B1),"未命中")')).toMatchObject({
      v: '未命中',
      t: 'str'
    })
    // 替代值本身为错误则按错误返回
    expect(calcValue(sheet, '=IFERROR(1/0,2/0)')).toMatchObject({ v: '#DIV/0!', t: 'e' })
    expect(calcValue(sheet, '=IFERROR(1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('TRUE / FALSE：零参返回逻辑值；带参 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=TRUE()')).toMatchObject({ v: true, t: 'b' })
    expect(calcValue(sheet, '=FALSE()')).toMatchObject({ v: false, t: 'b' })
    expect(calcValue(sheet, '=TRUE(1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=FALSE(1)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })

  it('XOR：真值个数为奇数 → TRUE；区域只取布尔格；无有效操作数 → #VALUE!', () => {
    const sheet = new Sheet()
    expect(calcValue(sheet, '=XOR(TRUE,FALSE)')).toMatchObject({ v: true, t: 'b' })
    expect(calcValue(sheet, '=XOR(TRUE,TRUE)')).toMatchObject({ v: false, t: 'b' })
    expect(calcValue(sheet, '=XOR(TRUE,TRUE,TRUE)')).toMatchObject({ v: true, t: 'b' })
    sheet.setCellValue(A1, true)
    sheet.setCellValue({ row: 1, col: 0 }, true)
    sheet.setCellValue({ row: 2, col: 0 }, false)
    expect(calcValue(sheet, '=XOR(A1:A3)')).toMatchObject({ v: false, t: 'b' })
    expect(calcValue(sheet, '=XOR("x")')).toMatchObject({ v: '#VALUE!', t: 'e' })
    expect(calcValue(sheet, '=XOR(C1:C9)')).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('求值上下文：公式所在格地址', () => {
  it('normal / lazy 实现均能读到 ctx.currentCell 与 ctx.currentSheet', () => {
    const seen: Array<Partial<Pick<FormulaEvalContext, 'currentSheet' | 'currentCell'>>> = []
    registerFormulaFunction('CTX_PROBE', {
      minArgs: 0,
      maxArgs: 0,
      impl: (_args, ctx) => {
        seen.push({ currentSheet: ctx?.currentSheet, currentCell: ctx?.currentCell })
        return 1
      }
    })
    registerFormulaFunction('CTX_PROBE_LAZY', {
      kind: 'lazy',
      minArgs: 0,
      maxArgs: 0,
      impl: (_nodes, _evalNode, ctx) => {
        seen.push({ currentSheet: ctx?.currentSheet, currentCell: ctx?.currentCell })
        return 1
      }
    })
    const sheet = new Sheet('CtxSheet')
    sheet.setCellFormula({ row: 3, col: 5 }, '=CTX_PROBE()')
    sheet.setCellFormula({ row: 4, col: 5 }, '=CTX_PROBE_LAZY()')
    expect(seen[0]).toEqual({ currentSheet: 'CtxSheet', currentCell: { row: 3, col: 5 } })
    expect(seen[1]).toEqual({ currentSheet: 'CtxSheet', currentCell: { row: 4, col: 5 } })
  })
})
