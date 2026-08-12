import { describe, expect, it } from 'vitest'

import { aggregateField } from '../aggregate'

describe('aggregateField', () => {
  it('avg 空集返回 undefined，sum 空集仍为 0', () => {
    expect(aggregateField([], 'amount', 'avg')).toBeUndefined()
    expect(aggregateField([], 'amount', 'sum')).toBe(0)
  })

  it('max / min 对数值集求值', () => {
    const rows = [{ amount: 10 }, { amount: 30 }, { amount: 20 }]
    expect(aggregateField(rows, 'amount', 'max')).toBe(30)
    expect(aggregateField(rows, 'amount', 'min')).toBe(10)
  })
})
