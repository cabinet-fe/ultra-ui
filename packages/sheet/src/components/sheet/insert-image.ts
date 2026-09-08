import { message } from '@veltra/desktop'
import type { SheetImageAnchor, SheetImageType } from '@veltra/sheet-core/core/image'

import type { SheetContext } from '../../tools/context'

/** 文件选择 accept（工具栏弹层与右键菜单共用；不用裸 image/*） */
export const INSERT_IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.svg,.webp'

const MIME_TO_TYPE: Record<string, SheetImageType> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/webp': 'webp'
}

const EXT_TO_TYPE: Record<string, SheetImageType> = {
  png: 'png',
  jpg: 'jpeg',
  jpeg: 'jpeg',
  gif: 'gif',
  svg: 'svg',
  webp: 'webp'
}

/** MIME → sheet-core 图片类型（core/image 的 SheetImageType）；MIME 为空时回落扩展名 */
export function resolveImageType(file: File): SheetImageType | undefined {
  const mime = file.type.trim().toLowerCase()
  if (mime && MIME_TO_TYPE[mime]) return MIME_TO_TYPE[mime]
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.') + 1) : ''
  return EXT_TO_TYPE[ext.toLowerCase()]
}

/** 取当前活动格锚点；无选区时 message.error 提示并返回 undefined */
function activeCellAnchor(ctx: SheetContext): SheetImageAnchor | undefined {
  const active = ctx.getSelection().activeCell
  if (!active) {
    message.error('请先选择单元格')
    return undefined
  }
  return { from: { row: active.row, col: active.col } }
}

/**
 * 从本地 File 插入浮动图片：读字节 → 映射类型 → 锚定活动格 → ctx.insertImage。
 * 不支持的格式 / 无活动格时 message.error 提示并返回 undefined。
 */
export async function insertImageFromFile(
  ctx: SheetContext,
  file: File
): Promise<string | undefined> {
  const type = resolveImageType(file)
  if (!type) {
    message.error('不支持的图片格式，请选择 png / jpeg / gif / svg / webp')
    return undefined
  }
  const anchor = activeCellAnchor(ctx)
  if (!anchor) return undefined
  const buffer = await file.arrayBuffer()
  return ctx.insertImage({ data: new Uint8Array(buffer), type, anchor })
}

/**
 * 从 URL 插入浮动图片：URL 直存 src（渲染层直接引用），data 为空字节、
 * type 仅作提示（取 URL 路径扩展名，未知按 png）。锚定活动格，经 ctx.insertImage 写入。
 * 空串 / 非法 URL / 无活动格时 message.error 提示并返回 undefined。
 */
export function insertImageFromUrl(ctx: SheetContext, url: string): string | undefined {
  const src = url.trim()
  if (!src) {
    message.error('请输入图片 URL')
    return undefined
  }
  let pathname: string
  try {
    pathname = new URL(src).pathname
  } catch {
    message.error('请输入有效的图片 URL')
    return undefined
  }
  const anchor = activeCellAnchor(ctx)
  if (!anchor) return undefined
  const ext = pathname.includes('.') ? pathname.slice(pathname.lastIndexOf('.') + 1) : ''
  const type = EXT_TO_TYPE[ext.toLowerCase()] ?? 'png'
  return ctx.insertImage({ data: new Uint8Array(), type, src, anchor })
}

/**
 * 拉起系统文件选择框（右键菜单用；不用 UFilePicker——无编程式打开 API）。
 * 选中文件后走 insertImageFromFile。
 */
export function pickAndInsertImage(ctx: SheetContext): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = INSERT_IMAGE_ACCEPT
  input.hidden = true
  const cleanup = (): void => {
    input.remove()
  }
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    cleanup()
    if (file) void insertImageFromFile(ctx, file)
  })
  // 取消选择时也清理节点（focus 回窗口后延迟判定）
  window.addEventListener(
    'focus',
    () => {
      setTimeout(() => {
        if (document.body.contains(input) && !input.files?.length) cleanup()
      }, 300)
    },
    { once: true }
  )
  document.body.appendChild(input)
  input.click()
}
