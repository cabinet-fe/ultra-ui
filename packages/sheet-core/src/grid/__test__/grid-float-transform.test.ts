import { describe, expect, it } from 'vite-plus/test'

import { createGrid, flushMicrotasks } from './grid-test-utils'

/** happy-dom 可能缺 objectURL 实现：测试内补最小桩（同 grid-float-images.test.ts） */
function ensureObjectURLStubs(): void {
  const owner = URL as unknown as Record<string, unknown>
  if (typeof owner.createObjectURL !== 'function') {
    owner.createObjectURL = (): string => 'blob:mock-transform'
  }
  if (typeof owner.revokeObjectURL !== 'function') {
    owner.revokeObjectURL = (): void => {}
  }
}

const PNG_BYTES = new Uint8Array([137, 80, 78, 71])

describe('浮动图片变换桥接（rotation 映射 + onTransformEnd 写回）', () => {
  it('rotation 双向映射：模型 rotation → 引擎对象；旧模型无字段不带 rotation', async () => {
    ensureObjectURLStubs()
    const { grid, table, sheet } = createGrid()
    try {
      const id = sheet.insertImage({
        data: PNG_BYTES,
        type: 'png',
        anchor: { from: { row: 0, col: 0 } },
        width: 100,
        height: 50,
        rotation: 45
      })
      await flushMicrotasks()
      expect(table.floatObjects.get(id)?.rotation).toBe(45)

      // 模型改角度（经命令）→ 引擎对象同步
      sheet.updateImage(id, { rotation: 90 })
      await flushMicrotasks()
      expect(table.floatObjects.get(id)?.rotation).toBe(90)

      // 旧快照/旧模型无字段：缺省不带 rotation（引擎按 0 渲染，向后兼容）
      const plain = sheet.insertImage({
        data: PNG_BYTES,
        type: 'png',
        anchor: { from: { row: 2, col: 2 } },
        width: 40,
        height: 20
      })
      await flushMicrotasks()
      expect(table.floatObjects.get(plain)?.rotation).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('变换结束写回：缩放提交新 size（无 to 不引入引擎合成 to）', async () => {
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
      const layer = table.floatObjects
      layer.select(id)
      // 对象左上在 cell(0,0) 原点 (46,28)：右下角手柄 (146,78) 拖到 (196,128)
      // （对侧锚点固定）→ 150×100，锚点保持 (0,0)
      expect(layer.beginTransform('right-bottom', 146, 78)).toBe(true)
      layer.transformMove(196, 128, false)
      layer.endTransform()
      await flushMicrotasks()

      const image = sheet.getImage(id)
      expect(image?.width).toBe(150)
      expect(image?.height).toBe(100)
      expect(image?.rotation).toBe(0)
      expect(image?.anchor.from).toEqual({ row: 0, col: 0 })
      expect(image?.anchor.to).toBeUndefined()
      // 写回后模型 → 引擎回流量新尺寸
      expect(table.floatObjects.get(id)?.size).toEqual({ width: 150, height: 100 })
    } finally {
      grid.release()
    }
  })

  it('变换结束写回：旋转提交角度（有 to 保留跨度），一次 undo 整体还原', async () => {
    ensureObjectURLStubs()
    const { grid, table, sheet } = createGrid()
    try {
      const id = sheet.insertImage({
        data: PNG_BYTES,
        type: 'png',
        anchor: { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } },
        width: 100,
        height: 50
      })
      await flushMicrotasks()
      const layer = table.floatObjects
      layer.select(id)
      // 中心 (96,53)：从正右 (146,53) 拖到正下 (96,103) → 顺时针 90°
      expect(layer.beginTransform('rotate', 146, 53)).toBe(true)
      layer.transformMove(96, 103, false)
      layer.endTransform()
      await flushMicrotasks()

      const image = sheet.getImage(id)
      expect(image?.rotation).toBe(90)
      expect(image?.width).toBe(100)
      expect(image?.height).toBe(50)
      expect(image?.anchor.from).toEqual({ row: 0, col: 0 })
      expect(image?.anchor.to).toEqual({ row: 1, col: 1 })
      expect(table.floatObjects.get(id)?.rotation).toBe(90)

      // 一次 undo 还原变换前状态（锚点/尺寸/角度同一命令提交）
      expect(sheet.undo()).toBe(true)
      const restored = sheet.getImage(id)
      expect(restored?.rotation).toBeUndefined()
      expect(restored?.width).toBe(100)
      expect(restored?.height).toBe(50)
      expect(restored?.anchor.from).toEqual({ row: 0, col: 0 })
      expect(restored?.anchor.to).toEqual({ row: 1, col: 1 })
    } finally {
      grid.release()
    }
  })

  it('只读模式：变换手柄不开启（不写模型）', async () => {
    ensureObjectURLStubs()
    const { grid, table, sheet } = createGrid({ readonly: true })
    try {
      const id = sheet.insertImage({
        data: PNG_BYTES,
        type: 'png',
        anchor: { from: { row: 0, col: 0 } },
        width: 100,
        height: 50
      })
      await flushMicrotasks()
      const layer = table.floatObjects
      layer.select(id)
      expect(layer.beginTransform('right-bottom', 146, 78)).toBe(false)
      const before = sheet.getImage(id)
      layer.transformMove(196, 128, false)
      layer.endTransform()
      await flushMicrotasks()
      expect(sheet.getImage(id)).toEqual(before)
    } finally {
      grid.release()
    }
  })

  it('Shift 旋转吸附 15°：写回载荷为吸附角度', async () => {
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
      const layer = table.floatObjects
      layer.select(id)
      // 从正右 (146,53) 拖 60°：吸附到 60（15° 步进）
      expect(layer.beginTransform('rotate', 146, 53)).toBe(true)
      const rad = (60 * Math.PI) / 180
      layer.transformMove(96 + 50 * Math.cos(rad), 53 + 50 * Math.sin(rad), true)
      layer.endTransform()
      await flushMicrotasks()
      expect(sheet.getImage(id)?.rotation).toBe(60)
    } finally {
      grid.release()
    }
  })
})
