/**
 * 纯 JS raw DEFLATE（RFC 1951）解码器。
 * DecompressionStream('deflate-raw') 自 Chrome 103 起才支持，目标内核
 * Chrome 102 上 ZIP 的 deflate 条目无法走原生解压，由本实现兜底。
 * 解码结构参照 fflate：按码表实际最大码长 mb 建 2^mb 位序反查表，一次查表
 * 同时得到「符号 + 码长」（表项 = 符号 << 4 | 码长），避免逐位走树；
 * 越过输入末尾的位读取按 0 处理，截断统一由「已消费位数超过总位数」判定。
 */

/** 长度码 257-285 的基础长度；码 285 直接表示 258，无额外位 */
const LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131,
  163, 195, 227, 258
]

/** 长度码 257-285 的额外位；码 285 表示长度 258，无额外位 */
const LENGTH_EXTRA = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0
])

/** 距离码 0-29 的基础距离 */
const DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049,
  3073, 4097, 6145, 8193, 12289, 16385, 24577
]

/** 距离码 0-29 的额外位 */
const DIST_EXTRA = new Uint8Array([
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13
])

/** 码长码字母表的固定重排顺序（RFC 1951 §3.2.7） */
const CODE_LENGTH_ORDER = new Uint8Array([
  16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15
])

interface HuffmanTable {
  /** 2^maxBits 位序反查表：表项 = (符号 << 4) | 码长，0 表示未分配的非法码 */
  map: Uint16Array
  /** 取表下标用的低位掩码 = (1 << maxBits) - 1 */
  mask: number
  /** 码空间分配后的剩余量；0 表示码表完备 */
  incomplete: number
}

/** 从 pos 位起连续取 17 位（LSB 在前）；越过末尾的字节按 0 处理 */
function peekBits(data: Uint8Array, pos: number): number {
  const offset = pos >>> 3
  return (data[offset]! | (data[offset + 1]! << 8) | (data[offset + 2]! << 16)) >>> (pos & 7)
}

/** 从 pos 位起读 n 位（n ≤ 17） */
function readBits(data: Uint8Array, pos: number, n: number): number {
  return peekBits(data, pos) & ((1 << n) - 1)
}

/** 将 value 的低 bits 位反序；码表以位反序为下标，免去解码时逐位翻转 */
function reverseBits(value: number, bits: number): number {
  let out = 0
  for (let index = 0; index < bits; index += 1) {
    out = (out << 1) | (value & 1)
    value >>>= 1
  }
  return out
}

/** 由码长序列建规范 Huffman 反查表；过度订阅（码空间为负）直接抛错 */
function buildHuffmanMap(lengths: ArrayLike<number>): HuffmanTable {
  const counts = new Uint16Array(16)
  let maxBits = 0
  for (let symbol = 0; symbol < lengths.length; symbol += 1) {
    const length = lengths[symbol]!
    if (length === 0) continue
    counts[length]! += 1
    if (length > maxBits) maxBits = length
  }

  let incomplete = 1
  for (let length = 1; length <= 15; length += 1) {
    incomplete = (incomplete << 1) - counts[length]!
    if (incomplete < 0) throw new RangeError(`deflate 码表过度订阅（码长 ${length}）`)
  }

  // 规范码赋值：每个码长的最小码字由「上一码长最小码 + 上一码长符号数」左移推得
  const minCodes = new Uint16Array(16)
  for (let length = 1; length <= 15; length += 1) {
    minCodes[length] = (minCodes[length - 1]! + counts[length - 1]!) << 1
  }

  const map = new Uint16Array(1 << maxBits)
  for (let symbol = 0; symbol < lengths.length; symbol += 1) {
    const length = lengths[symbol]!
    if (length === 0) continue
    // 码字左对齐到 maxBits 后，低位自由位的全部取值都填同一表项
    const start = minCodes[length]!++ << (maxBits - length)
    const end = start + (1 << (maxBits - length))
    for (let value = start; value < end; value += 1) {
      map[reverseBits(value, maxBits)] = (symbol << 4) | length
    }
  }

  return { map, mask: (1 << maxBits) - 1, incomplete }
}

let fixedTables: [HuffmanTable, HuffmanTable] | undefined

/** 固定 Huffman 表（RFC 1951 §3.2.6），构造一次复用 */
function getFixedTables(): [HuffmanTable, HuffmanTable] {
  if (!fixedTables) {
    const literalLengths = new Uint8Array(288)
    for (let symbol = 0; symbol < 288; symbol += 1) {
      literalLengths[symbol] = symbol < 144 ? 8 : symbol < 256 ? 9 : symbol < 280 ? 7 : 8
    }
    // 固定距离表 30 个 5 位码不完备属预期；未定义的码 30/31 不会出现在合法流中
    fixedTables = [buildHuffmanMap(literalLengths), buildHuffmanMap(new Uint8Array(30).fill(5))]
  }
  return fixedTables
}

/** 动态码表的不完备仅允许「单一 1 位码」特例，否则后续解码无界 */
function assertSingleCodeTable(
  table: HuffmanTable,
  lengths: Uint8Array,
  count: number,
  from: number
): void {
  if (table.incomplete === 0) return
  let zeros = 0
  let oneBitCodes = 0
  for (let index = from; index < from + count; index += 1) {
    const length = lengths[index]!
    if (length === 0) zeros += 1
    else if (length === 1) oneBitCodes += 1
  }
  if (count !== zeros + oneBitCodes) throw new RangeError('deflate 动态码表不完备')
}

/**
 * 解压 raw DEFLATE 数据。
 * @param sizeHint 原始字节长度提示（ZIP 中央目录的 size），仅用于预分配
 */
export function inflateRaw(data: Uint8Array, sizeHint = 0): Uint8Array {
  const totalBits = data.length * 8
  let out = new Uint8Array(Math.max(sizeHint, 1024))
  let offset = 0
  let pos = 0

  const ensure = (extra: number): void => {
    if (offset + extra <= out.length) return
    let capacity = out.length * 2
    while (capacity < offset + extra) capacity *= 2
    const grown = new Uint8Array(capacity)
    grown.set(out.subarray(0, offset))
    out = grown
  }

  /** 动态 Huffman 块头：码长码 + 两次游程解码出 literal/length 与 distance 码长 */
  const readDynamicTables = (): [HuffmanTable, HuffmanTable] => {
    const literalCount = readBits(data, pos, 5) + 257
    const distanceCount = readBits(data, pos + 5, 5) + 1
    const codeLengthCount = readBits(data, pos + 10, 4) + 4
    if (literalCount > 288 || distanceCount > 32) {
      throw new RangeError('deflate 动态码表符号数越界')
    }
    pos += 14

    const codeLengths = new Uint8Array(19)
    for (let index = 0; index < codeLengthCount; index += 1) {
      codeLengths[CODE_LENGTH_ORDER[index]!] = readBits(data, pos + index * 3, 3)
    }
    pos += codeLengthCount * 3
    const codeTable = buildHuffmanMap(codeLengths)

    const total = literalCount + distanceCount
    const lengths = new Uint8Array(total)
    let index = 0
    while (index < total) {
      const entry = codeTable.map[peekBits(data, pos) & codeTable.mask]!
      const codeLength = entry & 15
      if (codeLength === 0) throw new RangeError('deflate 码长码非法')
      pos += codeLength
      if (pos > totalBits) throw new RangeError('deflate 数据提前结束')
      const symbol = entry >>> 4
      if (symbol < 16) {
        lengths[index++] = symbol
        continue
      }
      // 16 复制上一码长，17 补零 3-10，18 补零 11-138
      if (symbol === 16 && index === 0) throw new RangeError('deflate 码长重复缺少前值')
      const fill = symbol === 16 ? lengths[index - 1]! : 0
      const base = symbol === 16 ? 3 : symbol === 17 ? 3 : 11
      const extraBits = symbol === 16 ? 2 : symbol === 17 ? 3 : 7
      const repeat = base + readBits(data, pos, extraBits)
      pos += extraBits
      if (pos > totalBits) throw new RangeError('deflate 数据提前结束')
      if (index + repeat > total) throw new RangeError('deflate 码长重复越界')
      lengths.fill(fill, index, index + repeat)
      index += repeat
    }

    const literal = buildHuffmanMap(lengths.subarray(0, literalCount))
    const distance = buildHuffmanMap(lengths.subarray(literalCount))
    assertSingleCodeTable(literal, lengths, literalCount, 0)
    assertSingleCodeTable(distance, lengths, distanceCount, literalCount)
    return [literal, distance]
  }

  let literal: HuffmanTable
  let distance: HuffmanTable
  let isFinal = false

  do {
    isFinal = readBits(data, pos, 1) === 1
    const blockType = readBits(data, pos + 1, 2)
    pos += 3
    if (pos > totalBits) throw new RangeError('deflate 数据提前结束')

    if (blockType === 0) {
      // stored：对齐到字节边界，LEN/NLEN 互补校验后原样拷贝
      pos = (pos + 7) & ~7
      const header = pos >>> 3
      const length = data[header]! | (data[header + 1]! << 8)
      const inverse = data[header + 2]! | (data[header + 3]! << 8)
      if ((~inverse & 0xffff) !== length) {
        throw new RangeError('deflate stored 块 LEN/NLEN 校验失败')
      }
      const start = header + 4
      const end = start + length
      if (end > data.length) throw new RangeError('deflate 数据提前结束')
      ensure(length)
      out.set(data.subarray(start, end), offset)
      offset += length
      pos = end * 8
      continue
    }

    if (blockType === 1) {
      ;[literal, distance] = getFixedTables()
    } else if (blockType === 2) {
      ;[literal, distance] = readDynamicTables()
    } else {
      throw new RangeError('deflate 非法块类型 3')
    }

    const literalMap = literal.map
    const literalMask = literal.mask
    const distanceMap = distance.map
    const distanceMask = distance.mask

    for (;;) {
      const entry = literalMap[peekBits(data, pos) & literalMask]!
      const codeLength = entry & 15
      if (codeLength === 0) throw new RangeError('deflate 字面量/长度码非法')
      pos += codeLength
      if (pos > totalBits) throw new RangeError('deflate 数据提前结束')
      const symbol = entry >>> 4
      if (symbol < 256) {
        ensure(1)
        out[offset++] = symbol
        continue
      }
      if (symbol === 256) break

      const lengthIndex = symbol - 257
      if (lengthIndex >= LENGTH_BASE.length) throw new RangeError(`deflate 非法长度码 ${symbol}`)
      let matchLength = LENGTH_BASE[lengthIndex]!
      const lengthExtra = LENGTH_EXTRA[lengthIndex]!
      if (lengthExtra !== 0) {
        matchLength += readBits(data, pos, lengthExtra)
        pos += lengthExtra
      }

      const distEntry = distanceMap[peekBits(data, pos) & distanceMask]!
      const distCodeLength = distEntry & 15
      if (distCodeLength === 0) throw new RangeError('deflate 距离码非法')
      pos += distCodeLength
      const distSymbol = distEntry >>> 4
      if (distSymbol >= DIST_BASE.length) throw new RangeError(`deflate 非法距离码 ${distSymbol}`)
      let dist = DIST_BASE[distSymbol]!
      const distExtra = DIST_EXTRA[distSymbol]!
      if (distExtra !== 0) {
        dist += readBits(data, pos, distExtra)
        pos += distExtra
      }
      if (pos > totalBits) throw new RangeError('deflate 数据提前结束')
      if (dist > offset) throw new RangeError('deflate 回引距离超出已解压输出')

      // 逐字节拷贝以支持 dist < matchLength 的重叠回引
      ensure(matchLength)
      for (let index = 0; index < matchLength; index += 1) {
        out[offset] = out[offset - dist]!
        offset += 1
      }
    }
  } while (!isFinal)

  return out.subarray(0, offset)
}
