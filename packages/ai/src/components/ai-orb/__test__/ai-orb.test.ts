import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

import UAiOrb from '../ai-orb.vue'
import { createOrbRenderer } from '../orb-renderer'

/** 记录调用的 2D context 桩（happy-dom 无真实 canvas 实现） */
function createStubContext() {
  const calls = {
    fill: 0,
    clip: 0,
    gradient: 0,
    stroke: 0,
    fillText: 0,
    fillTextColor: null as unknown
  }
  const gradient = { addColorStop: () => {} }
  const ctx = {
    calls,
    fillStyle: null as unknown,
    strokeStyle: null as unknown,
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    closePath: () => {},
    arc: () => {},
    ellipse: () => {},
    clearRect: () => {},
    fillRect: () => {},
    setTransform: () => {},
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    stroke: () => {
      calls.stroke++
    },
    fill: () => {
      calls.fill++
    },
    fillText() {
      calls.fillText++
      calls.fillTextColor = ctx.fillStyle
    },
    clip: () => {
      calls.clip++
    },
    createRadialGradient: () => {
      calls.gradient++
      return gradient
    }
  }
  return ctx
}

function createStubCanvas(ctx: ReturnType<typeof createStubContext> | null) {
  return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement
}

/** 桩 Path2D（happy-dom 未实现） */
function stubPath2D() {
  class Path2DStub {
    moveTo() {}
    lineTo() {}
    closePath() {}
  }
  vi.stubGlobal('Path2D', Path2DStub)
}

describe('createOrbRenderer', () => {
  beforeEach(() => {
    stubPath2D()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renderOnce 绘制一帧（纯色球体 + 白色大眼睛，常态无嘴）', () => {
    const ctx = createStubContext()
    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48 })

    renderer.renderOnce()

    // 球体 + 双耳（外耳 + 内耳各 2）+ 双眼 = 7 次填充，常态无嘴无描边
    expect(ctx.calls.fill).toBe(7)
    expect(ctx.calls.stroke).toBe(0)
    expect(ctx.calls.fillText).toBe(0)
    expect(ctx.calls.gradient).toBe(0)
  })

  it('thinking 在球体右上角绘制同色问号', () => {
    const ctx = createStubContext()
    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48, status: 'thinking' })

    renderer.renderOnce()

    expect(ctx.calls.fillText).toBe(1)
    expect(ctx.calls.fillTextColor).toBe('#3d9bf0')
  })

  it('start/stop 控制 rAF 循环', () => {
    const ctx = createStubContext()
    const frames: ((now: number) => void)[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: (now: number) => void) => {
      frames.push(cb)
      return frames.length
    })
    const cancel = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancel)

    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48 })
    expect(renderer.running).toBe(false)

    renderer.start()
    expect(renderer.running).toBe(true)

    // 手动驱动两帧
    frames.shift()?.(16)
    frames.shift()?.(32)
    expect(ctx.calls.fill).toBeGreaterThan(0)

    renderer.stop()
    expect(renderer.running).toBe(false)
    expect(cancel).toHaveBeenCalled()

    // 已排队的帧回调执行后不再调度新帧
    const pending = frames.length
    frames.forEach((cb) => cb(48))
    expect(frames.length).toBe(pending)
  })

  it('状态切换平滑过渡且无异常', () => {
    const ctx = createStubContext()
    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48, status: 'idle' })

    renderer.setStatus('thinking')
    renderer.renderOnce()
    renderer.setStatus('speaking')
    renderer.renderOnce()

    expect(ctx.calls.fill).toBeGreaterThan(0)
  })

  it('resize 更新画布像素尺寸（dpr 上限 2）', () => {
    const ctx = createStubContext()
    const canvas = createStubCanvas(ctx)
    const renderer = createOrbRenderer(canvas, { size: 48 })

    expect(canvas.width).toBe(48)

    renderer.resize(96)
    expect(canvas.width).toBe(96)
  })

  it('trigger 瞬时表情改变绘制路径（frustrated 闭眼折线 + 撇嘴）', () => {
    const ctx = createStubContext()
    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48 })

    // 常态：眼睛为填充圆眼，无嘴无描边
    renderer.renderOnce()
    const baseStrokes = ctx.calls.stroke
    expect(baseStrokes).toBe(0)

    // frustrated：双眼 >< 折线 2 次描边 + 撇嘴 1 次描边
    renderer.trigger('frustrated')
    expect(ctx.calls.stroke).toBeGreaterThan(baseStrokes)
  })

  it('trigger happy 弯眼弧线 + 张嘴笑', () => {
    const ctx = createStubContext()
    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48 })

    renderer.renderOnce()
    const baseStrokes = ctx.calls.stroke

    // happy：双眼弯月弧线 2 次描边 + 张嘴笑 1 次填充
    renderer.trigger('happy')
    expect(ctx.calls.stroke).toBeGreaterThan(baseStrokes)
  })

  it('trigger shock 睁大眼睛（填充路径增多）', () => {
    const ctx = createStubContext()
    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48 })

    renderer.renderOnce()
    const baseFills = ctx.calls.fill

    // shock：圆眼 + 「o」嘴，填充次数增加（无描边嘴）
    renderer.trigger('shock')
    expect(ctx.calls.fill).toBeGreaterThan(baseFills)
  })

  it('setPointer / poke 交互不抛异常且保持绘制', () => {
    const ctx = createStubContext()
    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48 })

    renderer.setPointer({ x: 0.8, y: -0.4 })
    renderer.poke()
    renderer.renderOnce()
    expect(ctx.calls.fill).toBeGreaterThan(0)

    renderer.setPointer(null)
    renderer.renderOnce()
    expect(ctx.calls.fill).toBeGreaterThan(3)
  })

  it('getContext 返回 null 时所有操作静默不崩', () => {
    const renderer = createOrbRenderer(createStubCanvas(null), { size: 48 })

    expect(() => {
      renderer.renderOnce()
      renderer.start()
      renderer.setStatus('thinking')
      renderer.trigger('happy')
      renderer.resize(24)
      renderer.stop()
    }).not.toThrow()
    expect(renderer.running).toBe(false)
  })
})

describe('UAiOrb', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('挂载渲染 canvas 并应用尺寸样式（无 2D 环境不崩）', async () => {
    // happy-dom 的 getContext 无真实实现，显式桩为 null
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp({ render: () => h(UAiOrb, { size: 64, status: 'thinking' }) })
    app.mount(host)
    await nextTick()

    const canvas = host.querySelector('canvas.u-ai-orb')
    expect(canvas).toBeTruthy()
    expect(canvas?.style.width).toBe('64px')
    expect(canvas?.style.height).toBe('64px')

    app.unmount()
    host.remove()
  })

  it('点击 canvas 触发 click 事件', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const onClick = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp({ render: () => h(UAiOrb, { onClick }) })
    app.mount(host)
    await nextTick()

    host.querySelector('canvas.u-ai-orb')!.dispatchEvent(new Event('click'))
    expect(onClick).toHaveBeenCalledTimes(1)

    app.unmount()
    host.remove()
  })
})
