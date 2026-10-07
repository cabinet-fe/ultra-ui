import { describe, expect, it } from 'vite-plus/test'

import '../previewers/pdf-polyfill'

describe('pdf-polyfill', () => {
  it('引入后 3 个 API 均可用', () => {
    expect(typeof Promise.withResolvers).toBe('function')
    expect(typeof Promise.try).toBe('function')
    expect(typeof Set.prototype.intersection).toBe('function')
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
})
