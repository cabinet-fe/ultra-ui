import { OfdParseError } from './error'

const EOCD_SIGNATURE = 0x06054b50
const CEN_SIGNATURE = 0x02014b50
const LOC_SIGNATURE = 0x04034b50

const EOCD_LENGTH = 22
const CEN_HEADER_LENGTH = 46
const LOC_HEADER_LENGTH = 30
/** EOCD 注释区最大长度，找 EOCD 时最多向前扫这么多字节 */
const EOCD_COMMENT_MAX = 0xffff

const STORED_METHOD = 0
const DEFLATE_METHOD = 8

/** ZIP 条目解析出的元信息（方法为 ZIP 原始值：0 stored / 8 deflate） */
export interface OfdZipEntry {
  name: string
  method: number
  compressedSize: number
  size: number
}

/** 已打开的 OFD ZIP 容器：结构一次性解析，条目内容按需解压 */
export interface OfdZip {
  entries: readonly OfdZipEntry[]
  has(name: string): boolean
  read(name: string): Promise<Uint8Array>
  text(name: string): Promise<string>
}

interface ZipEntryRecord extends OfdZipEntry {
  localHeaderOffset: number
}

/** 解析 ZIP 结构（EOCD / 中央目录）；条目数据在 read 时才解压 */
export function openOfdZip(data: Uint8Array): OfdZip {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const eocdOffset = findEocdOffset(data)
  const entryCount = view.getUint16(eocdOffset + 10, true)
  const records = parseCentralDirectory(data, view, eocdOffset, entryCount)
  // 生成器存在同容器内路径大小写不一致的产出（WPS 导出实证 Doc_0 / DOC_0），
  // 条目查找按大小写不敏感兜底，书写规范的文件不受影响
  const byName = new Map(records.map((record) => [record.name.toLowerCase(), record]))

  return {
    entries: records,
    has: (name) => byName.has(name.toLowerCase()),
    read: (name) => readEntry(data, view, byName.get(name.toLowerCase()), name),
    text: async (name) =>
      new TextDecoder().decode(await readEntry(data, view, byName.get(name.toLowerCase()), name))
  }
}

function findEocdOffset(data: Uint8Array): number {
  const minStart = Math.max(0, data.length - EOCD_LENGTH - EOCD_COMMENT_MAX)
  for (let offset = data.length - EOCD_LENGTH; offset >= minStart; offset--) {
    if (readU32(data, offset) === EOCD_SIGNATURE) return offset
  }
  throw new OfdParseError('not-zip', '未找到 ZIP End of Central Directory，输入不是合法的 ZIP 容器')
}

function parseCentralDirectory(
  data: Uint8Array,
  view: DataView,
  eocdOffset: number,
  entryCount: number
): ZipEntryRecord[] {
  let offset = view.getUint32(eocdOffset + 16, true)
  const records: ZipEntryRecord[] = []
  for (let index = 0; index < entryCount; index++) {
    if (offset + CEN_HEADER_LENGTH > data.length) {
      throw new OfdParseError('truncated', `中央目录第 ${index} 个条目越界，数据被截断`)
    }
    if (view.getUint32(offset, true) !== CEN_SIGNATURE) {
      throw new OfdParseError('bad-central-directory', `中央目录第 ${index} 个条目签名不合法`)
    }
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const size = view.getUint32(offset + 24, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localHeaderOffset = view.getUint32(offset + 42, true)
    const recordLength = CEN_HEADER_LENGTH + nameLength + extraLength + commentLength
    if (offset + recordLength > data.length) {
      throw new OfdParseError('truncated', `中央目录第 ${index} 个条目不完整，数据被截断`)
    }
    const name = new TextDecoder().decode(
      data.subarray(offset + CEN_HEADER_LENGTH, offset + CEN_HEADER_LENGTH + nameLength)
    )
    records.push({ name, method, compressedSize, size, localHeaderOffset })
    offset += recordLength
  }
  return records
}

function readEntry(
  data: Uint8Array,
  view: DataView,
  record: ZipEntryRecord | undefined,
  name: string
): Promise<Uint8Array> {
  if (!record) throw new OfdParseError('missing-entry', `容器中不存在条目 ${name}`)
  const start = entryDataStart(data, view, record)
  const compressed = data.subarray(start, start + record.compressedSize)
  if (record.method === STORED_METHOD) return Promise.resolve(compressed)
  if (record.method === DEFLATE_METHOD) return inflateRaw(compressed, name)
  return Promise.reject(
    new OfdParseError(
      'unsupported-compression',
      `条目 ${name} 使用不支持的压缩方法 ${record.method}`
    )
  )
}

/** 定位条目数据起点：跳过本地文件头（长度以本地头声明的为准） */
function entryDataStart(data: Uint8Array, view: DataView, record: ZipEntryRecord): number {
  const offset = record.localHeaderOffset
  if (offset + LOC_HEADER_LENGTH > data.length) {
    throw new OfdParseError('truncated', `条目 ${record.name} 的本地文件头越界`)
  }
  if (view.getUint32(offset, true) !== LOC_SIGNATURE) {
    throw new OfdParseError('bad-local-header', `条目 ${record.name} 的本地文件头签名不合法`)
  }
  const start =
    offset +
    LOC_HEADER_LENGTH +
    view.getUint16(offset + 26, true) +
    view.getUint16(offset + 28, true)
  if (start + record.compressedSize > data.length) {
    throw new OfdParseError('truncated', `条目 ${record.name} 的数据被截断`)
  }
  return start
}

/** 用原生 DecompressionStream 解压 deflate-raw 数据 */
async function inflateRaw(compressed: Uint8Array, name: string): Promise<Uint8Array> {
  try {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(compressed)
        controller.close()
      }
    }).pipeThrough(new DecompressionStream('deflate-raw'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch (cause) {
    throw new OfdParseError('truncated', `条目 ${name} 的 deflate 数据无法解压`, { cause })
  }
}

function readU32(data: Uint8Array, offset: number): number {
  return (
    ((data[offset + 3]! << 24) |
      (data[offset + 2]! << 16) |
      (data[offset + 1]! << 8) |
      data[offset]!) >>>
    0
  )
}
