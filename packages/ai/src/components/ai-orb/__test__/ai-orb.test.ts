import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

import UAiOrb from '../ai-orb.vue'
import { createOrbRenderer } from '../orb-renderer'

/** 记录调用的 2D context 桩（happy-dom 无真实 canvas 实现） */
function createStubContext() {
  const calls = { fill: 0, clip: 0, gradient: 0 }
  const gradient = { addColorStop: () => {} }
  const ctx = {
    calls,
    fillStyle: null as unknown,
    strokeStyle: null as unknown,
    lineWidth: 1,
    lineCap: 'butt',
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
    stroke: () => {},
    fill: () => {
      calls.fill++
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

  it('renderOnce 绘制一帧（阴影 + 球体 + 高光），并缓存渐变', () => {
    const ctx = createStubContext()
    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48 })

    renderer.renderOnce()

    expect(ctx.calls.fill).toBeGreaterThanOrEqual(3)
    expect(ctx.calls.gradient).toBe(3)

    // 再次绘制不重建渐变
    renderer.renderOnce()
    expect(ctx.calls.gradient).toBe(3)
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

  it('setColor 重建渐变；非法颜色被忽略', () => {
    const ctx = createStubContext()
    const renderer = createOrbRenderer(createStubCanvas(ctx), { size: 48 })
    expect(ctx.calls.gradient).toBe(3)

    renderer.setColor('not-a-color')
    expect(ctx.calls.gradient).toBe(3)

    renderer.setColor('#ff6600')
    expect(ctx.calls.gradient).toBe(6)
  })

  it('getContext 返回 null 时所有操作静默不崩', () => {
    const renderer = createOrbRenderer(createStubCanvas(null), { size: 48 })

    expect(() => {
      renderer.renderOnce()
      renderer.start()
      renderer.setStatus('thinking')
      renderer.setColor('#fff')
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
})
