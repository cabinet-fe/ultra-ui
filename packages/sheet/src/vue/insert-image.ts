import { message } from '@veltra/desktop'

import type { SheetImageType } from '../core/image'
import type { SheetContext } from '../tools/context'

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

/** MIME → hucre 图片类型；MIME 为空时回落扩展名 */
export function resolveImageType(file: File): SheetImageType | undefined {
  const mime = file.type.trim().toLowerCase()
  if (mime && MIME_TO_TYPE[mime]) return MIME_TO_TYPE[mime]
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.') + 1) : ''
  return EXT_TO_TYPE[ext.toLowerCase()]
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
  const active = ctx.getSelection().activeCell
  if (!active) {
    message.error('请先选择单元格')
    return undefined
  }
  const buffer = await file.arrayBuffer()
  return ctx.insertImage({
    data: new Uint8Array(buffer),
    type,
    anchor: { from: { row: active.row, col: active.col } }
  })
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
