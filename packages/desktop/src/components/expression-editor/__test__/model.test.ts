import { describe, expect, it } from 'vitest'

import { normalize, parse, serialize, splitAt, type Doc } from '../core/model'

function roundTrip(input: string): string {
  return serialize(parse(input))
}

describe('parse / serialize round-trip', () => {
  it('round-trips empty string', () => {
    expect(roundTrip('')).toBe('')
  })

  it('round-trips plain text without variables', () => {
    expect(roundTrip('hello')).toBe('hello')
  })

  it('round-trips a single variable', () => {
    expect(roundTrip('{a}')).toBe('{a}')
  })

  it('round-trips text with one variable in middle', () => {
    expect(roundTrip('hello{foo}world')).toBe('hello{foo}world')
  })

  it('round-trips text with prefix and suffix around a variable', () => {
    expect(roundTrip('prefix{a}suffix')).toBe('prefix{a}suffix')
  })

  it('round-trips adjacent variables', () => {
    expect(roundTrip('{a}{b}')).toBe('{a}{b}')
  })

  it('preserves text containing an unclosed brace as plain text', () => {
    expect(roundTrip('hello{unclosed')).toBe('hello{unclosed')
  })

  it('round-trips multi-line content with variables', () => {
    const input = '行一{form.user.name}\n行二{form.company.name}\n行三'
    expect(roundTrip(input)).toBe(input)
  })

  it('round-trips with dotted variable paths', () => {
    expect(roundTrip('你好{form.user.name}')).toBe('你好{form.user.name}')
  })
})

describe('parse with variableMap fills label/type', () => {
  it('attaches label/type from map for known variables', () => {
    const map = new Map([
      ['form.user.name', { label: '用户姓名', value: 'form.user.name', type: 'string' }]
    ])
    const doc = parse('{form.user.name}', map)
    expect(doc).toEqual([
      { kind: 'var', value: 'form.user.name', label: '用户姓名', type: 'string' }
    ])
  })

  it('falls back to value when not found in map', () => {
    const doc = parse('{unknown}')
    expect(doc).toEqual([{ kind: 'var', value: 'unknown', label: 'unknown' }])
  })
})

describe('normalize', () => {
  it('merges adjacent text segments', () => {
    const doc: Doc = [
      { kind: 'text', value: 'a' },
      { kind: 'text', value: 'b' },
      { kind: 'text', value: 'c' }
    ]
    expect(normalize(doc)).toEqual([{ kind: 'text', value: 'abc' }])
  })

  it('drops empty text segments', () => {
    const doc: Doc = [
      { kind: 'text', value: '' },
      { kind: 'var', value: 'x', label: 'X' },
      { kind: 'text', value: '' }
    ]
    expect(normalize(doc)).toEqual([{ kind: 'var', value: 'x', label: 'X' }])
  })

  it('keeps a single text segment as is', () => {
    const doc: Doc = [{ kind: 'text', value: 'hi' }]
    expect(normalize(doc)).toEqual([{ kind: 'text', value: 'hi' }])
  })
})

describe('splitAt', () => {
  it('splits inside a text segment', () => {
    const doc = parse('hello world')
    const { before, after } = splitAt(doc, 5)
    expect(before).toEqual([{ kind: 'text', value: 'hello' }])
    expect(after).toEqual([{ kind: 'text', value: ' world' }])
  })

  it('treats a variable as atomic and never splits inside', () => {
    const doc = parse('a{x}b')
    const { before, after } = splitAt(doc, 2) // 落到 {x} 内部
    expect(before).toEqual([{ kind: 'text', value: 'a' }])
    expect(after).toEqual([
      { kind: 'var', value: 'x', label: 'x' },
      { kind: 'text', value: 'b' }
    ])
  })

  it('splits exactly at variable boundary', () => {
    const doc = parse('a{x}b')
    const split = splitAt(doc, 1)
    expect(split.before).toEqual([{ kind: 'text', value: 'a' }])
    expect(split.after).toEqual([
      { kind: 'var', value: 'x', label: 'x' },
      { kind: 'text', value: 'b' }
    ])
  })

  it('returns full doc on the right when offset is 0', () => {
    const doc = parse('hello')
    expect(splitAt(doc, 0)).toEqual({ before: [], after: [{ kind: 'text', value: 'hello' }] })
  })

  it('returns full doc on the left when offset >= length', () => {
    const doc = parse('hello')
    expect(splitAt(doc, 100)).toEqual({ before: [{ kind: 'text', value: 'hello' }], after: [] })
  })
})
