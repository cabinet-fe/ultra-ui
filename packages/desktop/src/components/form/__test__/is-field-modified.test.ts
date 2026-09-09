import { describe, expect, it } from 'vitest'

import { isFieldModified } from '../is-field-modified'

describe('isFieldModified', () => {
  it('primitive 严格相等视为未变更', () => {
    expect(isFieldModified('a', 'a')).toBe(false)
    expect(isFieldModified(1, 1)).toBe(false)
    expect(isFieldModified(true, true)).toBe(false)
  })

  it('primitive 不等视为已变更', () => {
    expect(isFieldModified('a', 'b')).toBe(true)
    expect(isFieldModified(1, 2)).toBe(true)
    expect(isFieldModified(true, false)).toBe(true)
  })

  it('nullish 空值等价视为未变更', () => {
    expect(isFieldModified(null, undefined)).toBe(false)
    expect(isFieldModified(undefined, '')).toBe(false)
    expect(isFieldModified('', null)).toBe(false)
    expect(isFieldModified(null, null)).toBe(false)
  })

  it('数组与对象按 JSON 深比较', () => {
    expect(isFieldModified([1, 2], [1, 2])).toBe(false)
    expect(isFieldModified([1, 2], [1, 3])).toBe(true)
    expect(isFieldModified({ a: 1 }, { a: 1 })).toBe(false)
    expect(isFieldModified({ a: 1 }, { a: 2 })).toBe(true)
  })

  it('undefined 与有值视为已变更', () => {
    expect(isFieldModified(undefined, 'x')).toBe(true)
    expect(isFieldModified('x', undefined)).toBe(true)
    expect(isFieldModified(null, 'x')).toBe(true)
  })
})
