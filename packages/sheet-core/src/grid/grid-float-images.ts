import type { FloatObject, ListTable } from '@infinite-table/core'

import { cloneImageAnchor, type SheetImage, type SheetImageType } from '../core/image'
import type { Sheet } from '../core/sheet'

/** MIME：模型 type → Blob type（objectURL） */
const IMAGE_MIME: Record<SheetImageType, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp'
}

export interface GridFloatImagesOptions {
  table: ListTable
  sheet: Sheet
  /** 只读模式：图片可选中查看，但禁用拖动（不写锚点） */
  readonly?: boolean
}

/** 模型图片 → 引擎浮动对象（kind 固定 image；无 to 时以 from 兜底，跨度由 size 表达） */
function toFloatObject(image: SheetImage, src: string): FloatObject {
  return {
    id: image.id,
    kind: 'image',
    anchor: {
      from: { col: image.anchor.from.col, row: image.anchor.from.row },
      to: image.anchor.to
        ? { col: image.anchor.to.col, row: image.anchor.to.row }
        : { col: image.anchor.from.col, row: image.anchor.from.row },
      offsetX: image.anchor.from.offsetX ?? 0,
      offsetY: image.anchor.from.offsetY ?? 0
    },
    ...(image.width != null || image.height != null
      ? { size: { width: image.width ?? 0, height: image.height ?? 0 } }
      : {}),
    fit: image.fit ?? 'fill',
    src,
    ...(image.altText != null ? { alt: image.altText } : {}),
    ...(image.title != null ? { title: image.title } : {})
  }
}

/**
 * 浮动图片桥：Sheet 模型图片 ↔ 引擎 FloatObjectLayer（canvas 浮动层）。
 * - 数据：src URL 来源直用；字节来源转 objectURL（同引用复用，换字节重建）；
 * - 同步：image-change / content-reset / structure-change / frozen-change 全量对齐模型
 *   （签名判重跳过无变化项）；滚动/resize 跟随与选中/拖拽交互由引擎浮动层内置；
 * - 拖拽结束：引擎换算的新锚点写回 `sheet.updateImage`（可 undo）；模型无 to 的图
 *   不引入引擎合成的 to（保持跨度语义，尺寸走 size）；
 * - 自然尺寸：宽高与 to 都缺失的图，加载完成后按自然尺寸回写 size（等价旧层为
 *   load 后回写路径）；
 * - 只读：选中查看可用，禁拖动（引擎 isReadonly）。
 */
export class GridFloatImages {
  private readonly table: ListTable
  private readonly sheet: Sheet
  private readonly isReadonly: boolean
  /** id → objectURL（字节来源图）；同引用复用，换字节重建 */
  private readonly urls = new Map<string, string>()
  /** 与 urls 对应的 data 引用：同引用复用 objectURL */
  private readonly dataRefs = new Map<string, Uint8Array>()
  /** id → 已同步对象签名（判重跳过） */
  private readonly signatures = new Map<string, string>()
  /** 缺尺寸对象的 id 集合（自然尺寸回写后移除） */
  private readonly pendingNaturalSize = new Set<string>()
  private readonly disposers: (() => void)[] = []
  private released = false

  constructor(options: GridFloatImagesOptions) {
    this.table = options.table
    this.sheet = options.sheet
    this.isReadonly = options.readonly ?? false
    this.table.floatObjects.isReadonly = this.isReadonly

    const layer = this.table.floatObjects
    this.disposers.push(
      layer.onDragEnd((event) => this.commitDrag(event.id, event.anchor)),
      this.table.imageService.onImageLoad((event) =>
        this.applyNaturalSize(event.url, event.width, event.height)
      )
    )
  }

  /** 当前选中图片 id（无选中为 null） */
  getSelectedId(): string | null {
    return this.table.floatObjects.getSelectedId()
  }

  /** Delete/Backspace 删除选中图片（模型命令，可 undo）；无选中或只读为空操作 */
  removeSelected(): void {
    if (this.isReadonly) return
    const id = this.getSelectedId()
    if (!id) return
    this.sheet.removeImage(id)
  }

  /** 全量对齐模型（sync 调用方保证可见性） */
  sync(): void {
    if (this.released) return
    const images = this.sheet.getImages()
    const alive = new Set(images.map((image) => image.id))

    for (const id of this.signatures.keys()) {
      if (alive.has(id)) continue
      this.detach(id)
    }

    const layer = this.table.floatObjects
    for (const image of images) {
      const object = toFloatObject(image, this.ensureImageUrl(image))
      const signature = JSON.stringify(object)
      if (this.signatures.get(image.id) === signature) continue
      if (layer.get(image.id)) {
        layer.update(image.id, object)
      } else {
        layer.add(object)
      }
      this.trackNaturalSize(image)
      this.signatures.set(image.id, signature)
    }
  }

  dispose(): void {
    if (this.released) return
    this.released = true
    for (const dispose of this.disposers) dispose()
    this.disposers.length = 0
    for (const url of this.urls.values()) URL.revokeObjectURL(url)
    this.urls.clear()
    this.dataRefs.clear()
    this.signatures.clear()
    this.pendingNaturalSize.clear()
  }

  /** 拖拽结束写模型：平移 from（格内余量写 offsetX/offsetY），有 to 则同 delta 平移保持跨度 */
  private commitDrag(id: string, anchor: FloatObject['anchor']): void {
    const image = this.sheet.getImage(id)
    if (!image) return
    const current = cloneImageAnchor(image.anchor)
    const from = {
      row: anchor.from.row,
      col: anchor.from.col,
      ...(anchor.offsetX > 0 ? { offsetX: anchor.offsetX } : {}),
      ...(anchor.offsetY > 0 ? { offsetY: anchor.offsetY } : {})
    }
    if (current.to) {
      this.sheet.updateImage(id, {
        anchor: { from, to: { row: anchor.to.row, col: anchor.to.col } }
      })
    } else {
      this.sheet.updateImage(id, { anchor: { from } })
    }
  }

  /** 图片渲染 URL：src 来源直用；字节来源转 objectURL（同引用复用，换字节重建） */
  private ensureImageUrl(image: SheetImage): string {
    if (image.src != null) return image.src
    const existing = this.urls.get(image.id)
    if (existing && this.dataRefs.get(image.id) === image.data) return existing
    if (existing) URL.revokeObjectURL(existing)
    const blob = new Blob([image.data as BlobPart], { type: IMAGE_MIME[image.type] })
    const url = URL.createObjectURL(blob)
    this.urls.set(image.id, url)
    this.dataRefs.set(image.id, image.data)
    return url
  }

  /** 宽高与 to 都缺失：登记自然尺寸回写（加载完成后按位图尺寸补 size） */
  private trackNaturalSize(image: SheetImage): void {
    if (image.width != null || image.height != null || image.anchor.to) {
      this.pendingNaturalSize.delete(image.id)
      return
    }
    this.pendingNaturalSize.add(image.id)
  }

  /** 自然尺寸回写：仅对登记过的缺尺寸对象生效一次 */
  private applyNaturalSize(url: string, width: number, height: number): void {
    if (this.pendingNaturalSize.size === 0) return
    for (const id of this.pendingNaturalSize) {
      const object = this.table.floatObjects.get(id)
      if (!object || object.src !== url) continue
      this.pendingNaturalSize.delete(id)
      this.table.floatObjects.update(id, { size: { width, height } })
      this.signatures.set(id, JSON.stringify(this.table.floatObjects.get(id)))
      return
    }
  }

  /** 移除对象并释放 objectURL（模型已删除） */
  private detach(id: string): void {
    this.signatures.delete(id)
    this.pendingNaturalSize.delete(id)
    this.table.floatObjects.remove(id)
    const url = this.urls.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      this.urls.delete(id)
      this.dataRefs.delete(id)
    }
  }
}
