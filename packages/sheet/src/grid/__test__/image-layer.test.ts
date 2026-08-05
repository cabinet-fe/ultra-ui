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

  it('有 to 锚点时宽高取 from→to 跨度，覆盖固定 width/height', () => {
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

      // from (0,0) → table (1,1)；to (2,3) → table (4,3)
      // left/top = (100,40)；width = 500-100=400；height = 160-40=120
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
      expect(node.style.width).toBe('400px')
      expect(node.style.height).toBe('120px')
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

  it('拖动落点反查单元格，经 updateImage 平移 from/to；可 undo', () => {
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

      // 落点落在 table (col=4, row=3) → 模型 (row=2, col=3)；delta = (+1 row, +2 col)
      vi.spyOn(table, 'getCellAtRelativePosition').mockReturnValue({ col: 4, row: 3 } as ReturnType<
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
      expect(layer.getSelectedId()).toBe('img-drag')

      // 超过阈值的移动
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
        from: { row: 2, col: 3 },
        to: { row: 3, col: 4 }
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
})
