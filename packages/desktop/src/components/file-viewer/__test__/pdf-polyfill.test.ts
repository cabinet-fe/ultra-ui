import { describe, expect, it } from 'vite-plus/test'

import '../previewers/pdf-polyfill'

describe('pdf-polyfill', () => {
  it('引入后全部 shim API 均可用', () => {
    expect(typeof Promise.withResolvers).toBe('function')
    expect(typeof Promise.try).toBe('function')
    expect(typeof Set.prototype.intersection).toBe('function')
    expect(typeof (globalThis as { Iterator?: unknown }).Iterator).toBe('function')
    expect(typeof (URL as unknown as { parse?: unknown }).parse).toBe('function')
    expect(typeof Uint8Array.prototype.toHex).toBe('function')
    expect(typeof Uint8Array.prototype.toBase64).toBe('function')
    expect(typeof (Uint8Array as unknown as { fromBase64?: unknown }).fromBase64).toBe('function')
    expect(typeof Map.prototype.getOrInsert).toBe('function')
    expect(typeof Map.prototype.getOrInsertComputed).toBe('function')
  })

  describe('Promise.withResolvers', () => {
    it('resolve 路径', async () => {
      const { promise, resolve } = Promise.withResolvers<number>()
      resolve(1)
      await expect(promise).resolves.toBe(1)
    })

    it('reject 路径', async () => {
      const { promise, reject } = Promise.withResolvers()
      reject(new Error('boom'))
      await expect(promise).rejects.toThrow('boom')
    })
  })

  describe('Promise.try', () => {
    it('参数透传并解析返回值', async () => {
      await expect(Promise.try((a: number, b: number) => a + b, 1, 2)).resolves.toBe(3)
      await expect(Promise.try(() => Promise.resolve('async'))).resolves.toBe('async')
    })

    it('回调以 undefined this 调用', async () => {
      let thisArg: unknown = 'unset'
      await Promise.try(function (this: unknown) {
        thisArg = this
      })
      expect(thisArg).toBeUndefined()
    })

    it('同步异常转为 rejection', async () => {
      await expect(
        Promise.try(() => {
          throw new Error('sync')
        })
      ).rejects.toThrow('sync')
    })
  })

  describe('Set.prototype.intersection', () => {
    it('交集去重，返回新 Set', () => {
      const source = new Set([1, 2, 2, 3])
      const result = source.intersection(new Set([2, 3, 4]))
      expect(result).toEqual(new Set([2, 3]))
      expect(result).not.toBe(source)
    })

    it('空集与无交集边界', () => {
      expect(new Set<number>().intersection(new Set([1]))).toEqual(new Set())
      expect(new Set([1]).intersection(new Set<number>())).toEqual(new Set())
      expect(new Set([1]).intersection(new Set([2]))).toEqual(new Set())
    })
  })

  describe('Iterator 全局', () => {
    it('全局可用且原型为内建迭代器原型（pdfjs 顶层访问 Iterator.prototype 的前提）', () => {
      const IteratorGlobal = (globalThis as { Iterator?: unknown }).Iterator as
        | { prototype: unknown }
        | undefined
      expect(typeof IteratorGlobal).toBe('function')
      const iteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()))
      expect(IteratorGlobal?.prototype).toBe(iteratorPrototype)
    })

    it('在 Iterator.prototype 上追加方法后内建迭代器可见（模拟 pdfjs 的 join 补挂）', () => {
      const proto = ((globalThis as { Iterator?: unknown }).Iterator as { prototype: object })[
        'prototype'
      ] as Record<string, unknown>
      const original = proto.join
      if (typeof original !== 'function') {
        proto.join = function (this: Iterable<unknown>, separator: string) {
          return Array.from(this).join(separator)
        }
      }
      try {
        const joined = (
          new Set(['a', 'b']).values() as unknown as { join(separator: string): string }
        ).join('-')
        expect(joined).toBe('a-b')
      } finally {
        if (typeof original !== 'function') delete proto.join
      }
    })
  })

  describe('URL.parse 静态方法', () => {
    it('合法地址返回 URL 实例，base 生效', () => {
      const parse = (URL as unknown as { parse: (u: string | URL, b?: string | URL) => URL | null })
        .parse
      const parsed = parse('/demo/page.html', 'https://example.com/docs/')
      expect(parsed?.protocol).toBe('https:')
      expect(parsed?.href).toBe('https://example.com/demo/page.html')
      expect(parse('https://example.com/a')?.origin).toBe('https://example.com')
    })

    it('非法地址返回 null 而非抛错', () => {
      const parse = (URL as unknown as { parse: (u: string | URL, b?: string | URL) => URL | null })
        .parse
      expect(parse('not a url')).toBeNull()
      expect(parse('http://[invalid')).toBeNull()
    })
  })

  describe('Uint8Array 编码扩展', () => {
    it('toHex 输出小写十六进制', () => {
      expect(new Uint8Array([0, 1, 15, 255, 128]).toHex()).toBe('00010fff80')
      expect(new Uint8Array(0).toHex()).toBe('')
    })

    it('toBase64 输出标准 base64（含 padding），大数组不栈溢出', () => {
      expect(new Uint8Array([104, 101, 108, 108, 111]).toBase64()).toBe('aGVsbG8=')
      expect(new Uint8Array([250]).toBase64()).toBe('+g==')
      // 20 万字节远超 apply 参数上限，验证分块路径
      const big = new Uint8Array(200_000)
      big[0] = 104
      big[199_999] = 111
      const decoded = atob(big.toBase64())
      expect(decoded.length).toBe(200_000)
      expect(decoded.charCodeAt(0)).toBe(104)
      expect(decoded.charCodeAt(199_999)).toBe(111)
    })

    it('fromBase64 解码并忽略 ASCII 空白，与 toBase64 互逆', () => {
      const fromBase64 = (Uint8Array as unknown as { fromBase64: (s: string) => Uint8Array })
        .fromBase64
      expect([...fromBase64('aGVsbG8=')]).toEqual([104, 101, 108, 108, 111])
      expect([...fromBase64('aGVs\nbG8=')]).toEqual([104, 101, 108, 108, 111])
      const roundTrip = new Uint8Array([0, 1, 2, 250, 251, 255])
      expect([...fromBase64(roundTrip.toBase64())]).toEqual([...roundTrip])
    })
  })

  describe('Map upsert', () => {
    it('getOrInsert 已有键返回旧值，新键插入并返回', () => {
      const map = new Map<string, number>([['a', 1]])
      expect(map.getOrInsert('a', 2)).toBe(1)
      expect(map.getOrInsert('b', 3)).toBe(3)
      expect(map.get('a')).toBe(1)
      expect(map.get('b')).toBe(3)
    })

    it('getOrInsertComputed 仅在新键时调用回调', () => {
      const map = new Map<string, number[]>()
      const calls: string[] = []
      const first = map.getOrInsertComputed('k', (key) => {
        calls.push(key)
        return [key]
      })
      const second = map.getOrInsertComputed('k', (key) => {
        calls.push(key)
        return [key]
      })
      expect(first).toBe(second)
      expect(first).toEqual(['k'])
      expect(calls).toEqual(['k'])
    })
  })
})
