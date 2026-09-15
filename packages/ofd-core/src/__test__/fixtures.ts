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

// ---- 自造最小 TTF（内嵌字体相关测试共用）----

type Bytes = number[]

/** 直角三角形轮廓：三个 on-curve 点（字体单位） */
export const TRIANGLE_CONTOUR = [
  { x: 0, y: 0, on: true },
  { x: 500, y: 0, on: true },
  { x: 250, y: 500, on: true }
]

export interface TtfGlyphInput {
  /** 简单 glyph：多圈轮廓点（字体单位） */
  contours?: { x: number; y: number; on: boolean }[][]
  /** 复合 glyph：引用其它 glyph 并平移 */
  components?: { glyph: number; dx: number; dy: number }[]
}

export interface TtfFontInput {
  unitsPerEm?: number
  /** 码点 → glyph 序号，编码为 cmap format 4 */
  cmap?: Record<number, number>
  glyphs: TtfGlyphInput[]
  /** 前 n 个 glyph 的步进宽度；缺省 600 */
  advances?: number[]
  /** 模拟缺表：从表目录剔除这些表 */
  omitTables?: string[]
}

/** 按输入构造一个最小可用的 TrueType 字体（无校验和、无对齐填充） */
export function buildTtf(input: TtfFontInput): Uint8Array {
  const glyphData = input.glyphs.map(paddedGlyphBytes)
  const offsets: number[] = [0]
  for (const data of glyphData) offsets.push(offsets[offsets.length - 1]! + data.length)
  return assembleSfnt(
    [
      ['cmap', cmapBytes(input.cmap ?? {})],
      ['glyf', concatBytes(glyphData)],
      ['head', headBytes(input.unitsPerEm ?? 1000)],
      ['hhea', hheaBytes(input.advances?.length ?? input.glyphs.length)],
      ['hmtx', hmtxBytes(input)],
      ['loca', locaBytes(offsets)],
      ['maxp', bytesOf([...u32v(0x00005000), ...u16v(input.glyphs.length)])]
    ],
    input.omitTables ?? []
  )
}

function u16v(value: number): Bytes {
  return [(value >> 8) & 0xff, value & 0xff]
}

function u32v(value: number): Bytes {
  return [...u16v((value >>> 16) & 0xffff), ...u16v(value & 0xffff)]
}

function bytesOf(parts: Bytes): Uint8Array {
  return Uint8Array.from(parts)
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function paddedGlyphBytes(glyph: TtfGlyphInput): Uint8Array {
  const bytes = glyphBytes(glyph)
  if (bytes.length % 2 === 1) bytes.push(0) // loca 短格式偏移须为偶数
  return bytesOf(bytes)
}

/** 简单 glyph 走标志位 + i16 增量坐标编码；复合 glyph 组件用字参数 + XY 偏移 */
function glyphBytes(glyph: TtfGlyphInput): Bytes {
  if (glyph.components) {
    const parts: Bytes = [...u16v(0xffff), 0, 0, 0, 0, 0, 0, 0, 0] // numberOfContours = -1 + bbox
    for (const component of glyph.components) {
      // ARG_1_AND_2_ARE_WORDS | ARGS_ARE_XY_VALUES
      parts.push(
        ...u16v(0x0003),
        ...u16v(component.glyph),
        ...u16v(component.dx & 0xffff),
        ...u16v(component.dy & 0xffff)
      )
    }
    return parts
  }
  const contours = glyph.contours ?? []
  if (contours.length === 0) return []
  const parts: Bytes = [...u16v(contours.length), 0, 0, 0, 0, 0, 0, 0, 0] // 数量 + bbox 置 0
  let pointCount = 0
  for (const contour of contours) {
    pointCount += contour.length
    parts.push(...u16v(pointCount - 1))
  }
  parts.push(...u16v(0)) // instructionLength
  for (const contour of contours) {
    for (const point of contour) parts.push(point.on ? 0x01 : 0x00)
  }
  let prevX = 0
  let prevY = 0
  for (const contour of contours) {
    for (const point of contour) {
      parts.push(...u16v((point.x - prevX) & 0xffff))
      prevX = point.x
    }
  }
  // TrueType 先存全部 x 增量，再存全部 y 增量
  for (const contour of contours) {
    for (const point of contour) {
      parts.push(...u16v((point.y - prevY) & 0xffff))
      prevY = point.y
    }
  }
  return parts
}

/** 每个码点一个单字符段 + 0xFFFF 结尾段（idDelta = gid - code），平台 3-1 的 format 4 子表 */
function cmapBytes(cmap: Record<number, number>): Uint8Array {
  const codes = Object.keys(cmap)
    .map(Number)
    .sort((a, b) => a - b)
  const segments = codes.map((code) => ({
    start: code,
    end: code,
    delta: (cmap[code]! - code) & 0xffff
  }))
  segments.push({ start: 0xffff, end: 0xffff, delta: 1 })
  const segCount = segments.length
  const subtable: Bytes = [
    ...u16v(4),
    ...u16v(16 + 8 * segCount),
    ...u16v(0), // language
    ...u16v(segCount * 2),
    ...u16v(0), // searchRange
    ...u16v(0), // entrySelector
    ...u16v(0) // rangeShift，解析器不依赖
  ]
  for (const segment of segments) subtable.push(...u16v(segment.end))
  subtable.push(...u16v(0)) // reservedPad
  for (const segment of segments) subtable.push(...u16v(segment.start))
  for (const segment of segments) subtable.push(...u16v(segment.delta))
  for (const segment of segments) subtable.push(...u16v(0)) // idRangeOffset = 0

  // cmap 表头：version + 单条编码记录（Windows BMP，子表紧跟记录之后）
  return bytesOf([
    ...u16v(0), // version
    ...u16v(1), // numTables
    ...u16v(3), // platformID = Windows
    ...u16v(1), // encodingID = BMP
    ...u32v(12), // 子表偏移（相对 cmap 表头）
    ...subtable
  ])
}

function headBytes(unitsPerEm: number): Uint8Array {
  const parts: Bytes = [
    ...u32v(0x00010000), // version
    ...u32v(0x00010000), // fontRevision
    ...u32v(0), // checkSumAdjustment
    ...u32v(0x5f0f3cf5), // magicNumber
    ...u16v(0), // flags
    ...u16v(unitsPerEm) // unitsPerEm @ 18
  ]
  parts.push(...Array<number>(16).fill(0)) // created / modified
  parts.push(...Array<number>(8).fill(0)) // xMin / yMin / xMax / yMax
  parts.push(...Array<number>(6).fill(0)) // macStyle / lowestRecPPEM / fontDirectionHint
  parts.push(...u16v(0)) // indexToLocFormat = 0（短格式）@ 50
  parts.push(...u16v(0)) // glyphDataFormat
  return bytesOf(parts)
}

function hheaBytes(numberOfHMetrics: number): Uint8Array {
  const parts: Bytes = [
    ...u32v(0x00010000), // version
    ...u16v(800), // ascent
    ...u16v(-200 & 0xffff), // descent
    ...u16v(0), // lineGap
    ...u16v(1000) // advanceWidthMax
  ]
  while (parts.length < 34) parts.push(0)
  parts.push(...u16v(numberOfHMetrics))
  return bytesOf(parts)
}

function hmtxBytes(input: TtfFontInput): Uint8Array {
  const numGlyphs = input.glyphs.length
  const count = input.advances?.length ?? numGlyphs
  const parts: Bytes = []
  for (let i = 0; i < count; i++) {
    parts.push(...u16v(input.advances?.[i] ?? 600), ...u16v(0)) // advanceWidth + lsb
  }
  for (let i = count; i < numGlyphs; i++) parts.push(...u16v(0)) // 其余 glyph 的 lsb
  return bytesOf(parts)
}

function locaBytes(offsets: number[]): Uint8Array {
  return bytesOf(offsets.flatMap((offset) => u16v(offset / 2)))
}

function assembleSfnt(tables: [string, Uint8Array][], omit: string[]): Uint8Array {
  const ordered = tables
    .filter(([tag]) => !omit.includes(tag))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const directory: Bytes = [
    ...u32v(0x00010000),
    ...u16v(ordered.length),
    ...u16v(0), // searchRange / entrySelector / rangeShift
    ...u16v(0),
    ...u16v(0)
  ]
  let offset = 12 + 16 * ordered.length
  for (const [tag, data] of ordered) {
    directory.push(
      ...[...tag].map((ch) => ch.charCodeAt(0)),
      ...u32v(0), // checksum
      ...u32v(offset),
      ...u32v(data.length)
    )
    offset += data.length
  }
  return concatBytes([bytesOf(directory), ...ordered.map(([, data]) => data)])
}
