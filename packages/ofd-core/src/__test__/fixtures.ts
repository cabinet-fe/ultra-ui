import { expect } from 'vitest'

import { OfdParseError } from '../error'

// 测试夹具：用代码构造 ZIP 容器（stored 与 deflate-raw 条目），不依赖任何 zip 库

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let value = i
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[i] = value >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

export interface ZipEntryInput {
  name: string
  data: Uint8Array
  /** 为 true 时用 CompressionStream('deflate-raw') 压缩，否则 stored */
  deflate?: boolean
}

export async function buildZip(entries: ZipEntryInput[]): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const method = entry.deflate ? 8 : 0
    const stored = entry.deflate ? await deflateRaw(entry.data) : entry.data

    const local = new Uint8Array(30 + nameBytes.length)
    const localView = new DataView(local.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0x0800, true)
    localView.setUint16(8, method, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, stored.length, true)
    localView.setUint32(22, entry.data.length, true)
    localView.setUint16(26, nameBytes.length, true)
    local.set(nameBytes, 30)

    locals.push(local, stored)
    centrals.push(centralRecord(nameBytes, method, crc, stored.length, entry.data.length, offset))
    offset += local.length + stored.length
  }

  const central = concat(centrals)
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  eocdView.setUint32(0, 0x06054b50, true)
  eocdView.setUint16(8, entries.length, true)
  eocdView.setUint16(10, entries.length, true)
  eocdView.setUint32(12, central.length, true)
  eocdView.setUint32(16, offset, true)

  return concat([...locals, central, eocd])
}

function centralRecord(
  nameBytes: Uint8Array,
  method: number,
  crc: number,
  compressedSize: number,
  size: number,
  localOffset: number
): Uint8Array {
  const record = new Uint8Array(46 + nameBytes.length)
  const view = new DataView(record.buffer)
  view.setUint32(0, 0x02014b50, true)
  view.setUint16(4, 20, true)
  view.setUint16(6, 20, true)
  view.setUint16(8, 0x0800, true)
  view.setUint16(10, method, true)
  view.setUint32(16, crc, true)
  view.setUint32(20, compressedSize, true)
  view.setUint32(24, size, true)
  view.setUint16(28, nameBytes.length, true)
  view.setUint32(42, localOffset, true)
  record.set(nameBytes, 46)
  return record
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

/** 断言 run 抛出 OfdParseError，返回该错误供继续断言 reason */
export async function expectParseError(run: () => unknown): Promise<OfdParseError> {
  try {
    await run()
  } catch (error) {
    expect(error).toBeInstanceOf(OfdParseError)
    return error as OfdParseError
  }
  throw new Error('预期抛出 OfdParseError')
}
