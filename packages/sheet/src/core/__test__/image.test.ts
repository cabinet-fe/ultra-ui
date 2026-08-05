import { describe, expect, it } from 'vitest'

import { RestoreSheetCommand } from '../command/restore-sheet'
import type { ImageInput, SheetImage } from '../image'
import type { SheetSnapshot } from '../sheet'
import { Sheet } from '../sheet'

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

describe('Sheet 图片：插入 / 删除', () => {
  it('insertImage 生成 id 并写入集合；image-change 带 id', () => {
    const sheet = new Sheet()
    const events: Array<{ id?: string }> = []
    sheet.on('image-change', (payload) => events.push(payload))

    const id = sheet.insertImage(makeInput({ altText: 'logo' }))

    expect(id).toBeTruthy()
    expect(sheet.getImages()).toHaveLength(1)
    const image = sheet.getImage(id)!
    expect(image).toMatchObject({
      id,
      type: 'png',
      width: 100,
      height: 80,
      altText: 'logo',
      anchor: { from: { row: 1, col: 2 } }
    })
    expect(image.data).toEqual(pngBytes())
    expect(events).toEqual([{ id }])
  })

  it('insertImage 可使用调用方提供的 id', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(makeInput({ id: 'fixed-id' }))
    expect(id).toBe('fixed-id')
    expect(sheet.getImage('fixed-id')).toBeDefined()
  })

  it('removeImage 删除并触发 image-change', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(makeInput())
    const events: Array<{ id?: string }> = []
    sheet.on('image-change', (payload) => events.push(payload))

    sheet.removeImage(id)

    expect(sheet.getImages()).toHaveLength(0)
    expect(sheet.getImage(id)).toBeUndefined()
    expect(events).toEqual([{ id }])
  })

  it('removeImage 对不存在 id 无操作、不入历史', () => {
    const sheet = new Sheet()
    sheet.removeImage('missing')
    expect(sheet.canUndo).toBe(false)
  })
})

describe('Sheet 图片：undo / redo', () => {
  it('插入后 undo 移除、redo 恢复', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(makeInput({ title: 't' }))
    expect(sheet.getImages()).toHaveLength(1)

    expect(sheet.undo()).toBe(true)
    expect(sheet.getImages()).toHaveLength(0)

    expect(sheet.redo()).toBe(true)
    expect(sheet.getImage(id)?.title).toBe('t')
  })

  it('删除后 undo 恢复、redo 再删', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(makeInput())
    sheet.removeImage(id)
    expect(sheet.getImages()).toHaveLength(0)

    expect(sheet.undo()).toBe(true)
    expect(sheet.getImage(id)?.anchor.from).toEqual({ row: 1, col: 2 })

    expect(sheet.redo()).toBe(true)
    expect(sheet.getImages()).toHaveLength(0)
  })

  it('updateImage 平移 from/to；undo/redo 往返；无变更不入历史', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(
      makeInput({
        anchor: { from: { row: 1, col: 1 }, to: { row: 3, col: 4 } },
        width: 100,
        height: 80
      })
    )

    sheet.updateImage(id, { anchor: { from: { row: 2, col: 3 }, to: { row: 4, col: 6 } } })
    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 2, col: 3 }, to: { row: 4, col: 6 } })
    // 宽高保持
    expect(sheet.getImage(id)?.width).toBe(100)
    expect(sheet.getImage(id)?.height).toBe(80)

    expect(sheet.undo()).toBe(true)
    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 1, col: 1 }, to: { row: 3, col: 4 } })

    expect(sheet.redo()).toBe(true)
    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 2, col: 3 }, to: { row: 4, col: 6 } })

    // 相同锚点 → 无操作
    expect(sheet.canUndo).toBe(true)
    sheet.updateImage(id, { anchor: { from: { row: 2, col: 3 }, to: { row: 4, col: 6 } } })
    // 仍可 undo 到插入前的上一步（update 未新增历史）
    expect(sheet.undo()).toBe(true)
    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 1, col: 1 }, to: { row: 3, col: 4 } })
    expect(sheet.redo()).toBe(true)

    // 不存在 id → 无操作
    const beforeMissing = sheet.getImage(id)!.anchor
    sheet.updateImage('missing', { anchor: { from: { row: 0, col: 0 } } })
    expect(sheet.getImage(id)?.anchor).toEqual(beforeMissing)
  })
  it('updateImage 写入格内偏移；undo 还原；仅 offset 变化也入历史', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(makeInput({ anchor: { from: { row: 1, col: 1 } } }))

    sheet.updateImage(id, { anchor: { from: { row: 1, col: 1, offsetX: 10, offsetY: 5 } } })
    expect(sheet.getImage(id)?.anchor.from).toEqual({ row: 1, col: 1, offsetX: 10, offsetY: 5 })

    expect(sheet.undo()).toBe(true)
    expect(sheet.getImage(id)?.anchor.from).toEqual({ row: 1, col: 1 })
  })
})

describe('Sheet 图片：快照 roundtrip', () => {
  it('snapshot / restore 保留图片字段', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(
      makeInput({ anchor: { from: { row: 0, col: 0 }, to: { row: 2, col: 3 } }, title: 'snap' })
    )
    const snap = sheet.snapshot()
    expect(snap.images).toHaveLength(1)
    expect(snap.images![0]!.id).toBe(id)

    const restored = new Sheet('R')
    restored.restore(snap)
    expect(restored.getImages()).toHaveLength(1)
    expect(restored.getImage(id)).toMatchObject({
      title: 'snap',
      anchor: { from: { row: 0, col: 0 }, to: { row: 2, col: 3 } }
    })
  })

  it('snapshot / restore 保留锚点格内偏移 offsetX/offsetY（含 JSON 序列化）', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(
      makeInput({ anchor: { from: { row: 0, col: 0, offsetX: 12, offsetY: 6 } } })
    )

    // 经 JSON roundtrip（普通数字字段，无特殊序列化）
    const snap = JSON.parse(JSON.stringify(sheet.snapshot())) as SheetSnapshot

    const restored = new Sheet('R')
    restored.restore(snap)
    expect(restored.getImage(id)?.anchor.from).toEqual({ row: 0, col: 0, offsetX: 12, offsetY: 6 })
  })

  it('空 sheet 序列化兼容：无 images 字段', () => {
    const sheet = new Sheet()
    const snap = sheet.snapshot()
    expect(snap.images).toBeUndefined()
    expect('images' in snap).toBe(false)

    const restored = new Sheet('R')
    restored.restore(snap)
    expect(restored.getImages()).toHaveLength(0)
  })

  it('旧快照缺省 images → restore 清空为无图', () => {
    const sheet = new Sheet()
    sheet.insertImage(makeInput())
    const snap: SheetSnapshot = {
      cells: [],
      styles: [],
      merges: [],
      frozen: { rows: 0, cols: 0 },
      rows: 0,
      cols: 0
    }
    sheet.restore(snap)
    expect(sheet.getImages()).toHaveLength(0)
  })
})

describe('Sheet 图片：restoreContent', () => {
  it('整表替换恢复图片并发 image-change（无 id）+ content-reset', () => {
    const sheet = new Sheet()
    sheet.insertImage(makeInput({ id: 'old' }))

    const afterImages: SheetImage[] = [
      {
        id: 'new',
        data: pngBytes(9),
        type: 'jpeg',
        anchor: { from: { row: 5, col: 5 } },
        width: 50
      }
    ]
    const afterSnap: SheetSnapshot = {
      cells: [],
      styles: [],
      merges: [],
      frozen: { rows: 0, cols: 0 },
      rows: 0,
      cols: 0,
      images: afterImages
    }

    const imageEvents: Array<{ id?: string }> = []
    let resets = 0
    sheet.on('image-change', (p) => imageEvents.push(p))
    sheet.on('content-reset', () => resets++)

    sheet.executeCommand(RestoreSheetCommand.id, { snapshot: afterSnap })

    expect(sheet.getImages()).toHaveLength(1)
    expect(sheet.getImage('new')?.type).toBe('jpeg')
    expect(sheet.getImage('old')).toBeUndefined()
    expect(resets).toBe(1)
    expect(imageEvents.some((e) => e.id == null || e.id === undefined)).toBe(true)

    sheet.undo()
    expect(sheet.getImage('old')).toBeDefined()
    expect(sheet.getImage('new')).toBeUndefined()

    sheet.redo()
    expect(sheet.getImage('new')).toBeDefined()
  })
})

describe('Sheet 图片：行列插入/删除平移与移除', () => {
  it('结构平移保留格内偏移；undo/redo 不丢 offset', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(
      makeInput({ anchor: { from: { row: 3, col: 1, offsetX: 8, offsetY: 4 } } })
    )

    sheet.insertRows(1, 2)
    expect(sheet.getImage(id)?.anchor.from).toEqual({ row: 5, col: 1, offsetX: 8, offsetY: 4 })

    expect(sheet.undo()).toBe(true)
    expect(sheet.getImage(id)?.anchor.from).toEqual({ row: 3, col: 1, offsetX: 8, offsetY: 4 })

    expect(sheet.redo()).toBe(true)
    expect(sheet.getImage(id)?.anchor.from).toEqual({ row: 5, col: 1, offsetX: 8, offsetY: 4 })
  })

  it('插入行：from/to 在插入点及以下下移', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(
      makeInput({ anchor: { from: { row: 2, col: 1 }, to: { row: 4, col: 3 } } })
    )
    sheet.insertRows(2, 2)
    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 4, col: 1 }, to: { row: 6, col: 3 } })
  })

  it('插入列：from/to 在插入点及以右右移', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(
      makeInput({ anchor: { from: { row: 0, col: 2 }, to: { row: 0, col: 4 } } })
    )
    sheet.insertCols(2, 1)
    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 0, col: 3 }, to: { row: 0, col: 5 } })
  })

  it('删除行：from 在区间内 → 移除；下方上移；undo 恢复', () => {
    const sheet = new Sheet()
    const keepId = sheet.insertImage(
      makeInput({ id: 'keep', anchor: { from: { row: 5, col: 0 } } })
    )
    const dropId = sheet.insertImage(
      makeInput({ id: 'drop', anchor: { from: { row: 2, col: 0 } }, data: pngBytes(2) })
    )

    sheet.deleteRows(1, 3) // 删 row1-3：drop(from=2) 移除；keep(from=5) → 2

    expect(sheet.getImage(dropId)).toBeUndefined()
    expect(sheet.getImage(keepId)?.anchor.from).toEqual({ row: 2, col: 0 })

    expect(sheet.undo()).toBe(true)
    expect(sheet.getImage(dropId)?.anchor.from).toEqual({ row: 2, col: 0 })
    expect(sheet.getImage(keepId)?.anchor.from).toEqual({ row: 5, col: 0 })

    expect(sheet.redo()).toBe(true)
    expect(sheet.getImage(dropId)).toBeUndefined()
    expect(sheet.getImage(keepId)?.anchor.from).toEqual({ row: 2, col: 0 })
  })

  it('删除列：from 在区间内移除；右侧左移', () => {
    const sheet = new Sheet()
    const keepId = sheet.insertImage(
      makeInput({ id: 'keep', anchor: { from: { row: 0, col: 5 } } })
    )
    sheet.insertImage(makeInput({ id: 'drop', anchor: { from: { row: 0, col: 2 } } }))

    sheet.deleteCols(1, 3)

    expect(sheet.getImage('drop')).toBeUndefined()
    expect(sheet.getImage(keepId)?.anchor.from).toEqual({ row: 0, col: 2 })
  })

  it('插入行 undo/redo：锚点往返', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(makeInput({ anchor: { from: { row: 3, col: 0 } } }))
    const before = sheet.getImage(id)!.anchor

    sheet.insertRows(1, 2)
    expect(sheet.getImage(id)?.anchor.from.row).toBe(5)

    sheet.undo()
    expect(sheet.getImage(id)?.anchor).toEqual(before)

    sheet.redo()
    expect(sheet.getImage(id)?.anchor.from.row).toBe(5)
  })

  it('删除行：to 落在区间内 → 收缩；undo/redo 锚点往返', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(
      makeInput({ anchor: { from: { row: 0, col: 1 }, to: { row: 3, col: 2 } } })
    )
    const before = sheet.getImage(id)!.anchor

    sheet.deleteRows(2, 2) // 删 row2-3：to.row=3 ∈ [2,4) → 收缩为 1；from 不动

    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 0, col: 1 }, to: { row: 1, col: 2 } })

    expect(sheet.undo()).toBe(true)
    expect(sheet.getImage(id)?.anchor).toEqual(before)

    expect(sheet.redo()).toBe(true)
    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 0, col: 1 }, to: { row: 1, col: 2 } })
  })

  it('删除列：from 在区间外、to 在区间内 → 收缩；undo/redo 往返', () => {
    const sheet = new Sheet()
    const id = sheet.insertImage(
      makeInput({ anchor: { from: { row: 1, col: 0 }, to: { row: 2, col: 4 } } })
    )
    const before = sheet.getImage(id)!.anchor

    sheet.deleteCols(2, 3) // 删 col2-4：to.col=4 ∈ [2,5) → 收缩为 1；from.col=0 不动

    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 1, col: 0 }, to: { row: 2, col: 1 } })

    expect(sheet.undo()).toBe(true)
    expect(sheet.getImage(id)?.anchor).toEqual(before)

    expect(sheet.redo()).toBe(true)
    expect(sheet.getImage(id)?.anchor).toEqual({ from: { row: 1, col: 0 }, to: { row: 2, col: 1 } })
  })
})
