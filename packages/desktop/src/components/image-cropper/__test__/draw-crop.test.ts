import { describe, expect, it, vi } from 'vitest'

import { drawCropToCanvas } from '../draw-crop'

/** 记录调用参数的 2d 上下文桩 */
function createCtxStub() {
  return { translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), drawImage: vi.fn() }
}

function createCanvasStub(ctx: ReturnType<typeof createCtxStub>) {
  return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement
}

const img = {} as HTMLImageElement
const selection = { x: 10, y: 20, width: 200, height: 100 }
const identity = { rotation: 0, flipX: false, flipY: false }

describe('drawCropToCanvas', () => {
  it('无变换时按选区原图像素尺寸输出', () => {
    const ctx = createCtxStub()
    const canvas = createCanvasStub(ctx)

    drawCropToCanvas(img, selection, identity, canvas)

    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(100)
    expect(ctx.rotate).toHaveBeenCalledWith(0)
    expect(ctx.scale).toHaveBeenCalledWith(1, 1)
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 10, 20, 200, 100, -100, -50, 200, 100)
  })

  it('旋转 90° / 270° 时输出尺寸交换宽高', () => {
    const ctx = createCtxStub()
    const canvas = createCanvasStub(ctx)

    drawCropToCanvas(img, selection, { ...identity, rotation: 90 }, canvas)

    expect(canvas.width).toBe(100)
    expect(canvas.height).toBe(200)
    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2)
    // 变换顺序与舞台一致：先旋转后缩放（翻转）
    expect(ctx.translate).toHaveBeenCalledWith(50, 100)
  })

  it('翻转以负缩放体现', () => {
    const ctx = createCtxStub()
    const canvas = createCanvasStub(ctx)

    drawCropToCanvas(img, selection, { ...identity, flipX: true, flipY: true }, canvas)

    expect(ctx.scale).toHaveBeenCalledWith(-1, -1)
  })

  it('传入输出尺寸时按该尺寸缩放输出', () => {
    const ctx = createCtxStub()
    const canvas = createCanvasStub(ctx)

    drawCropToCanvas(img, selection, identity, canvas, { width: 400, height: 200 })

    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(200)
    expect(ctx.scale).toHaveBeenCalledWith(2, 2)
  })

  it('输出尺寸只传一个维度时另一维按选区比例推算', () => {
    const ctx = createCtxStub()
    const canvas = createCanvasStub(ctx)

    drawCropToCanvas(img, selection, identity, canvas, { width: 100 })
    expect(canvas.width).toBe(100)
    expect(canvas.height).toBe(50)

    drawCropToCanvas(img, selection, identity, canvas, { height: 400 })
    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(400)
  })

  it('选区像素为小数时输出尺寸取整', () => {
    const ctx = createCtxStub()
    const canvas = createCanvasStub(ctx)

    drawCropToCanvas(img, { x: 0, y: 0, width: 100.4, height: 50.6 }, identity, canvas)

    expect(canvas.width).toBe(100)
    expect(canvas.height).toBe(51)
  })
})
