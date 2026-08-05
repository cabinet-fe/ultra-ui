import { ListTable } from '@visactor/vtable'

import type { CellAddress } from '../core/address'
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

/** 选中框颜色（对齐 VTable selectionStyle.cellBorderColor） */
const SELECTION_COLOR = '#2170E7'

/** 拖动阈值（px）：超过后视为拖拽而非纯选中 */
const DRAG_THRESHOLD_PX = 3

export interface ImageLayerOptions {
  container: HTMLElement
  table: ListTable
  sheet: Sheet
  /** 模型地址 → VTable 坐标（含行号列 / 列头偏移） */
  toTableCoord: (addr: CellAddress) => { col: number; row: number }
  /** VTable 坐标 → 模型地址；行号列/列头返回 null */
  toSheetAddr: (col: number, row: number) => CellAddress | null
}

/** 视口相对矩形（叠层 left/top/width/height） */
interface ImageRect {
  left: number
  top: number
  width: number
  height: number
}

interface DragSession {
  id: string
  pointerId: number
  startClientX: number
  startClientY: number
  originLeft: number
  originTop: number
  moved: boolean
}

/**
 * 浮动图片 DOM 叠层：绝对定位于 grid 容器内，按锚点单元格实时布置。
 *
 * - 定位：`computeImageRect`——from 左上 + 格内像素偏移（offsetX/offsetY）；
 *   宽高优先取 `image.width/height`，缺失且有 `to` 时按 from→to 跨度兜底
 * - 数据：`Map<id, objectURL>` 缓存，dispose 时 revoke
 * - LRU：隐藏只置脏，激活时一次性重排
 * - 交互：点击选中；选中后拖动经 `sheet.updateImage` 平移锚点（含格内余量，可 undo）；
 *   Delete/Backspace 经 `sheet.removeImage` 删除
 */
export class ImageLayer {
  private readonly container: HTMLElement
  private readonly table: ListTable
  private readonly sheet: Sheet
  private readonly toTableCoord: (addr: CellAddress) => { col: number; row: number }
  private readonly toSheetAddr: (col: number, row: number) => CellAddress | null
  private readonly root: HTMLDivElement
  private readonly urls = new Map<string, string>()
  /** 与 urls 对应的 data 引用：同引用复用 objectURL，换字节则重建 */
  private readonly dataRefs = new Map<string, Uint8Array>()
  private readonly nodes = new Map<string, HTMLDivElement>()
  private readonly disposers: (() => void)[] = []
  private visible = true
  private dirty = false
  private released = false
  private rearrangeScheduled = false
  private selectedId: string | null = null
  private drag: DragSession | null = null
  private resizeObserver: ResizeObserver | undefined

  constructor(options: ImageLayerOptions) {
    this.container = options.container
    this.table = options.table
    this.sheet = options.sheet
    this.toTableCoord = options.toTableCoord
    this.toSheetAddr = options.toSheetAddr

    this.root = document.createElement('div')
    this.root.className = 'u-sheet__image-layer'
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: '2'
    } satisfies Partial<CSSStyleDeclaration>)
    this.container.appendChild(this.root)

    this.bindTableEvents()
    this.bindSheetEvents()
    this.bindInteraction()
    this.bindResize()
    this.syncFromModel()
  }

  /** 当前选中图片 id（无选中为 null） */
  getSelectedId(): string | null {
    return this.selectedId
  }

  /** LRU 可见性：隐藏只置脏；激活时若脏则一次性同步 */
  setVisible(on: boolean): void {
    if (this.released) return
    this.visible = on
    this.root.style.visibility = on ? 'visible' : 'hidden'
    if (on && this.dirty) {
      this.dirty = false
      this.syncFromModel()
    }
  }

  /** 同步执行挂起的重排（测试 / 需要立即可见时） */
  flush(): void {
    if (this.released) return
    this.rearrangeScheduled = false
    if (!this.visible) {
      this.dirty = true
      return
    }
    this.layoutAll()
  }

  dispose(): void {
    if (this.released) return
    this.released = true
    this.endDragListeners()
    this.drag = null
    for (const dispose of this.disposers) dispose()
    this.disposers.length = 0
    this.resizeObserver?.disconnect()
    this.resizeObserver = undefined
    for (const url of this.urls.values()) URL.revokeObjectURL(url)
    this.urls.clear()
    this.dataRefs.clear()
    this.nodes.clear()
    this.selectedId = null
    this.root.remove()
  }

  // ─── 订阅 ───────────────────────────────────────────────

  private bindTableEvents(): void {
    const onScroll = (): void => this.scheduleRearrange()
    const onResize = (): void => this.scheduleRearrange()
    this.table.on(ListTable.EVENT_TYPE.SCROLL, onScroll)
    this.table.on(ListTable.EVENT_TYPE.RESIZE_ROW_END, onResize)
    this.table.on(ListTable.EVENT_TYPE.RESIZE_COLUMN_END, onResize)
    this.disposers.push(() => {
      this.table.off(ListTable.EVENT_TYPE.SCROLL, onScroll)
      this.table.off(ListTable.EVENT_TYPE.RESIZE_ROW_END, onResize)
      this.table.off(ListTable.EVENT_TYPE.RESIZE_COLUMN_END, onResize)
    })
  }

  private bindSheetEvents(): void {
    // 结构平移只发 structure-change（不发 image-change）——必须同时订阅
    this.disposers.push(
      this.sheet.on('image-change', () => this.scheduleSync()),
      this.sheet.on('content-reset', () => this.scheduleSync()),
      this.sheet.on('structure-change', () => this.scheduleSync()),
      this.sheet.on('frozen-change', () => this.scheduleRearrange())
    )
  }

  private bindResize(): void {
    if (typeof ResizeObserver === 'undefined') return
    this.resizeObserver = new ResizeObserver(() => this.scheduleRearrange())
    this.resizeObserver.observe(this.container)
  }

  private bindInteraction(): void {
    const onPointerDown = (event: PointerEvent): void => {
      if (this.released || !this.visible) return
      const target = event.target
      if (!(target instanceof Element)) return
      const wrap = target.closest<HTMLElement>('[data-sheet-image-id]')
      if (wrap && this.root.contains(wrap)) {
        // 拦截：不进 VTable 选区
        event.preventDefault()
        event.stopPropagation()
        const id = wrap.dataset.sheetImageId
        if (!id) return
        this.select(id)
        this.beginDrag(event, id, wrap)
        return
      }
      // 点击网格其他位置 → 取消选中
      if (this.selectedId) this.clearSelection()
    }
    // capture：赶在 VTable 之前拿到图片点击；穿透区（pointer-events:none）不触发
    this.container.addEventListener('pointerdown', onPointerDown, true)
    this.disposers.push(() =>
      this.container.removeEventListener('pointerdown', onPointerDown, true)
    )

    const onKeyDown = (event: KeyboardEvent): void => {
      if (!this.selectedId || this.released || !this.visible) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      event.preventDefault()
      event.stopPropagation()
      const id = this.selectedId
      this.clearSelection()
      this.sheet.removeImage(id)
    }
    this.container.addEventListener('keydown', onKeyDown)
    this.disposers.push(() => this.container.removeEventListener('keydown', onKeyDown))
  }

  // ─── 拖动 ────────────────────────────────────────────────

  private readonly onDragPointerMove = (event: PointerEvent): void => {
    const session = this.drag
    if (!session || event.pointerId !== session.pointerId) return
    const wrap = this.nodes.get(session.id)
    if (!wrap) return

    const dx = event.clientX - session.startClientX
    const dy = event.clientY - session.startClientY
    if (!session.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
    session.moved = true

    wrap.style.left = `${session.originLeft + dx}px`
    wrap.style.top = `${session.originTop + dy}px`
    wrap.style.cursor = 'grabbing'
  }

  private readonly onDragPointerUp = (event: PointerEvent): void => {
    const session = this.drag
    if (!session || event.pointerId !== session.pointerId) return
    this.endDragListeners()
    this.drag = null

    const wrap = this.nodes.get(session.id)
    if (wrap) {
      wrap.style.cursor = 'move'
      try {
        wrap.releasePointerCapture(session.pointerId)
      } catch {
        // 已释放 / 未捕获时忽略
      }
    }

    if (!session.moved) return
    this.commitDrag(session.id, wrap)
  }

  private beginDrag(event: PointerEvent, id: string, wrap: HTMLElement): void {
    // 结束上一次未完成的拖（极端情况）
    if (this.drag) {
      this.endDragListeners()
      this.drag = null
    }

    const originLeft = Number.parseFloat(wrap.style.left) || 0
    const originTop = Number.parseFloat(wrap.style.top) || 0
    this.drag = {
      id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originLeft,
      originTop,
      moved: false
    }
    wrap.setPointerCapture?.(event.pointerId)
    window.addEventListener('pointermove', this.onDragPointerMove, true)
    window.addEventListener('pointerup', this.onDragPointerUp, true)
    window.addEventListener('pointercancel', this.onDragPointerUp, true)
  }

  private endDragListeners(): void {
    window.removeEventListener('pointermove', this.onDragPointerMove, true)
    window.removeEventListener('pointerup', this.onDragPointerUp, true)
    window.removeEventListener('pointercancel', this.onDragPointerUp, true)
  }

  /**
   * 落点：以图片左上角视口坐标反查单元格，平移 from（有 to 则同 delta），
   * 落点相对该格左上的像素余量写回 offsetX/offsetY（负值 clamp 到 0），
   * 保持宽高与行列跨度。
   */
  private commitDrag(id: string, wrap: HTMLDivElement | undefined): void {
    const image = this.sheet.getImage(id)
    if (!image || !wrap) {
      if (image) this.layoutOne(id, image)
      return
    }

    const left = Number.parseFloat(wrap.style.left) || 0
    const top = Number.parseFloat(wrap.style.top) || 0
    const cell = this.table.getCellAtRelativePosition(left, top)
    const newFrom = this.toSheetAddr(cell.col, cell.row)

    if (!newFrom) {
      // 落在行号/列头：回弹到原锚点布局
      this.layoutOne(id, image)
      return
    }

    // 格内像素余量 = 落点 − 目标格左上；越出左上边界时 clamp 到 0
    const cellRect = this.table.getCellRelativeRect(cell.col, cell.row)
    const offsetX = Math.max(0, Math.round(left - cellRect.left))
    const offsetY = Math.max(0, Math.round(top - cellRect.top))

    const oldFrom = image.anchor.from
    const dRow = newFrom.row - oldFrom.row
    const dCol = newFrom.col - oldFrom.col
    const sameOffset = (oldFrom.offsetX ?? 0) === offsetX && (oldFrom.offsetY ?? 0) === offsetY
    if (dRow === 0 && dCol === 0 && sameOffset) {
      this.layoutOne(id, image)
      return
    }

    const anchor = cloneImageAnchor(image.anchor)
    anchor.from = {
      row: oldFrom.row + dRow,
      col: oldFrom.col + dCol,
      ...(offsetX > 0 ? { offsetX } : {}),
      ...(offsetY > 0 ? { offsetY } : {})
    }
    if (anchor.to) {
      anchor.to = { row: anchor.to.row + dRow, col: anchor.to.col + dCol }
    }

    this.sheet.updateImage(id, { anchor })
    // image-change → syncFromModel 会重排；此处不必手动 layout
  }

  // ─── 同步 / 重排 ─────────────────────────────────────────

  private scheduleSync(): void {
    if (this.released) return
    if (!this.visible) {
      this.dirty = true
      return
    }
    this.syncFromModel()
  }

  private scheduleRearrange(): void {
    if (this.released) return
    if (!this.visible) {
      this.dirty = true
      return
    }
    if (this.rearrangeScheduled) return
    this.rearrangeScheduled = true
    requestAnimationFrame(() => {
      this.rearrangeScheduled = false
      if (this.released || !this.visible) return
      this.layoutAll()
    })
  }

  /** 全量对齐模型：增删节点 + 布局 */
  private syncFromModel(): void {
    if (this.released) return
    const images = this.sheet.getImages()
    const alive = new Set(images.map((image) => image.id))

    for (const [id, node] of this.nodes) {
      if (alive.has(id)) continue
      node.remove()
      this.nodes.delete(id)
      const url = this.urls.get(id)
      if (url) {
        URL.revokeObjectURL(url)
        this.urls.delete(id)
      }
      this.dataRefs.delete(id)
      if (this.selectedId === id) this.selectedId = null
      if (this.drag?.id === id) {
        this.endDragListeners()
        this.drag = null
      }
    }

    for (const image of images) {
      this.upsertNode(image)
    }
    this.layoutAll()
  }

  private upsertNode(image: SheetImage): void {
    let wrap = this.nodes.get(image.id)
    if (!wrap) {
      wrap = document.createElement('div')
      wrap.dataset.sheetImageId = image.id
      Object.assign(wrap.style, {
        position: 'absolute',
        pointerEvents: 'auto',
        boxSizing: 'border-box',
        cursor: 'pointer',
        outline: 'none',
        outlineOffset: '0'
      } satisfies Partial<CSSStyleDeclaration>)

      const img = document.createElement('img')
      img.draggable = false
      img.alt = image.altText ?? ''
      if (image.title) img.title = image.title
      Object.assign(img.style, {
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'fill',
        userSelect: 'none',
        pointerEvents: 'none'
      } satisfies Partial<CSSStyleDeclaration>)

      const url = this.ensureObjectURL(image)
      img.src = url
      // 缺省宽高且无 to → 自然尺寸（load 后回写）
      if (!image.anchor.to && (image.width == null || image.height == null)) {
        img.addEventListener(
          'load',
          () => {
            if (this.released || !this.nodes.has(image.id)) return
            const current = this.sheet.getImage(image.id)
            if (!current) return
            this.layoutOne(image.id, current)
          },
          { once: true }
        )
      }

      wrap.appendChild(img)
      this.root.appendChild(wrap)
      this.nodes.set(image.id, wrap)
    } else {
      // 同 id 可能经 undo/redo 换数据：刷新 src / 元数据
      const img = wrap.querySelector('img')
      if (img) {
        const url = this.ensureObjectURL(image)
        if (img.src !== url) img.src = url
        img.alt = image.altText ?? ''
        img.title = image.title ?? ''
      }
    }

    if (this.selectedId === image.id) this.applySelectionStyle(wrap, true)
  }

  private ensureObjectURL(image: SheetImage): string {
    const existing = this.urls.get(image.id)
    if (existing && this.dataRefs.get(image.id) === image.data) return existing
    if (existing) URL.revokeObjectURL(existing)
    const blob = new Blob([image.data as BlobPart], { type: IMAGE_MIME[image.type] })
    const url = URL.createObjectURL(blob)
    this.urls.set(image.id, url)
    this.dataRefs.set(image.id, image.data)
    return url
  }

  /**
   * 定位：left/top = from 格左上 + 格内像素偏移（offsetX/offsetY）。
   * 宽高优先取 image.width/height（xlsx 导入的精确 px 尺寸）；宽高缺失且有 to 时
   * 按 from→to 跨度兜底（Excel twoCellAnchor 拉伸语义）；都缺失时取自然尺寸。
   */
  private computeImageRect(image: SheetImage, img?: HTMLImageElement | null): ImageRect {
    const fromCoord = this.toTableCoord(image.anchor.from)
    const fromRect = this.table.getCellRelativeRect(fromCoord.col, fromCoord.row)
    const left = fromRect.left + (image.anchor.from.offsetX ?? 0)
    const top = fromRect.top + (image.anchor.from.offsetY ?? 0)

    if (image.width != null && image.height != null) {
      return { left, top, width: image.width, height: image.height }
    }

    if (image.anchor.to) {
      const toCoord = this.toTableCoord(image.anchor.to)
      const toRect = this.table.getCellRelativeRect(toCoord.col, toCoord.row)
      return {
        left,
        top,
        width: Math.max(0, toRect.right - fromRect.left),
        height: Math.max(0, toRect.bottom - fromRect.top)
      }
    }

    return {
      left,
      top,
      width: image.width ?? (img?.naturalWidth || 0),
      height: image.height ?? (img?.naturalHeight || 0)
    }
  }

  private layoutAll(): void {
    for (const image of this.sheet.getImages()) {
      // 拖动中临时 DOM 位置优先，勿被 SCROLL 重排冲掉
      if (this.drag?.id === image.id && this.drag.moved) continue
      this.layoutOne(image.id, image)
    }
  }

  private layoutOne(id: string, image: SheetImage | undefined): void {
    const wrap = this.nodes.get(id)
    if (!wrap || !image) return
    const img = wrap.querySelector('img')
    const rect = this.computeImageRect(image, img)
    wrap.style.left = `${rect.left}px`
    wrap.style.top = `${rect.top}px`
    if (rect.width > 0) wrap.style.width = `${rect.width}px`
    if (rect.height > 0) wrap.style.height = `${rect.height}px`
  }

  // ─── 选中 ───────────────────────────────────────────────

  private select(id: string): void {
    if (this.selectedId === id) {
      this.applySelectionStyle(this.nodes.get(id), true)
      return
    }
    if (this.selectedId) {
      this.applySelectionStyle(this.nodes.get(this.selectedId), false)
    }
    this.selectedId = id
    this.applySelectionStyle(this.nodes.get(id), true)
    // 便于 Delete 键命中：叠层所在容器可聚焦
    if (this.container.tabIndex < 0) this.container.tabIndex = 0
    this.container.focus({ preventScroll: true })
  }

  private clearSelection(): void {
    if (!this.selectedId) return
    this.applySelectionStyle(this.nodes.get(this.selectedId), false)
    this.selectedId = null
  }

  private applySelectionStyle(wrap: HTMLDivElement | undefined, on: boolean): void {
    if (!wrap) return
    wrap.style.outline = on ? `2px solid ${SELECTION_COLOR}` : 'none'
    wrap.style.cursor = on ? 'move' : 'pointer'
  }
}
