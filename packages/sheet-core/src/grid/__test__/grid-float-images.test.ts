import { describe, expect, it } from 'vitest'

import { cellX, cellY, createGrid, flushMicrotasks } from './grid-test-utils'

/** happy-dom 可能缺 objectURL 实现：测试内补最小桩 */
function ensureObjectURLStubs(): { created: string[]; revoked: string[] } {
  const created: string[] = []
  const revoked: string[] = []
  const owner = URL as unknown as Record<string, unknown>
  if (typeof owner.createObjectURL !== 'function') {
    owner.createObjectURL = (): string => {
      const url = `blob:mock-${created.length}`
      created.push(url)
      return url
    }
  }
  if (typeof owner.revokeObjectURL !== 'function') {
    owner.revokeObjectURL = (url: string): void => {
      revoked.push(url)
    }
  }
  return { created, revoked }
}

const PNG_BYTES = new Uint8Array([137, 80, 78, 71])

describe('浮动图片同步（模型 ↔ 引擎浮动层）', () => {
  it('字节来源：转 objectURL 同步为浮动对象；尺寸随模型 width/height', async () => {
    ensureObjectURLStubs()
    const { grid, table, sheet } = createGrid()
    try {
      const id = sheet.insertImage({
        data: PNG_BYTES,
        type: 'png',
        anchor: { from: { row: 0, col: 0 } },
        width: 100,
        height: 50
      })
      await flushMicrotasks()
      const object = table.floatObjects.get(id)
      expect(object).toBeDefined()
      expect(object?.src).toMatch(/^blob:/)
      expect(object?.size).toEqual({ width: 100, height: 50 })
      expect(object?.anchor.from).toEqual({ col: 0, row: 0 })
    } finally {
      grid.release()
    }
  })

  it('src URL 来源直用；更新与删除随模型同步', async () => {
    ensureObjectURLStubs()
    const { grid, table, sheet } = createGrid()
    try {
      const id = sheet.insertImage({
        data: new Uint8Array(),
        type: 'png',
        src: 'https://example.com/x.png',
        anchor: { from: { row: 1, col: 1 } }
      })
      await flushMicrotasks()
      expect(table.floatObjects.get(id)?.src).toBe('https://example.com/x.png')

      sheet.updateImage(id, { anchor: { from: { row: 2, col: 2 } } })
      await flushMicrotasks()
      expect(table.floatObjects.get(id)?.anchor.from).toEqual({ col: 2, row: 2 })

      sheet.removeImage(id)
      await flushMicrotasks()
      expect(table.floatObjects.get(id)).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('拖拽结束写模型：无 to 的图平移 from（格内余量写偏移），可 undo', async () => {
    ensureObjectURLStubs()
    const { grid, table, sheet } = createGrid()
    try {
      const id = sheet.insertImage({
        data: PNG_BYTES,
        type: 'png',
        anchor: { from: { row: 0, col: 0 } }
      })
      await flushMicrotasks()
      const layer = table.floatObjects
      // 节点初始锚在 cell(0,0)（层坐标 46,28）；按下点 (51,33)，拖到使节点左上
      // 落在 cell(2,1)（206..286, 56..84）内：目标 (210,60) + 按点偏移 (5,5)
      expect(layer.beginDrag(id, cellX(0), cellY(0))).toBe(true)
      layer.dragMove(215, 65)
      layer.endDrag()
      await flushMicrotasks()

      const image = sheet.getImage(id)
      expect(image?.anchor.from).toMatchObject({ row: 1, col: 2, offsetX: 4, offsetY: 4 })
      expect(image?.anchor.to).toBeUndefined()
      expect(sheet.undo()).toBe(true)
      expect(sheet.getImage(id)?.anchor.from).toMatchObject({ row: 0, col: 0 })
    } finally {
      grid.release()
    }
  })

  it('拖拽结束写模型：有 to 的图同 delta 平移保持跨度', async () => {
    ensureObjectURLStubs()
    const { grid, table, sheet } = createGrid()
    try {
      const id = sheet.insertImage({
        data: PNG_BYTES,
        type: 'png',
        anchor: { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } }
      })
      await flushMicrotasks()
      const layer = table.floatObjects
      expect(layer.beginDrag(id, cellX(0), cellY(0))).toBe(true)
      layer.dragMove(215, 65)
      layer.endDrag()
      await flushMicrotasks()

      const image = sheet.getImage(id)
      expect(image?.anchor.from).toMatchObject({ row: 1, col: 2 })
      expect(image?.anchor.to).toEqual({ row: 2, col: 3 })
    } finally {
      grid.release()
    }
  })

  it('Delete/Backspace 删除选中图片（经命令，可 undo）；无选中为空操作', async () => {
    ensureObjectURLStubs()
    const { grid, container, table, sheet } = createGrid()
    try {
      const id = sheet.insertImage({
        data: PNG_BYTES,
        type: 'png',
        anchor: { from: { row: 0, col: 0 } },
        width: 40,
        height: 20
      })
      await flushMicrotasks()
      // 点选图片（指针事件命中浮动层由引擎路由；此处经层公开 API 选中）
      table.floatObjects.select(id)
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
      expect(sheet.getImage(id)).toBeUndefined()
      expect(sheet.undo()).toBe(true)
      expect(sheet.getImage(id)).toBeDefined()
    } finally {
      grid.release()
    }
  })

  it('只读模式：浮动层只读（可选中不可拖拽）', async () => {
    ensureObjectURLStubs()
    const { grid, table, sheet } = createGrid({ readonly: true })
    try {
      const id = sheet.insertImage({
        data: PNG_BYTES,
        type: 'png',
        anchor: { from: { row: 0, col: 0 } }
      })
      await flushMicrotasks()
      expect(table.floatObjects.isReadonly).toBe(true)
      expect(table.floatObjects.beginDrag(id, cellX(0), cellY(0))).toBe(false)
      expect(table.floatObjects.getSelectedId()).toBeNull()
    } finally {
      grid.release()
    }
  })
})
