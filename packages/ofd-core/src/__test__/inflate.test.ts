import { deflateRawSync } from 'node:zlib'

import { describe, expect, it } from 'vite-plus/test'

import { inflateRaw } from '../inflate'
import { utf8 } from './fixtures'

/** LSB 在前的位流构造器，用于手工构造 deflate 块（Huffman 码 MSB 在前） */
class BitWriter {
  private bytes: number[] = []
  private current = 0
  private count = 0

  writeBits(value: number, n: number): void {
    for (let i = 0; i < n; i += 1) {
      this.current |= ((value >> i) & 1) << this.count
      if (++this.count === 8) {
        this.bytes.push(this.current)
        this.current = 0
        this.count = 0
      }
    }
  }

  writeCode(value: number, n: number): void {
    for (let i = n - 1; i >= 0; i -= 1) this.writeBits((value >> i) & 1, 1)
  }

  finish(): Uint8Array {
    if (this.count > 0) this.bytes.push(this.current)
    return Uint8Array.from(this.bytes)
  }
}

describe('inflateRaw（内置 raw deflate 解码）', () => {
  it('动态 Huffman 块：重复文本往返（zlib 默认级别）', () => {
    const source = utf8('OFD 版式文档解析 '.repeat(4096))
    expect(inflateRaw(deflateRawSync(source), source.length)).toEqual(source)
  })

  it('stored 块：不可压缩数据（level 0，跨多个块）', () => {
    const source = new Uint8Array(200_000).map((_, i) => (i * 2654435761) % 256)
    const compressed = deflateRawSync(source, { level: 0 })
    expect(compressed.length).toBeGreaterThan(source.length)
    expect(inflateRaw(compressed, source.length)).toEqual(source)
  })

  it('二进制数据往返（默认级别，混合回引距离）', () => {
    const source = new Uint8Array(150_000)
    for (let i = 0; i < source.length; i++) source[i] = (i % 251) ^ ((i >>> 8) & 0xff)
    expect(inflateRaw(deflateRawSync(source), source.length)).toEqual(source)
  })

  it('长重复文本往返（命中最大长度码 285，长度 258 无额外位）', () => {
    const source = utf8('OFD 版式文档解析 '.repeat(64))
    expect(inflateRaw(deflateRawSync(source), source.length)).toEqual(source)
  })

  it('空输入解压为空输出', () => {
    expect(inflateRaw(deflateRawSync(new Uint8Array(0))).length).toBe(0)
  })

  it('固定 Huffman 块（手工构造位流）', () => {
    const writer = new BitWriter()
    writer.writeBits(1, 1) // BFINAL
    writer.writeBits(1, 2) // BTYPE = 01 固定 Huffman
    writer.writeCode(0x30 + 104, 8) // 字面量 'h'
    writer.writeCode(0x30 + 105, 8) // 字面量 'i'
    writer.writeCode(0, 7) // 块结束
    expect(inflateRaw(writer.finish())).toEqual(utf8('hi'))
  })

  it('截断的流抛 RangeError', () => {
    const compressed = deflateRawSync(utf8('截断测试 '.repeat(4096)))
    const truncated = compressed.slice(0, Math.floor(compressed.length * 0.7))
    expect(() => inflateRaw(truncated)).toThrow(RangeError)
  })

  it('stored 块 LEN/NLEN 不匹配抛 RangeError', () => {
    const writer = new BitWriter()
    writer.writeBits(1, 1) // BFINAL
    writer.writeBits(0, 2) // BTYPE = 00 stored
    writer.writeBits(0, 5) // 补齐字节边界
    writer.writeBits(3, 16) // LEN
    writer.writeBits(0, 16) // NLEN 未按位取反
    expect(() => inflateRaw(writer.finish())).toThrow(RangeError)
  })

  it('回引距离超出已解压输出抛 RangeError', () => {
    const writer = new BitWriter()
    writer.writeBits(1, 1) // BFINAL
    writer.writeBits(1, 2) // 固定 Huffman
    writer.writeCode(0x30 + 97, 8) // 字面量 'a'
    writer.writeCode(1, 7) // 长度码 257（长度 3，无额外位）
    writer.writeCode(3, 5) // 距离码 3（距离 4，超出仅有 1 字节的输出）
    expect(() => inflateRaw(writer.finish())).toThrow(RangeError)
  })

  it('块类型 3 抛 RangeError', () => {
    const writer = new BitWriter()
    writer.writeBits(1, 1) // BFINAL
    writer.writeBits(3, 2) // BTYPE = 11 保留值
    expect(() => inflateRaw(writer.finish())).toThrow(RangeError)
  })
})
