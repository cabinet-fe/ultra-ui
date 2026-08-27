import { ListTable } from '@visactor/vtable'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ImageInput } from '../../core/image'
import { Sheet } from '../../core/sheet'
import { ImageLayer } from '../image-layer'
import { SheetGrid } from '../sheet-grid'

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  return el
}

function pngBytes(tag = 1): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, tag, 0, 0, 0])
}

function makeInput(overrides: Partial<ImageInput> = {}): ImageInput {
  return {
    data: pngBytes(),
    type: 'png',
    anchor: { from: { row: 1, col: 2 } },
    width: 100,
    height: 80,
    ...overrides
  }
}

function createGrid(rows = 20, cols = 6) {
  const sheet = new Sheet()
  const container = createContainer()
  const grid = new SheetGrid({ container, sheet, rows, cols })
  return { sheet, grid, table: grid.getTable(), container, layer: grid.getImageLayer() }
}

function imageNodes(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-sheet-image-id]')]
}

describe('ImageLayer（canvas-mock）', () => {
  const containers: HTMLElement[] = []
  afterEach(() => {
    for (const el of containers) el.remove()
    containers.length = 0
  })

  function track(container: HTMLElement): HTMLElement {
    containers.push(container)
    return container
  }

  it('插入图片后叠层创建节点，位置取自 getCellRelativeRect', () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      const spy = vi
        .spyOn(table, 'getCellRelativeRect')
        .mockReturnValue({
          left: 120,
          top: 60,
          width: 80,
          height: 28,
          right: 200,
          bottom: 88
        } as ReturnType<ListTable['getCellRelativeRect']>)

      const id = sheet.insertImage(makeInput({ id: 'img-1', anchor: { from: { row: 0, col: 0 } } }))
      layer.flush()

      const nodes = imageNodes(container)
      expect(nodes).toHaveLength(1)
      expect(nodes[0]!.dataset.sheetImageId).toBe(id)
      expect(nodes[0]!.style.left).toBe('120px')
      expect(nodes[0]!.style.top).toBe('60px')
      expect(nodes[0]!.style.width).toBe('100px')
      expect(nodes[0]!.style.height).toBe('80px')
      const img = nodes[0]!.querySelector('img')!
      expect(img.style.objectFit).toBe('fill')
      expect(img.src).toMatch(/^blob:/)
      // 模型 (0,0) → 表格 (1,1)
      expect(spy).toHaveBeenCalledWith(1, 1)
    } finally {
      grid.release()
    }
  })

  it('有 to 锚点且带 width/height 时按 width/height 布置（宽高优先于跨度）', () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      vi.spyOn(table, 'getCellRelativeRect').mockImplementation((col, row) => {
        // 表格坐标：col/row；left=col*100, top=row*40
        const left = col * 100
        const top = row * 40
        return {
          left,
          top,
          width: 100,
          height: 40,
          right: left + 100,
          bottom: top + 40
        } as ReturnType<ListTable['getCellRelativeRect']>
      })

      // from (0,0) → table (1,1)；有 to 但 width/height 优先（xlsx 导入的精确 px）
      sheet.insertImage(
        makeInput({
          id: 'img-to',
          anchor: { from: { row: 0, col: 0 }, to: { row: 2, col: 3 } },
          width: 10,
          height: 10
        })
      )
      layer.flush()

      const node = imageNodes(container)[0]!
      expect(node.style.left).toBe('100px')
      expect(node.style.top).toBe('40px')
      expect(node.style.width).toBe('10px')
      expect(node.style.height).toBe('10px')
    } finally {
      grid.release()
    }
  })

  it('有 to 锚点但缺 width/height 时宽高取 from→to 跨度兜底', () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      vi.spyOn(table, 'getCellRelativeRect').mockImplementation((col, row) => {
        const left = col * 100
        const top = row * 40
        return {
          left,
          top,
          width: 100,
          height: 40,
          right: left + 100,
          bottom: top + 40
        } as ReturnType<ListTable['getCellRelativeRect']>
      })

      // from (0,0) → table (1,1)；to (2,3) → table (4,3)
      // left/top = (100,40)；width = 500-100=400；height = 160-40=120
      sheet.insertImage(
        makeInput({
          id: 'img-span',
          anchor: { from: { row: 0, col: 0 }, to: { row: 2, col: 3 } },
          width: undefined,
          height: undefined
        })
      )
      layer.flush()

      const node = imageNodes(container)[0]!
      expect(node.style.left).toBe('100px')
      expect(node.style.top).toBe('40px')
      expect(node.style.width).toBe('400px')
      expect(node.style.height).toBe('120px')
    } finally {
      grid.release()
    }
  })

  it('from 带格内偏移 offsetX/offsetY 时叠加到 left/top', () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      vi.spyOn(table, 'getCellRelativeRect').mockReturnValue({
        left: 120,
        top: 60,
        width: 80,
        height: 28,
        right: 200,
        bottom: 88
      } as ReturnType<ListTable['getCellRelativeRect']>)

      sheet.insertImage(
        makeInput({ id: 'img-off', anchor: { from: { row: 0, col: 0, offsetX: 15, offsetY: 7 } } })
      )
      layer.flush()

      const node = imageNodes(container)[0]!
      expect(node.style.left).toBe('135px')
      expect(node.style.top).toBe('67px')
      expect(node.style.width).toBe('100px')
      expect(node.style.height).toBe('80px')
    } finally {
      grid.release()
    }
  })

  it('删除图片后节点移除；dispose 清理叠层与 objectURL', () => {
    const { sheet, grid, container, layer } = createGrid()
    track(container)
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    try {
      const id = sheet.insertImage(makeInput({ id: 'img-del' }))
      layer.flush()
      expect(imageNodes(container)).toHaveLength(1)

      sheet.removeImage(id)
      layer.flush()
      expect(imageNodes(container)).toHaveLength(0)
      expect(revoke).toHaveBeenCalled()

      const before = revoke.mock.calls.length
      grid.release()
      expect(container.querySelector('.u-sheet__image-layer')).toBeNull()
      // dispose 时 urls 已在 remove 时清空，不再额外 revoke；叠层根节点已移除
      expect(revoke.mock.calls.length).toBeGreaterThanOrEqual(before)
    } finally {
      revoke.mockRestore()
    }
  })

  it('SCROLL 触发重排', async () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      sheet.insertImage(makeInput({ id: 'img-scroll', anchor: { from: { row: 2, col: 1 } } }))
      layer.flush()

      let left = 50
      vi.spyOn(table, 'getCellRelativeRect').mockImplementation(() => {
        left += 10
        return {
          left,
          top: 100,
          width: 80,
          height: 28,
          right: left + 80,
          bottom: 128
        } as ReturnType<ListTable['getCellRelativeRect']>
      })

      table.fireListeners(ListTable.EVENT_TYPE.SCROLL, { scrollLeft: 40, scrollTop: 0 })
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      layer.flush()

      const node = imageNodes(container)[0]!
      expect(Number.parseFloat(node.style.left)).toBeGreaterThan(50)
    } finally {
      grid.release()
    }
  })

  it('structure-change（锚点平移）重排位置，不依赖 image-change', () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      sheet.insertImage(
        makeInput({ id: 'img-shift', anchor: { from: { row: 2, col: 0 } }, width: 40, height: 30 })
      )
      layer.flush()

      const calls: Array<[number, number]> = []
      vi.spyOn(table, 'getCellRelativeRect').mockImplementation((col, row) => {
        calls.push([col, row])
        return {
          left: col * 10,
          top: row * 10,
          width: 80,
          height: 28,
          right: col * 10 + 80,
          bottom: row * 10 + 28
        } as ReturnType<ListTable['getCellRelativeRect']>
      })

      // 在行 1 插入 1 行 → 锚点 row 2 → 3；只发 structure-change
      sheet.insertRows(1, 1)
      layer.flush()

      expect(sheet.getImage('img-shift')!.anchor.from).toEqual({ row: 3, col: 0 })
      // 模型 (3,0) → 表格 (1,4)
      expect(calls.some(([col, row]) => col === 1 && row === 4)).toBe(true)
      expect(imageNodes(container)[0]!.style.top).toBe('40px')
    } finally {
      grid.release()
    }
  })

  it('LRU 隐藏不渲染变更；激活后一次性同步', () => {
    const { sheet, grid, container, layer } = createGrid()
    track(container)
    try {
      grid.setVisible(false)
      expect(layer.getSelectedId()).toBeNull()

      sheet.insertImage(makeInput({ id: 'img-lru' }))
      // 隐藏期间不应出现节点（脏标记）
      expect(imageNodes(container)).toHaveLength(0)

      grid.setVisible(true)
      layer.flush()
      expect(imageNodes(container)).toHaveLength(1)
      expect(imageNodes(container)[0]!.dataset.sheetImageId).toBe('img-lru')
    } finally {
      grid.release()
    }
  })

  it('点击图片选中；Delete 经命令删除；点击空白取消选中', () => {
    const { sheet, grid, container, layer } = createGrid()
    track(container)
    try {
      const id = sheet.insertImage(makeInput({ id: 'img-sel' }))
      layer.flush()
      const node = imageNodes(container)[0]!

      // 在节点上派发：container capture 监听器 target=node → 选中
      node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
      expect(layer.getSelectedId()).toBe(id)
      expect(node.style.outline).not.toBe('none')
      expect(node.style.outline.length).toBeGreaterThan(0)

      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true })
      )
      expect(sheet.getImage(id)).toBeUndefined()
      expect(imageNodes(container)).toHaveLength(0)
      expect(layer.getSelectedId()).toBeNull()

      // 再插一张，选中后点空白取消
      const id2 = sheet.insertImage(makeInput({ id: 'img-sel-2' }))
      layer.flush()
      const node2 = imageNodes(container)[0]!
      node2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
      expect(layer.getSelectedId()).toBe(id2)

      // 点容器空白（target=container，非图片）→ 取消选中
      container.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
      expect(layer.getSelectedId()).toBeNull()
    } finally {
      grid.release()
    }
  })

  it('拖动落点反查单元格，余量写回 offsetX/offsetY；经 updateImage 平移 from/to；可 undo', () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      // 模型 (1,1) → table (2,2)；to (2,2) → table (3,3)
      sheet.insertImage(
        makeInput({
          id: 'img-drag',
          anchor: { from: { row: 1, col: 1 }, to: { row: 2, col: 2 } },
          width: 50,
          height: 40
        })
      )

      vi.spyOn(table, 'getCellRelativeRect').mockImplementation((col, row) => {
        const left = col * 80
        const top = row * 28
        return {
          left,
          top,
          width: 80,
          height: 28,
          right: left + 80,
          bottom: top + 28
        } as ReturnType<ListTable['getCellRelativeRect']>
      })
      layer.flush()

      const node = imageNodes(container)[0]!
      // from table (2,2) → left=160, top=56
      expect(node.style.left).toBe('160px')
      expect(node.style.top).toBe('56px')

      // 按坐标反查：80px 列宽 / 28px 行高
      vi.spyOn(table, 'getCellAtRelativePosition').mockImplementation(
        (x, y) =>
          ({ col: Math.floor(x / 80), row: Math.floor(y / 28) }) as ReturnType<
            ListTable['getCellAtRelativePosition']
          >
      )

      node.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
          pointerId: 1
        })
      )
      expect(layer.getSelectedId()).toBe('img-drag')

      // 超过阈值的移动：dx=20, dy=30 → 落点 left=180, top=86
      // → table (2,3) → 模型 (row=2, col=1)；余量 offsetX=180-160=20, offsetY=86-84=2
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 130,
          pointerId: 1
        })
      )
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 130,
          pointerId: 1
        })
      )

      expect(sheet.getImage('img-drag')!.anchor).toEqual({
        from: { row: 2, col: 1, offsetX: 20, offsetY: 2 },
        to: { row: 3, col: 2 }
      })

      expect(sheet.undo()).toBe(true)
      expect(sheet.getImage('img-drag')!.anchor).toEqual({
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 }
      })
    } finally {
      grid.release()
    }
  })

  it('拖动落点越出目标格左上时余量 clamp 到 0', () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      sheet.insertImage(
        makeInput({ id: 'img-clamp', anchor: { from: { row: 1, col: 1 } }, width: 50, height: 40 })
      )

      vi.spyOn(table, 'getCellRelativeRect').mockImplementation((col, row) => {
        const left = col * 80
        const top = row * 28
        return {
          left,
          top,
          width: 80,
          height: 28,
          right: left + 80,
          bottom: top + 28
        } as ReturnType<ListTable['getCellRelativeRect']>
      })
      layer.flush()

      const node = imageNodes(container)[0]!
      // 落点固定在 table (3,3)（left=240, top=84）
      vi.spyOn(table, 'getCellAtRelativePosition').mockReturnValue({ col: 3, row: 3 } as ReturnType<
        ListTable['getCellAtRelativePosition']
      >)

      node.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
          pointerId: 1
        })
      )
      // dx=40, dy=14 → 落点 left=200, top=70，在目标格 (240,84) 左上之外 → clamp (0,0)
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          clientX: 140,
          clientY: 114,
          pointerId: 1
        })
      )
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX: 140,
          clientY: 114,
          pointerId: 1
        })
      )

      // 模型 (2,2)；余量为负 → 不写 offset 字段
      expect(sheet.getImage('img-clamp')!.anchor.from).toEqual({ row: 2, col: 2 })
    } finally {
      grid.release()
    }
  })

  it('独立 ImageLayer dispose 撤销全部 objectURL', () => {
    const sheet = new Sheet()
    const container = track(createContainer())
    const table = {
      on: vi.fn(),
      off: vi.fn(),
      getCellRect: vi.fn(() => ({ left: 0, top: 0, width: 80, height: 28 })),
      getCellRelativeRect: vi.fn(() => ({
        left: 10,
        top: 20,
        width: 80,
        height: 28,
        right: 90,
        bottom: 48
      })),
      getCellAtRelativePosition: vi.fn(() => ({ col: 1, row: 1 }))
    } as unknown as ListTable

    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const layer = new ImageLayer({
      container,
      table,
      sheet,
      toTableCoord: (addr) => ({ col: addr.col + 1, row: addr.row + 1 }),
      toSheetAddr: (col, row) => (col < 1 || row < 1 ? null : { col: col - 1, row: row - 1 })
    })
    try {
      sheet.insertImage(makeInput({ id: 'a' }))
      sheet.insertImage(makeInput({ id: 'b', anchor: { from: { row: 0, col: 1 } } }))
      layer.flush()
      expect(imageNodes(container)).toHaveLength(2)

      layer.dispose()
      expect(container.querySelector('.u-sheet__image-layer')).toBeNull()
      expect(revoke.mock.calls.length).toBeGreaterThanOrEqual(2)
    } finally {
      revoke.mockRestore()
    }
  })

  it('视口外图片不建 DOM / objectURL；滚入后才挂节点', () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      vi.spyOn(table, 'getCellRelativeRect').mockImplementation((col, row) => {
        const left = col * 100
        // 模型 (0,0) → 表格 (1,1)；模型 (5,0) → 表格 (1,6)
        const top = row <= 2 ? 20 : 8000
        return {
          left,
          top,
          width: 80,
          height: 28,
          right: left + 80,
          bottom: top + 28
        } as ReturnType<ListTable['getCellRelativeRect']>
      })

      sheet.insertImage(
        makeInput({ id: 'in-view', anchor: { from: { row: 0, col: 0 } }, width: 100, height: 80 })
      )
      sheet.insertImage(
        makeInput({ id: 'off-view', anchor: { from: { row: 5, col: 0 } }, width: 100, height: 80 })
      )
      layer.flush()

      const nodes = imageNodes(container)
      expect(nodes).toHaveLength(1)
      expect(nodes[0]!.dataset.sheetImageId).toBe('in-view')

      vi.spyOn(table, 'getCellRelativeRect').mockImplementation((col, row) => {
        const left = col * 100
        const top = row <= 2 ? -8000 : 40
        return {
          left,
          top,
          width: 80,
          height: 28,
          right: left + 80,
          bottom: top + 28
        } as ReturnType<ListTable['getCellRelativeRect']>
      })
      layer.flush()

      const after = imageNodes(container)
      expect(after).toHaveLength(1)
      expect(after[0]!.dataset.sheetImageId).toBe('off-view')
    } finally {
      grid.release()
    }
  })

  it('鼠标悬停在浮动图片上转动滚轮时转发垂直与水平滚动（含 shift 键横滚）', () => {
    const { sheet, grid, table, container, layer } = createGrid(100, 20)
    track(container)
    try {
      sheet.insertImage(makeInput({ id: 'img-wheel', anchor: { from: { row: 0, col: 0 } } }))
      layer.flush()

      const node = imageNodes(container)[0]!
      const setScrollTopSpy = vi.spyOn(table, 'setScrollTop')
      const setScrollLeftSpy = vi.spyOn(table, 'setScrollLeft')

      // 初始位置为 0 时的垂直滚动 deltaY: 50
      vi.spyOn(table, 'getScrollTop').mockReturnValue(0)
      vi.spyOn(table, 'getScrollLeft').mockReturnValue(0)

      const verticalEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 0,
        deltaY: 50
      })
      node.dispatchEvent(verticalEvent)
      expect(setScrollTopSpy).toHaveBeenCalledWith(50)
      expect(verticalEvent.defaultPrevented).toBe(true)

      // 水平滚动 deltaX: 40
      const horizontalEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 40,
        deltaY: 0
      })
      node.dispatchEvent(horizontalEvent)
      expect(setScrollLeftSpy).toHaveBeenCalledWith(40)
      expect(horizontalEvent.defaultPrevented).toBe(true)

      // Shift + 垂直滚轮（当前 scrollLeft=40，deltaY=30）转为水平滚动到 70
      vi.spyOn(table, 'getScrollLeft').mockReturnValue(40)
      const shiftWheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 0,
        deltaY: 30
      })
      Object.defineProperty(shiftWheelEvent, 'shiftKey', { value: true, configurable: true })
      node.dispatchEvent(shiftWheelEvent)
      expect(setScrollLeftSpy).toHaveBeenCalledWith(70)
      expect(shiftWheelEvent.defaultPrevented).toBe(true)
    } finally {
      grid.release()
    }
  })

  it('只读模式下悬停在浮动图片上转动滚轮依然转发滚动', () => {
    const sheet = new Sheet()
    const container = track(createContainer())
    const grid = new SheetGrid({ container, sheet, rows: 100, cols: 20, readonly: true })
    const table = grid.getTable()
    const layer = grid.getImageLayer()
    try {
      sheet.insertImage(makeInput({ id: 'img-ro-wheel', anchor: { from: { row: 0, col: 0 } } }))
      layer.flush()

      const node = imageNodes(container)[0]!
      const setScrollTopSpy = vi.spyOn(table, 'setScrollTop')

      const event = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 0,
        deltaY: 60
      })
      node.dispatchEvent(event)
      expect(setScrollTopSpy).toHaveBeenCalledWith(60)
      expect(event.defaultPrevented).toBe(true)
    } finally {
      grid.release()
    }
  })

  it('销毁 ImageLayer 时清理 wheel 监听器，销毁后派发滚轮不报错且不触发滚动', () => {
    const sheet = new Sheet()
    const container = track(createContainer())
    const grid = new SheetGrid({ container, sheet, rows: 100, cols: 20 })
    const table = grid.getTable()
    const layer = grid.getImageLayer()
    try {
      sheet.insertImage(
        makeInput({ id: 'img-dispose-wheel', anchor: { from: { row: 0, col: 0 } } })
      )
      layer.flush()

      const node = imageNodes(container)[0]!
      grid.release()

      const setScrollTopSpy = vi.spyOn(table, 'setScrollTop')
      const event = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: 0,
        deltaY: 60
      })
      node.dispatchEvent(event)
      expect(setScrollTopSpy).not.toHaveBeenCalled()
    } finally {
      // already released
    }
  })

  it('只读模式下触控事件（pointerType: touch）不拦截事件且不触发图片平移', () => {
    const sheet = new Sheet()
    const container = track(createContainer())
    const grid = new SheetGrid({ container, sheet, rows: 100, cols: 20, readonly: true })
    const layer = grid.getImageLayer()
    try {
      sheet.insertImage(makeInput({ id: 'img-ro-touch', anchor: { from: { row: 1, col: 1 } } }))
      layer.flush()

      const node = imageNodes(container)[0]!
      const initialLeft = node.style.left
      const initialTop = node.style.top

      const pointerDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100
      })
      node.dispatchEvent(pointerDownEvent)

      expect(pointerDownEvent.defaultPrevented).toBe(false)
      expect(layer.getSelectedId()).toBeNull()

      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'touch',
          clientX: 150,
          clientY: 180
        })
      )
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'touch',
          clientX: 150,
          clientY: 180
        })
      )

      expect(node.style.left).toBe(initialLeft)
      expect(node.style.top).toBe(initialTop)
      expect(sheet.getImage('img-ro-touch')!.anchor.from).toEqual({ row: 1, col: 1 })
    } finally {
      grid.release()
    }
  })

  it('非只读模式下未选中图片时的触控轻触（tap）在 pointerup 时选中图片', () => {
    const { sheet, grid, container, layer } = createGrid()
    track(container)
    try {
      sheet.insertImage(makeInput({ id: 'img-tap', anchor: { from: { row: 0, col: 0 } } }))
      layer.flush()

      const node = imageNodes(container)[0]!
      expect(layer.getSelectedId()).toBeNull()

      node.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerId: 2,
          pointerType: 'touch',
          clientX: 100,
          clientY: 100
        })
      )
      // pointerdown 阶段未选中（等待判断是否滑动）
      expect(layer.getSelectedId()).toBeNull()

      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerId: 2,
          pointerType: 'touch',
          clientX: 101,
          clientY: 101
        })
      )

      // pointerup 未移动超过阈值 → 视为 tap 选中
      expect(layer.getSelectedId()).toBe('img-tap')
      expect(node.style.outline).toContain('solid')
    } finally {
      grid.release()
    }
  })

  it('非只读模式下未选中图片时的触控滑动不触发图片平移且不选中图片', () => {
    const { sheet, grid, container, layer } = createGrid()
    track(container)
    try {
      sheet.insertImage(makeInput({ id: 'img-touch-swipe', anchor: { from: { row: 0, col: 0 } } }))
      layer.flush()

      const node = imageNodes(container)[0]!
      const initialLeft = node.style.left
      const initialTop = node.style.top

      node.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerId: 3,
          pointerType: 'touch',
          clientX: 100,
          clientY: 100
        })
      )

      // 滑动超过阈值
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          pointerId: 3,
          pointerType: 'touch',
          clientX: 140,
          clientY: 160
        })
      )
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerId: 3,
          pointerType: 'touch',
          clientX: 140,
          clientY: 160
        })
      )

      expect(node.style.left).toBe(initialLeft)
      expect(node.style.top).toBe(initialTop)
      expect(layer.getSelectedId()).toBeNull()
      expect(sheet.getImage('img-touch-swipe')!.anchor.from).toEqual({ row: 0, col: 0 })
    } finally {
      grid.release()
    }
  })

  it('非只读模式下已选中图片时的触控拖拽触发锚点平移并阻止事件冒泡', () => {
    const { sheet, grid, table, container, layer } = createGrid()
    track(container)
    try {
      sheet.insertImage(
        makeInput({
          id: 'img-touch-drag',
          anchor: { from: { row: 1, col: 1 } },
          width: 50,
          height: 40
        })
      )

      vi.spyOn(table, 'getCellRelativeRect').mockImplementation((col, row) => {
        const left = col * 80
        const top = row * 28
        return {
          left,
          top,
          width: 80,
          height: 28,
          right: left + 80,
          bottom: top + 28
        } as ReturnType<ListTable['getCellRelativeRect']>
      })
      vi.spyOn(table, 'getCellAtRelativePosition').mockImplementation(
        (x, y) =>
          ({ col: Math.floor(x / 80), row: Math.floor(y / 28) }) as ReturnType<
            ListTable['getCellAtRelativePosition']
          >
      )
      layer.flush()

      const node = imageNodes(container)[0]!

      // 先通过轻触选中图片
      node.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerId: 4,
          pointerType: 'touch',
          clientX: 100,
          clientY: 100
        })
      )
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerId: 4,
          pointerType: 'touch',
          clientX: 100,
          clientY: 100
        })
      )
      expect(layer.getSelectedId()).toBe('img-touch-drag')

      // 在已选中图片上进行触控拖拽
      const dragDownEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 5,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100
      })
      node.dispatchEvent(dragDownEvent)
      expect(dragDownEvent.defaultPrevented).toBe(true)

      const dragMoveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 5,
        pointerType: 'touch',
        clientX: 120,
        clientY: 130
      })
      window.dispatchEvent(dragMoveEvent)
      expect(dragMoveEvent.defaultPrevented).toBe(true)

      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerId: 5,
          pointerType: 'touch',
          clientX: 120,
          clientY: 130
        })
      )

      expect(sheet.getImage('img-touch-drag')!.anchor.from).toEqual({
        row: 2,
        col: 1,
        offsetX: 20,
        offsetY: 2
      })
    } finally {
      grid.release()
    }
  })
})
