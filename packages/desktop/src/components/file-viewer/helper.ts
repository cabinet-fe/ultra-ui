import type { FileViewerItem, FileViewerKind } from '../../types/file-viewer'

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif', 'ico'])

const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv', 'mkv'])

const SHEET_EXTS = new Set(['xlsx', 'xlsm', 'xlsb', 'csv'])

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
  'ts',
  'tsx',
  'jsx',
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
  'sql'
])

export function getExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase()
}

export function inferKind(name: string, explicit?: FileViewerKind): FileViewerKind {
  if (explicit) return explicit
  const ext = getExtension(name)
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  if (SHEET_EXTS.has(ext)) return 'sheet'
  if (ext === 'docx') return 'docx'
  if (ext === 'ofd') return 'ofd'
  if (TEXT_EXTS.has(ext)) return 'text'
  return 'text'
}

export const FILE_VIEWER_KIND_LABEL: Record<FileViewerKind, string> = {
  image: 'IMG',
  video: 'MP4',
  pdf: 'PDF',
  sheet: 'XLS',
  docx: 'DOC',
  ofd: 'OFD',
  text: 'TXT'
}

/** 规范化数据源为 ArrayBuffer，可被 AbortController 中断（仅 URL fetch 场景生效） */
export async function toArrayBuffer(
  src: FileViewerItem['src'],
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  if (typeof src === 'string') {
    const res = await fetch(src, { signal })
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
    }
    return await res.arrayBuffer()
  }
  if (src instanceof ArrayBuffer) return src
  if (src instanceof Uint8Array) {
    // 复制底层以切断共享引用，防止外部修改影响预览
    return src.slice().buffer as ArrayBuffer
  }
  // File/Blob
  return await src.arrayBuffer()
}

/** 返回用于 <img> / <video> 等标签 src 的 URL；二进制会创建 ObjectURL 并返回 revoke 钩子 */
export function toBlobUrl(
  src: FileViewerItem['src'],
  mime?: string
): { url: string; revoke: () => void } {
  if (typeof src === 'string') {
    return { url: src, revoke: () => {} }
  }
  let blob: Blob
  if (src instanceof Blob) {
    blob = src
  } else if (src instanceof ArrayBuffer) {
    blob = new Blob([src], { type: mime ?? 'application/octet-stream' })
  } else {
    // Uint8Array: 复制到新的 ArrayBuffer，避免与外部共享底层
    const copy = new Uint8Array(src.byteLength)
    copy.set(src)
    blob = new Blob([copy.buffer], { type: mime ?? 'application/octet-stream' })
  }
  const url = URL.createObjectURL(blob)
  return { url, revoke: () => URL.revokeObjectURL(url) }
}

/** 缩放下限（与工具栏 MIN/MAX 联动） */
export const ZOOM_MIN = 0.5

/** 缩放上限 */
export const ZOOM_MAX = 3

/** 每次缩放固定增减 10% */
export const ZOOM_STEP = 0.1

/** clampZoom 的取整精度：两位小数 */
const ZOOM_PRECISION = 100

/** 将缩放级别收敛到 [ZOOM_MIN, ZOOM_MAX] 区间并保留两位小数 */
export function clampZoom(level: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(level * ZOOM_PRECISION) / ZOOM_PRECISION))
}

/** Chrome canvas 物理尺寸上限：单边最大像素数 */
const RENDER_MAX_SIDE = 32767

/** Chrome canvas 物理尺寸上限：最大面积（像素数） */
const RENDER_MAX_AREA = 2 ** 28

/**
 * 计算渲染降采样系数：单位尺寸 width/height 按 scale 放大后若超出
 * Chrome canvas 上限（单边 32767、面积 2^28），返回 (0, 1) 的降采样系数，
 * 实际渲染 scale 应为 `scale * 返回值`；未超限时返回 1。纯函数。
 */
export function clampRenderScale(width: number, height: number, scale: number): number {
  return Math.min(
    1,
    RENDER_MAX_SIDE / (width * scale),
    RENDER_MAX_SIDE / (height * scale),
    Math.sqrt(RENDER_MAX_AREA / (width * scale * height * scale))
  )
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`
}

/** 触发浏览器下载 */
export async function downloadFile(file: FileViewerItem): Promise<void> {
  let href: string
  let revoke: (() => void) | undefined
  if (typeof file.src === 'string') {
    href = file.src
  } else {
    const url = toBlobUrl(file.src, file.mime)
    href = url.url
    revoke = url.revoke
  }
  const a = document.createElement('a')
  a.href = href
  a.download = file.name
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (revoke) setTimeout(revoke, 4000)
}
