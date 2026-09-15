import { afterEach, describe, expect, it } from 'vitest'

import {
  getFormulaFunction,
  listFormulaFunctions,
  registerFormulaFunction,
  type FormulaFunctionCategory
} from '../formula/functions'

const BUILTIN_NAMES = [
  'ABS',
  'AND',
  'AVERAGE',
  'CHOOSE',
  'COLUMN',
  'CONCATENATE',
  'COUNT',
  'COUNTA',
  'EXACT',
  'HLOOKUP',
  'IF',
  'INDEX',
  'LEFT',
  'LEN',
  'LOWER',
  'MATCH',
  'MAX',
  'MID',
  'MIN',
  'NOT',
  'OR',
  'REPLACE',
  'RIGHT',
  'ROUND',
  'ROW',
  'SUBSTITUTE',
  'SUM',
  'TRIM',
  'UPPER',
  'VLOOKUP'
] as const

/** 内置函数的期望分类（spec 锁定清单） */
const BUILTIN_CATEGORIES: Record<string, FormulaFunctionCategory> = {
  SUM: '数学',
  ROUND: '数学',
  ABS: '数学',
  RAND: '数学',
  RANDBETWEEN: '数学',
  AVERAGE: '统计',
  MAX: '统计',
  MIN: '统计',
  COUNT: '统计',
  COUNTA: '统计',
  IF: '逻辑',
  AND: '逻辑',
  OR: '逻辑',
  NOT: '逻辑',
  CONCATENATE: '文本',
  TODAY: '日期与时间',
  NOW: '日期与时间',
  // P3：查找与引用 7 个
  VLOOKUP: '查找与引用',
  HLOOKUP: '查找与引用',
  MATCH: '查找与引用',
  INDEX: '查找与引用',
  CHOOSE: '查找与引用',
  ROW: '查找与引用',
  COLUMN: '查找与引用',
  // P3：文本 10 个
  LEN: '文本',
  LEFT: '文本',
  RIGHT: '文本',
  MID: '文本',
  UPPER: '文本',
  LOWER: '文本',
  TRIM: '文本',
  EXACT: '文本',
  SUBSTITUTE: '文本',
  REPLACE: '文本',
  // P2：财务 5 个
  PMT: '财务',
  FV: '财务',
  PV: '财务',
  IPMT: '财务',
  PPMT: '财务',
  // P2：统计 6 个
  COUNTIF: '统计',
  COUNTBLANK: '统计',
  MEDIAN: '统计',
  LARGE: '统计',
  SMALL: '统计',
  RANK: '统计',
  // P2：逻辑 4 个
  IFERROR: '逻辑',
  TRUE: '逻辑',
  FALSE: '逻辑',
  XOR: '逻辑'
}

/** P2 将注册的 15 个函数（PMT 可查 = P2 已落地，全量锁定用例随之激活） */
const P2_NAMES = [
  'PMT',
  'FV',
  'PV',
  'IPMT',
  'PPMT',
  'COUNTIF',
  'COUNTBLANK',
  'MEDIAN',
  'LARGE',
  'SMALL',
  'RANK',
  'IFERROR',
  'TRUE',
  'FALSE',
  'XOR'
] as const

describe('listFormulaFunctions / FormulaFunctionMeta', () => {
  const extras: string[] = []

  afterEach(() => {
    // 测试用临时函数：用空实现覆盖后无法删除 Map 项，改为覆盖成无 meta 的占位再忽略
    for (const name of extras.splice(0)) {
      registerFormulaFunction(name, { impl: () => null, meta: undefined })
    }
  })

  it(`枚举含 ${BUILTIN_NAMES.length} 个内置函数，名称升序，均带 params + 中文 description`, () => {
    const list = listFormulaFunctions()
    const byName = new Map(list.map((f) => [f.name, f]))
    for (const name of BUILTIN_NAMES) {
      const item = byName.get(name)
      expect(item, name).toBeDefined()
      expect(item!.params.length).toBeGreaterThan(0)
      expect(item!.description.length).toBeGreaterThan(0)
      // 中文说明（至少含一个 CJK 字符）
      expect(/[\u4e00-\u9fff]/.test(item!.description)).toBe(true)
    }
    // 内置名称在列表中按字典序
    const builtinInList = list.filter((f) => (BUILTIN_NAMES as readonly string[]).includes(f.name))
    const names = builtinInList.map((f) => f.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it('SUM 元数据签名字段正确', () => {
    const sum = listFormulaFunctions().find((f) => f.name === 'SUM')!
    expect(sum.params).toEqual(['number1', 'number2', '...'])
    expect(sum.description).toBe('求参数之和')
    expect(getFormulaFunction('SUM')?.meta).toEqual({
      params: sum.params,
      description: sum.description,
      category: '数学'
    })
  })

  it(`${Object.keys(BUILTIN_CATEGORIES).length} 个内置函数分类与 spec 清单一致`, () => {
    const list = listFormulaFunctions()
    const byName = new Map(list.map((f) => [f.name, f]))
    for (const [name, category] of Object.entries(BUILTIN_CATEGORIES)) {
      expect(byName.get(name), name).toBeDefined()
      expect(byName.get(name)!.category, name).toBe(category)
    }
  })

  // P2（财务 / 统计 / 逻辑 15 个）落地后自动激活：全量锁定 49 个内置函数。
  // 过滤 '__' 前缀：本文件 afterEach 用无 meta 占位覆盖临时函数后注册表仍留键。
  it.skipIf(!getFormulaFunction('PMT'))('全部 49 个内置函数名称全量锁定', () => {
    const names = listFormulaFunctions()
      .map((f) => f.name)
      .filter((name) => !name.startsWith('__'))
    expect(names).toHaveLength(49)
    expect(new Set(names)).toEqual(new Set([...Object.keys(BUILTIN_CATEGORIES), ...P2_NAMES]))
  })

  it('无 meta 的第三方函数仅返回空 params / description，category 为 undefined', () => {
    const name = '__META_TEST_FN__'
    extras.push(name)
    registerFormulaFunction(name, { minArgs: 0, impl: () => 1 })
    const item = listFormulaFunctions().find((f) => f.name === name)
    expect(item).toEqual({ name, params: [], description: '', category: undefined })
  })
})
