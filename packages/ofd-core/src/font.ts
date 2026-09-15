/**
 * 内嵌 TTF 字体解析与 glyph 轮廓输出（OFD Font@FontFile 声明的内嵌字体）。
 *
 * 读取 TrueType 的 head/maxp/cmap/loca/glyf/hhea/hmtx 表：cmap 把字符码点映射到
 * glyph id（可省，省略时字符映射由渲染层 CGTransform 字形序号提供），glyf 提取
 * 轮廓点（on/off curve，复合 glyph 递归展开并平移/缩放）。
 * 二次贝塞尔轮廓按 unitsPerEm → 字号缩放、基线定位并翻转 y 轴后转成 SVG path
 * `d`。二进制结构非法时抛 OfdParseError('invalid-font')。
 */

import { OfdParseError } from './error'
import { formatNumber } from './number'

/** TrueType 轮廓点：onCurve 为 true 是曲线端点，false 是二次贝塞尔控制点 */
export interface OfdGlyphPoint {
  x: number
  y: number
  onCurve: boolean
}

/** 已解析的内嵌 TTF：字符映射、度量与轮廓（坐标均为字体单位，y 轴向上） */
export interface OfdEmbeddedFont {
  readonly unitsPerEm: number
  readonly numGlyphs: number
  /** 字符码点 → glyph id；未映射返回 null */
  glyphIndexOf(codePoint: number): number | null
  /** glyph 轮廓（每圈一组点）；空 glyph 或越界 id 返回空数组 */
  glyphOutline(gid: number): OfdGlyphPoint[][]
  /** glyph 步进宽度（字体单位）；id 超出度量数时取最后一条度量 */
  advanceWidth(gid: number): number
}

/** 解析 TTF 二进制：结构非法抛 OfdParseError('invalid-font') */
export function parseEmbeddedFont(data: Uint8Array, source: string): OfdEmbeddedFont {
  if (data.length < 12) {
    throw new OfdParseError('invalid-font', `字体 ${source} 数据太短，不是 TTF 文件`)
  }
  const tables = parseTableDirectory(data, source)
  for (const tag of REQUIRED_TABLES) {
    const table = tables.get(tag)
    if (!table) throw new OfdParseError('invalid-font', `字体 ${source} 缺少 ${tag} 表`)
    if (table.offset + table.length > data.length) {
      throw new OfdParseError('invalid-font', `字体 ${source} 的 ${tag} 表越界，数据被截断`)
    }
  }

  const headOffset = tables.get('head')!.offset
  const unitsPerEm = new FontReader(data, source, headOffset + 18).u16()
  if (unitsPerEm === 0) {
    throw new OfdParseError('invalid-font', `字体 ${source} 的 unitsPerEm 为 0`)
  }
  const indexToLocFormat = new FontReader(data, source, headOffset + 50).i16()
  if (indexToLocFormat !== 0 && indexToLocFormat !== 1) {
    throw new OfdParseError(
      'invalid-font',
      `字体 ${source} 的 indexToLocFormat 不合法：${indexToLocFormat}`
    )
  }

  const numGlyphs = new FontReader(data, source, tables.get('maxp')!.offset + 4).u16()
  // cmap 可省：数电票内嵌子集字体不带 cmap，字符映射由页面 CGTransform 字形序号给出
  const cmapTable = tables.get('cmap')
  const cmap = cmapTable ? parseCmap(data, cmapTable, source) : new Map<number, number>()

  // loca：glyph 数据偏移表，须单调不减且落在 glyf 表内
  const glyfTable = tables.get('glyf')!
  const locaView = new FontReader(data, source, tables.get('loca')!.offset)
  const loca: number[] = []
  for (let i = 0; i <= numGlyphs; i++) {
    loca.push(indexToLocFormat === 0 ? locaView.u16() * 2 : locaView.u32())
  }
  for (let i = 0; i < numGlyphs; i++) {
    if (loca[i + 1]! < loca[i]! || loca[i + 1]! > glyfTable.length) {
      throw new OfdParseError('invalid-font', `字体 ${source} 的 loca 表越界`)
    }
  }

  // hmtx：前 numberOfHMetrics 个 glyph 各有一条步进宽度，其余复用最后一条
  const numberOfHMetrics = Math.min(
    new FontReader(data, source, tables.get('hhea')!.offset + 34).u16(),
    numGlyphs
  )
  const hmtxView = new FontReader(data, source, tables.get('hmtx')!.offset)
  const advances: number[] = []
  for (let i = 0; i < numberOfHMetrics; i++) {
    advances.push(hmtxView.u16())
    hmtxView.i16() // leftSideBearing，路径渲染用不到
  }

  const glyf = data.subarray(glyfTable.offset, glyfTable.offset + glyfTable.length)
  const outlineCache = new Map<number, OfdGlyphPoint[][]>()

  return {
    unitsPerEm,
    numGlyphs,
    glyphIndexOf: (codePoint) => cmap.get(codePoint) ?? null,
    advanceWidth: (gid) => advances[Math.min(Math.max(gid, 0), advances.length - 1)] ?? 0,
    glyphOutline: (gid) => {
      const cached = outlineCache.get(gid)
      if (cached) return cached
      const outline = readGlyphOutline(glyf, gid, new Set([gid]), numGlyphs, loca, source)
      outlineCache.set(gid, outline)
      return outline
    }
  }
}

/**
 * glyph 轮廓转 SVG path `d`：unitsPerEm → 字号缩放，基线原点定位并翻转
 * y 轴（字体坐标向上，SVG 向下）。无轮廓返回空串。
 */
export function glyphPathD(
  font: OfdEmbeddedFont,
  gid: number,
  fontSize: number,
  originX: number,
  originY: number
): string {
  if (!(fontSize > 0)) return ''
  const scale = fontSize / font.unitsPerEm
  return font
    .glyphOutline(gid)
    .map((contour) => contourPathD(contour, scale, originX, originY))
    .filter((d) => d !== '')
    .join(' ')
}

// ----------------------------------------------------------------------------------
// 二进制读取
// ----------------------------------------------------------------------------------

const REQUIRED_TABLES = ['glyf', 'head', 'hhea', 'hmtx', 'loca', 'maxp']

interface SfntTable {
  offset: number
  length: number
}

/** 带越界检查的大端读取器：越界抛 invalid-font */
class FontReader {
  offset: number

  constructor(
    private readonly data: Uint8Array,
    private readonly source: string,
    offset = 0
  ) {
    this.offset = offset
  }

  seek(offset: number): void {
    this.offset = offset
  }

  u8(): number {
    this.take(1)
    return this.data[this.offset++]!
  }

  i8(): number {
    return (this.u8() << 24) >> 24
  }

  u16(): number {
    this.take(2)
    const value = (this.data[this.offset]! << 8) | this.data[this.offset + 1]!
    this.offset += 2
    return value
  }

  i16(): number {
    return (this.u16() << 16) >> 16
  }

  u32(): number {
    return ((this.u16() << 16) | this.u16()) >>> 0
  }

  /** 读指定绝对偏移的 u16（cmap format 4 的 glyphIdArray 寻址用） */
  u16At(offset: number): number {
    if (offset < 0 || offset + 2 > this.data.length) this.overrun()
    return (this.data[offset]! << 8) | this.data[offset + 1]!
  }

  private take(size: number): void {
    if (this.offset + size > this.data.length) this.overrun()
  }

  private overrun(): never {
    throw new OfdParseError('invalid-font', `字体 ${this.source} 数据被截断`)
  }
}

function parseTableDirectory(data: Uint8Array, source: string): Map<string, SfntTable> {
  const view = new FontReader(data, source)
  view.u32() // sfntVersion（0x00010000 / 'true' / 'OTTO'）：缺表时各自报错，不在此校验
  const numTables = view.u16()
  view.seek(view.offset + 6) // searchRange / entrySelector / rangeShift
  const tables = new Map<string, SfntTable>()
  for (let i = 0; i < numTables; i++) {
    const tag = String.fromCharCode(view.u8(), view.u8(), view.u8(), view.u8())
    view.u32() // checksum
    const offset = view.u32()
    const length = view.u32()
    tables.set(tag, { offset, length })
  }
  return tables
}

// ----------------------------------------------------------------------------------
// cmap：字符码点 → glyph id
// ----------------------------------------------------------------------------------

function parseCmap(data: Uint8Array, table: SfntTable, source: string): Map<number, number> {
  const header = new FontReader(data, source, table.offset)
  header.u16() // version
  const recordCount = header.u16()
  const records: { platform: number; encoding: number; offset: number }[] = []
  for (let i = 0; i < recordCount; i++) {
    records.push({
      platform: header.u16(),
      encoding: header.u16(),
      offset: table.offset + header.u32()
    })
  }
  // 子表偏好：Windows 全 Unicode → Unicode 平台 → Windows BMP → 其余
  const score = (record: { platform: number; encoding: number }): number =>
    record.platform === 3 && record.encoding === 10
      ? 3
      : record.platform === 0
        ? 2
        : record.platform === 3 && record.encoding === 1
          ? 1
          : 0
  records.sort((a, b) => score(b) - score(a))
  for (const record of records) {
    try {
      // 空映射（如仅 .notdef 的字体）也接受：解析成功即可用
      return parseCmapSubtable(new FontReader(data, source, record.offset), source)
    } catch {
      // 该子表格式不支持或数据损坏：换下一个候选
    }
  }
  throw new OfdParseError('invalid-font', `字体 ${source} 没有可用的 cmap 子表`)
}

function parseCmapSubtable(view: FontReader, source: string): Map<number, number> {
  const format = view.u16()
  switch (format) {
    case 4:
      return parseCmapFormat4(view)
    case 12:
      return parseCmapFormat12(view)
    case 0:
      return parseCmapFormat0(view)
    case 6:
      return parseCmapFormat6(view)
    default:
      throw new OfdParseError('invalid-font', `字体 ${source} 的 cmap 子表格式 ${format} 不支持`)
  }
}

function parseCmapFormat4(view: FontReader): Map<number, number> {
  view.u16() // length
  view.u16() // language
  const segCount = view.u16() / 2
  view.u16() // searchRange
  view.u16() // entrySelector
  view.u16() // rangeShift
  if (segCount === 0) {
    throw new OfdParseError('invalid-font', 'cmap format 4 段数为 0')
  }
  const ends = readU16Array(view, segCount)
  view.u16() // reservedPad
  const starts = readU16Array(view, segCount)
  const deltas = readU16Array(view, segCount)
  const rangeOffsetBase = view.offset
  const rangeOffsets = readU16Array(view, segCount)

  const map = new Map<number, number>()
  for (let s = 0; s < segCount; s++) {
    for (let code = starts[s]!; code <= ends[s]!; code++) {
      let gid: number
      if (rangeOffsets[s] === 0) {
        gid = (code + deltas[s]!) & 0xffff
      } else {
        // glyphIdArray 相对 rangeOffset[s] 自身所在位置寻址
        const address = rangeOffsetBase + 2 * s + rangeOffsets[s]! + 2 * (code - starts[s]!)
        gid = view.u16At(address)
        if (gid === 0) continue
        gid = (gid + deltas[s]!) & 0xffff
      }
      if (gid !== 0) map.set(code, gid)
    }
  }
  return map
}

function parseCmapFormat12(view: FontReader): Map<number, number> {
  view.u16() // reserved
  view.u32() // length
  view.u32() // language
  const groupCount = view.u32()
  const map = new Map<number, number>()
  for (let g = 0; g < groupCount; g++) {
    const start = view.u32()
    const end = Math.min(view.u32(), 0x10ffff) // Unicode 上限，防畸形大段
    const startGlyph = view.u32()
    for (let code = start; code <= end; code++) {
      const gid = startGlyph + (code - start)
      if (gid !== 0) map.set(code, gid)
    }
  }
  return map
}

function parseCmapFormat0(view: FontReader): Map<number, number> {
  view.u16() // length
  view.u16() // language
  const map = new Map<number, number>()
  for (let code = 0; code < 256; code++) {
    const gid = view.u8()
    if (gid !== 0) map.set(code, gid)
  }
  return map
}

function parseCmapFormat6(view: FontReader): Map<number, number> {
  view.u16() // length
  view.u16() // language
  const firstCode = view.u16()
  const entryCount = view.u16()
  const map = new Map<number, number>()
  for (let i = 0; i < entryCount; i++) {
    const gid = view.u16()
    if (gid !== 0) map.set(firstCode + i, gid)
  }
  return map
}

function readU16Array(view: FontReader, count: number): number[] {
  return Array.from({ length: count }, () => view.u16())
}

// ----------------------------------------------------------------------------------
// glyf：glyph 轮廓
// ----------------------------------------------------------------------------------

const COMPONENT_WORDS_ARGS = 0x0001
const COMPONENT_MORE = 0x0020
const COMPONENT_SCALE = 0x0008
const COMPONENT_XY_SCALE = 0x0040
const COMPONENT_TWO_BY_TWO = 0x0080

/** 读单个 glyph 轮廓；复合 glyph 递归展开组件（带环检测），越界/空 glyph 返回空 */
function readGlyphOutline(
  glyf: Uint8Array,
  gid: number,
  visiting: ReadonlySet<number>,
  numGlyphs: number,
  loca: number[],
  source: string
): OfdGlyphPoint[][] {
  if (gid < 0 || gid >= numGlyphs) return []
  const start = loca[gid]!
  const end = loca[gid + 1]!
  if (start === end) return []
  const view = new FontReader(glyf, source, start)
  const numberOfContours = view.i16()
  view.seek(view.offset + 8) // xMin / yMin / xMax / yMax
  if (numberOfContours >= 0) return readSimpleGlyph(view, numberOfContours)
  return readCompositeGlyph(view, (componentGid) => {
    if (visiting.has(componentGid)) return []
    const next = new Set(visiting)
    next.add(componentGid)
    return readGlyphOutline(glyf, componentGid, next, numGlyphs, loca, source)
  })
}

/** 简单 glyph：标志位驱动的增量坐标解码 */
function readSimpleGlyph(view: FontReader, numberOfContours: number): OfdGlyphPoint[][] {
  if (numberOfContours === 0) return []
  const endPoints: number[] = []
  for (let i = 0; i < numberOfContours; i++) endPoints.push(view.u16())
  const pointCount = endPoints[endPoints.length - 1]! + 1
  const instructionLength = view.u16()
  view.seek(view.offset + instructionLength) // 跳过指令

  const flags: number[] = []
  while (flags.length < pointCount) {
    const flag = view.u8()
    flags.push(flag)
    if (flag & 0x0008) {
      const repeat = view.u8()
      for (let r = 0; r < repeat && flags.length < pointCount; r++) flags.push(flag)
    }
  }
  const xs = readDeltaCoords(view, flags, 0x0002, 0x0010)
  const ys = readDeltaCoords(view, flags, 0x0004, 0x0020)

  const points: OfdGlyphPoint[] = []
  for (let i = 0; i < pointCount; i++) {
    points.push({ x: xs[i]!, y: ys[i]!, onCurve: (flags[i]! & 0x0001) !== 0 })
  }
  const contours: OfdGlyphPoint[][] = []
  let start = 0
  for (const end of endPoints) {
    contours.push(points.slice(start, end + 1))
    start = end + 1
  }
  return contours
}

/** x/y 增量坐标共用解码：短格式 1 字节（符号由 same 位决定），否则 0 或 i16 */
function readDeltaCoords(
  view: FontReader,
  flags: number[],
  shortBit: number,
  sameBit: number
): number[] {
  const coords: number[] = []
  let value = 0
  for (const flag of flags) {
    if (flag & shortBit) {
      const delta = view.u8()
      value += (flag & sameBit) !== 0 ? delta : -delta
    } else if ((flag & sameBit) === 0) {
      value += view.i16()
    }
    coords.push(value)
  }
  return coords
}

/**
 * 复合 glyph：组件递归展开，先按组件矩阵变换再平移。
 * 极少见「点对齐」组件（args 为点序号而非 XY 偏移）按偏移量处理，不做点匹配。
 */
function readCompositeGlyph(
  view: FontReader,
  resolve: (gid: number) => OfdGlyphPoint[][]
): OfdGlyphPoint[][] {
  const contours: OfdGlyphPoint[][] = []
  let flags: number
  do {
    flags = view.u16()
    const glyphIndex = view.u16()
    const wide = (flags & COMPONENT_WORDS_ARGS) !== 0
    const dx = wide ? view.i16() : view.i8()
    const dy = wide ? view.i16() : view.i8()
    let a = 1
    let b = 0
    let c = 0
    let d = 1
    if (flags & COMPONENT_SCALE) {
      a = d = readFixed214(view)
    } else if (flags & COMPONENT_XY_SCALE) {
      a = readFixed214(view)
      d = readFixed214(view)
    } else if (flags & COMPONENT_TWO_BY_TWO) {
      a = readFixed214(view)
      b = readFixed214(view)
      c = readFixed214(view)
      d = readFixed214(view)
    }
    for (const contour of resolve(glyphIndex)) {
      contours.push(
        contour.map((point) => ({
          x: a * point.x + c * point.y + dx,
          y: b * point.x + d * point.y + dy,
          onCurve: point.onCurve
        }))
      )
    }
  } while (flags & COMPONENT_MORE)
  return contours
}

function readFixed214(view: FontReader): number {
  return view.u16() / 16384
}

// ----------------------------------------------------------------------------------
// 轮廓 → SVG path
// ----------------------------------------------------------------------------------

/**
 * TrueType 轮廓转 path：相邻 off-curve 点之间补隐式中点（on-curve），
 * 旋转到 on-curve 点开头后逐段输出 L / Q，Z 闭合。
 */
function contourPathD(
  contour: OfdGlyphPoint[],
  scale: number,
  originX: number,
  originY: number
): string {
  const points = normalizeContour(contour)
  if (points.length === 0) return ''
  const count = points.length
  const at = (index: number) => points[index % count]!
  const x = (point: OfdGlyphPoint) => formatNumber(point.x * scale + originX)
  // 字体坐标系 y 向上，SVG y 向下：基线原点下方取负
  const y = (point: OfdGlyphPoint) => formatNumber(originY - point.y * scale)

  const parts = [`M ${x(points[0]!)} ${y(points[0]!)}`]
  for (let i = 1; i < count; i++) {
    const point = at(i)
    if (point.onCurve) {
      parts.push(`L ${x(point)} ${y(point)}`)
    } else {
      // 归一化后 off-curve 的下一点必为 on-curve，直接作为曲线终点
      const next = at(i + 1)
      parts.push(`Q ${x(point)} ${y(point)} ${x(next)} ${y(next)}`)
      i++ // 终点已画到，跳过
    }
  }
  parts.push('Z')
  return parts.join(' ')
}

function normalizeContour(contour: OfdGlyphPoint[]): OfdGlyphPoint[] {
  const count = contour.length
  if (count === 0) return []
  const expanded: OfdGlyphPoint[] = []
  for (let i = 0; i < count; i++) {
    const point = contour[i]!
    expanded.push(point)
    const next = contour[(i + 1) % count]!
    if (!point.onCurve && !next.onCurve) {
      expanded.push({ x: (point.x + next.x) / 2, y: (point.y + next.y) / 2, onCurve: true })
    }
  }
  const start = expanded.findIndex((point) => point.onCurve)
  if (start <= 0) return expanded
  return [...expanded.slice(start), ...expanded.slice(0, start)]
}
