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
  'CONCATENATE',
  'COUNT',
  'COUNTA',
  'IF',
  'MAX',
  'MIN',
  'NOT',
  'OR',
  'ROUND',
  'SUM'
] as const

/** 17 个内置函数的期望分类（spec 锁定清单） */
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
  NOW: '日期与时间'
}

describe('listFormulaFunctions / FormulaFunctionMeta', () => {
  const extras: string[] = []

  afterEach(() => {
    // 测试用临时函数：用空实现覆盖后无法删除 Map 项，改为覆盖成无 meta 的占位再忽略
    for (const name of extras.splice(0)) {
      registerFormulaFunction(name, { impl: () => null, meta: undefined })
    }
  })

  it('枚举含 13 个内置函数，名称升序，均带 params + 中文 description', () => {
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

  it('17 个内置函数分类与 spec 清单一致', () => {
    const list = listFormulaFunctions()
    const byName = new Map(list.map((f) => [f.name, f]))
    for (const [name, category] of Object.entries(BUILTIN_CATEGORIES)) {
      expect(byName.get(name), name).toBeDefined()
      expect(byName.get(name)!.category, name).toBe(category)
    }
  })

  it('无 meta 的第三方函数仅返回空 params / description，category 为 undefined', () => {
    const name = '__META_TEST_FN__'
    extras.push(name)
    registerFormulaFunction(name, { minArgs: 0, impl: () => 1 })
    const item = listFormulaFunctions().find((f) => f.name === name)
    expect(item).toEqual({ name, params: [], description: '', category: undefined })
  })
})
