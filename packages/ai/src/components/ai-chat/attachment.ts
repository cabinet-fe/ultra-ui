import {
  Archive,
  Excel,
  Pdf,
  PowerPoint,
  Txt,
  UnknownFile,
  Video,
  Word
} from '@veltra/icons/colorful'
import type { Component } from 'vue'

import type { ChatAttachment } from '../../chat/types'

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif', 'ico'])
const WORD_EXTS = new Set(['doc', 'docx'])
const EXCEL_EXTS = new Set(['xls', 'xlsx', 'xlsm', 'xlsb', 'csv'])
const PPT_EXTS = new Set(['ppt', 'pptx'])
const ARCHIVE_EXTS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz'])
const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv', 'mkv', 'avi'])
const TEXT_EXTS = new Set([
  'txt',
  'log',
  'md',
  'markdown',
  'json',
  'yml',
  'yaml',
  'xml',
  'js',
  'mjs',
  'cjs',
  'ts',
  'mts',
  'cts',
  'tsx',
  'jsx',
  'vue',
  'css',
  'scss',
  'sass',
  'less',
  'html',
  'htm',
  'ini',
  'toml',
  'sh',
  'bash',
  'zsh',
  'env',
  'sql',
  'py',
  'go',
  'rs',
  'java',
  'c',
  'cpp',
  'h',
  'hpp'
])

/** 读取非图片文本附件时允许提取的最大字节数（512KB） */
const MAX_TEXT_BYTES = 512 * 1024

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase()
}

/** 判断附件是否为图片类型 */
export function isImageAttachment(
  att: Pick<Partial<ChatAttachment>, 'name' | 'mimeType' | 'dataUrl'>
): boolean {
  if (att.mimeType?.startsWith('image/')) return true
  if (att.dataUrl?.startsWith('data:image/')) return true
  return att.name ? IMAGE_EXTS.has(getExtension(att.name)) : false
}

/** 按文件扩展名或 MIME 类型返回彩色文件图标 */
export function getAttachmentIcon(
  att: Pick<ChatAttachment, 'name'> & { mimeType?: string }
): Component {
  const ext = getExtension(att.name)
  const mime = att.mimeType ?? ''

  if (ext === 'pdf' || mime === 'application/pdf') return Pdf
  if (WORD_EXTS.has(ext) || mime.includes('wordprocessingml') || mime === 'application/msword') {
    return Word
  }
  if (
    EXCEL_EXTS.has(ext) ||
    mime.includes('spreadsheetml') ||
    mime === 'application/vnd.ms-excel'
  ) {
    return Excel
  }
  if (
    PPT_EXTS.has(ext) ||
    mime.includes('presentationml') ||
    mime === 'application/vnd.ms-powerpoint'
  ) {
    return PowerPoint
  }
  if (ARCHIVE_EXTS.has(ext)) return Archive
  if (VIDEO_EXTS.has(ext) || mime.startsWith('video/')) return Video
  if (
    TEXT_EXTS.has(ext) ||
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    mime === 'application/javascript'
  ) {
    return Txt
  }
  return UnknownFile
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
export async function readFileAsAttachment(file: File): Promise<ChatAttachment> {
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
