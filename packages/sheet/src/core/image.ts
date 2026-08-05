import type { CellAddress } from './address'

/** 支持的图片格式（与 hucre SheetImage.type 对齐） */
export type SheetImageType = 'png' | 'jpeg' | 'gif' | 'svg' | 'webp'

/** 图片锚点：from 必填；to 可选（跨单元格锚定） */
export interface SheetImageAnchor {
  from: CellAddress
  to?: CellAddress
}

/**
 * 浮动图片模型（hucre SheetImage + 模型侧 id）。
 * 数据存原始字节；渲染层自行转 objectURL。
 */
export interface SheetImage {
  id: string
  data: Uint8Array
  type: SheetImageType
  anchor: SheetImageAnchor
  /** 渲染宽高（px，96 DPI）；缺省由渲染层取自然尺寸 */
  width?: number
  height?: number
  altText?: string
  title?: string
}

/**
 * 插入入参：无 id（或 id 可选），由 insert-image 命令内部生成。
 * 其余字段与 SheetImage 对齐。
 */
export interface ImageInput {
  /** 可选；缺省由命令生成 */
  id?: string
  data: Uint8Array
  type: SheetImageType
  anchor: SheetImageAnchor
  width?: number
  height?: number
  altText?: string
  title?: string
}

/** 生成图片 id（crypto.randomUUID 优先，无 crypto 时回落时间戳） */
export function createImageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** 深拷贝锚点（结构平移 / 快照用，避免共享可变引用） */
export function cloneImageAnchor(anchor: SheetImageAnchor): SheetImageAnchor {
  return {
    from: { row: anchor.from.row, col: anchor.from.col },
    ...(anchor.to ? { to: { row: anchor.to.row, col: anchor.to.col } } : {})
  }
}

/** 浅拷贝图片元数据（data 字节共享；锚点独立） */
export function cloneSheetImage(image: SheetImage): SheetImage {
  return {
    id: image.id,
    data: image.data,
    type: image.type,
    anchor: cloneImageAnchor(image.anchor),
    ...(image.width != null ? { width: image.width } : {}),
    ...(image.height != null ? { height: image.height } : {}),
    ...(image.altText != null ? { altText: image.altText } : {}),
    ...(image.title != null ? { title: image.title } : {})
  }
}

/** 锚点是否相等（结构平移差量判断用） */
export function imageAnchorsEqual(a: SheetImageAnchor, b: SheetImageAnchor): boolean {
  if (a.from.row !== b.from.row || a.from.col !== b.from.col) return false
  if (!a.to && !b.to) return true
  if (!a.to || !b.to) return false
  return a.to.row === b.to.row && a.to.col === b.to.col
}
