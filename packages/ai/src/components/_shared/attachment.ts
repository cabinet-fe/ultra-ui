import type { ChatAttachment } from '../../chat/types'

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif', 'ico'])

/** 读取非图片文本附件时允许提取的最大字节数（512KB） */
const MAX_TEXT_BYTES = 512 * 1024

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase()
}

export function isImageAttachment(
  att: Pick<Partial<ChatAttachment>, 'name' | 'mimeType' | 'dataUrl'>
): boolean {
  if (att.mimeType?.startsWith('image/')) return true
  if (att.dataUrl?.startsWith('data:image/')) return true
  return att.name ? IMAGE_EXTS.has(getExtension(att.name)) : false
}

/** 无扩展名附件的徽标兜底文案 */
const NO_EXT_BADGE = 'FILE'

/** 附件扩展名徽标文案：输入区与消息气泡共用（notes.md → MD、data.zip → ZIP） */
export function getAttachmentExtBadge(att: Pick<ChatAttachment, 'name'>): string {
  const idx = att.name.lastIndexOf('.')
  // 无扩展名：没有点、点在开头（.gitignore 类隐藏文件）或结尾（archive.）
  if (idx <= 0 || idx === att.name.length - 1) return NO_EXT_BADGE
  return att.name.slice(idx + 1).toUpperCase()
}

/** 格式化文件字节大小 */
export function formatAttachmentSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index++
  }
  const rounded = Math.round(value * 10) / 10
  return `${rounded < 10 && !Number.isInteger(rounded) ? rounded.toFixed(1) : Math.round(value)} ${units[index]}`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer()
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result instanceof ArrayBuffer ? reader.result : new ArrayBuffer(0))
    }
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'))
    reader.readAsArrayBuffer(file)
  })
}

/** 尝试在本地从二进制内容提取 UTF-8 文本；二进制或非法 UTF-8 返回 undefined */
function extractLocalText(buffer: ArrayBuffer): string | undefined {
  if (buffer.byteLength === 0) return undefined
  const truncated = buffer.byteLength > MAX_TEXT_BYTES
  const view = new Uint8Array(buffer, 0, truncated ? MAX_TEXT_BYTES : buffer.byteLength)
  if (view.includes(0)) return undefined

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(view)
    return truncated ? `${text}\n...(文件过大，已截断)` : text
  } catch {
    return undefined
  }
}

/**
 * 将本地 File 转为 ChatAttachment：
 * - 图片文件转为 base64 dataUrl（可直传模型接口）
 * - 非图片文件在本地提取文本上下文（不传文件体，dataUrl 置空）
 */
async function readFileAsAttachment(file: File): Promise<ChatAttachment> {
  if (isImageAttachment({ name: file.name, mimeType: file.type })) {
    const dataUrl = await readFileAsDataUrl(file)
    return { name: file.name, mimeType: file.type || 'image/png', size: file.size, dataUrl }
  }

  const buffer = await readFileAsArrayBuffer(file)
  const textContent = extractLocalText(buffer)
  return {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    dataUrl: '',
    ...(textContent !== undefined ? { textContent } : {})
  }
}

/** 批量将本地 File 转为 ChatAttachment（超限或读取失败时打印警告并忽略） */
export async function readFilesAsAttachments(
  files: File[],
  maxAttachmentSize = 10 * 1024 * 1024,
  logPrefix = 'UAiChat'
): Promise<ChatAttachment[]> {
  const validFiles = files.filter((file) => {
    if (file.size > maxAttachmentSize) {
      console.warn(`[${logPrefix}] 附件 ${file.name} 超过大小限制，已忽略`)
      return false
    }
    return true
  })

  if (!validFiles.length) return []

  const results = await Promise.allSettled(validFiles.map((file) => readFileAsAttachment(file)))
  const attachments: ChatAttachment[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      attachments.push(result.value)
    } else {
      console.warn(`[${logPrefix}] 附件读取失败，已忽略`, result.reason)
    }
  }
  return attachments
}
