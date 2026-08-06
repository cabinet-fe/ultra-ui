import { ListTable } from '@visactor/vtable'
import { describe, expect, it, vi } from 'vitest'

import type { ImageInput } from '../../core/image'
import { Sheet } from '../../core/sheet'
import { SheetGrid } from '../sheet-grid'

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  return el
}

function createReadonlyGrid() {
  const sheet = new Sheet()
  const container = createContainer()
  const grid = new SheetGrid({ container, sheet, rows: 20, cols: 6, readonly: true })
  return { sheet, grid, table: grid.getTable(), container, layer: grid.getImageLayer() }
}

function pngBytes(tag = 1): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, tag, 0, 0, 0])
}

function makeImageInput(overrides: Partial<ImageInput> = {}): ImageInput {
  return {
    data: pngBytes(),
    type: 'png',
    anchor: { from: { row: 1, col: 1 } },
    width: 50,
    height: 40,
    ...overrides
  }
}

describe('SheetGrid readonly（只读预览）', () => {
  it('能正常构造渲染：列头 / 行号列 / 数据与样式同步不变', () => {
    const { sheet, grid, table } = createReadonlyGrid()
    try {
      expect(table.isSeriesNumber(0, 1)).toBe(true)
      expect(table.isHeader(1, 0)).toBe(true)
      expect(table.getCellValue(1, 0)).toBe('A')

      // 模型 → 表格同步不受影响
      sheet.setCellValue({ row: 0, col: 0 }, 'hello')
      grid.flushPending()
      expect(table.getCellValue(1, 1)).toBe('hello')
    } finally {
      grid.release()
    }
  })

  it('options 不带 editor / editCellTrigger；fillHandle / editCellOnEnter / resize 关闭', () => {
    const { grid, table } = createReadonlyGrid()
    try {
      const options = table.options
      // 编辑入口：不挂编辑器、不响应双击进编辑
      expect(options.editor).toBeUndefined()
      expect(options.editCellTrigger).toBeUndefined()
      // 填充柄 / Enter 进编辑 / 行列尺寸拖拽：全部写模型，关闭
      expect(options.excelOptions?.fillHandle).toBe(false)
      expect(options.keyboardOptions?.editCellOnEnter).toBe(false)
      expect(options.resize?.columnResizeMode).toBe('none')
      expect(options.resize?.rowResizeMode).toBe('none')
      // 其余导航键保留
      expect(options.keyboardOptions?.moveFocusCellOnTab).toBe(true)
      expect(options.keyboardOptions?.moveFocusCellOnEnter).toBe(true)
      expect(options.keyboardOptions?.selectAllOnCtrlA).toBe(true)
    } finally {
      grid.release()
    }
  })

  it('CHANGE_CELL_VALUE 不回写模型', () => {
    const { sheet, grid, table } = createReadonlyGrid()
    try {
      table.changeCellValue(1, 1, 'world', false, true)
      expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('RESIZE_ROW_END / RESIZE_COLUMN_END 不写模型', () => {
    const { sheet, grid, table } = createReadonlyGrid()
    try {
      table.fireListeners(ListTable.EVENT_TYPE.RESIZE_ROW_END, { row: 2, rowHeight: 48 })
      expect(sheet.getRowHeight(1)).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('填充柄事件不触发填充写入', () => {
    const { sheet, grid, table } = createReadonlyGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 1)
      table.getSelectedCellRanges = () => [{ start: { col: 1, row: 1 }, end: { col: 1, row: 1 } }]
      table.fireListeners(ListTable.EVENT_TYPE.MOUSEDOWN_FILL_HANDLE, {})
      table.getSelectedCellRanges = () => [{ start: { col: 1, row: 1 }, end: { col: 1, row: 3 } }]
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_FILL_HANDLE_END, { direction: 'bottom' })
      expect(sheet.getCellData({ row: 1, col: 0 })).toBeUndefined()
      expect(sheet.getCellData({ row: 2, col: 0 })).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('undo/redo 快捷键未绑定：Ctrl+Z / Ctrl+Y 不改模型', () => {
    const { sheet, grid, container } = createReadonlyGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 'x')

      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
      expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'x' })

      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true })
      )
      expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'x' })
    } finally {
      grid.release()
    }
  })

  it('选择与右键回调保留：DRAG_SELECT_END 同步选区，CONTEXTMENU_CELL 仍回调', async () => {
    const { sheet, grid, table } = createReadonlyGrid()
    const calls: Array<{ kind: string; addr: { row: number; col: number } | null }> = []
    const grid2 = new SheetGrid({
      container: createContainer(),
      sheet: new Sheet(),
      rows: 20,
      cols: 6,
      readonly: true,
      onContextMenu: (info) => calls.push(info)
    })
    try {
      // 拖选结束 → 模型选区同步为区域（与可写模式一致）
      table.getSelectedCellRanges = () => [{ start: { col: 1, row: 1 }, end: { col: 3, row: 2 } }]
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_SELECT_END, {})
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 0, col: 0 },
        end: { row: 1, col: 2 }
      })

      // 右键回调保留（只读预览也可能需要自定义菜单）
      const table2 = grid2.getTable()
      table2.fireListeners(ListTable.EVENT_TYPE.CONTEXTMENU_CELL, {
        col: 2,
        row: 3,
        event: { clientX: 120, clientY: 80, preventDefault() {} }
      })
      await Promise.resolve() // queueMicrotask
      expect(calls).toHaveLength(1)
      expect(calls[0]).toMatchObject({ kind: 'body', addr: { row: 2, col: 1 } })
    } finally {
      grid.release()
      grid2.release()
    }
  })

  it('图片：可选中查看，但拖动不写锚点、Delete 不删除', () => {
    const { sheet, grid, table, container, layer } = createReadonlyGrid()
    try {
      const id = sheet.insertImage(makeImageInput({ id: 'img-ro' }))
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

      const node = container.querySelector<HTMLElement>('[data-sheet-image-id]')!
      expect(node).toBeTruthy()

      // 点击仍可选中（光标不为 move）
      node.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
          pointerId: 1
        })
      )
      expect(layer.getSelectedId()).toBe(id)
      expect(node.style.cursor).not.toBe('move')

      // 拖动手势：未开拖动会话，锚点不变
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          clientX: 140,
          clientY: 130,
          pointerId: 1
        })
      )
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX: 140,
          clientY: 130,
          pointerId: 1
        })
      )
      expect(sheet.getImage(id)!.anchor.from).toEqual({ row: 1, col: 1 })

      // Delete 不删除（removeImage 走命令写模型）
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true })
      )
      expect(sheet.getImage(id)).toBeDefined()
      expect(layer.getSelectedId()).toBe(id)
    } finally {
      grid.release()
    }
  })
})
