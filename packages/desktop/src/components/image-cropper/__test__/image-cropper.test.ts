import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import UImageCropper from '../image-cropper.vue'

/** 可控的 Image 桩，set src 后异步触发 onload / onerror */
class MockImage {
  static instances: MockImage[] = []
  static failNext = false

  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  crossOrigin: string | null = null
  naturalWidth = 800
  naturalHeight = 600

  #src = ''

  constructor() {
    MockImage.instances.push(this)
  }

  set src(value: string) {
    this.#src = value
    const fail = MockImage.failNext
    MockImage.failNext = false
    queueMicrotask(() => (fail ? this.onerror?.() : this.onload?.()))
  }

  get src() {
    return this.#src
  }
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

function mountCropper(initialSrc?: File | Blob | string, options?: { aspectRatio?: number }) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const src = ref<File | Blob | string | undefined>(initialSrc)
  const aspectRatio = ref<number | undefined>(options?.aspectRatio)
  const app = createApp({
    render() {
      return h(UImageCropper, { src: src.value, aspectRatio: aspectRatio.value })
    }
  })
  app.mount(host)

  return {
    host,
    async setSrc(value: File | Blob | string | undefined) {
      src.value = value
      await flush()
    },
    async setAspectRatio(value: number | undefined) {
      aspectRatio.value = value
      await flush()
    },
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UImageCropper 图片源加载', () => {
  beforeEach(() => {
    MockImage.instances = []
    MockImage.failNext = false
    vi.stubGlobal('Image', MockImage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('URL 源以 anonymous 跨域加载并渲染', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    const img = host.querySelector('img')
    expect(img).toBeTruthy()
    expect(img!.src).toBe('https://example.com/a.png')
    expect(MockImage.instances[0]!.crossOrigin).toBe('anonymous')
    unmount()
  })

  it('Blob 源经 createObjectURL 渲染，切换与卸载时释放', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-1')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    const { host, setSrc, unmount } = mountCropper(new Blob(['a']))
    await flush()

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(host.querySelector('img')?.src).toBe('blob:mock-1')

    await setSrc('https://example.com/b.png')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-1')
    expect(host.querySelector('img')?.src).toBe('https://example.com/b.png')

    await setSrc(new Blob(['b']))
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    unmount()
    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
  })

  it('加载失败置空态，不渲染图片', async () => {
    MockImage.failNext = true
    const { host, unmount } = mountCropper('https://example.com/broken.png')
    await flush()

    expect(host.querySelector('img')).toBeNull()
    unmount()
  })

  it('src 置空时不加载图片', async () => {
    const { host, unmount } = mountCropper()
    await flush()

    expect(host.querySelector('img')).toBeNull()
    expect(MockImage.instances.length).toBe(0)
    unmount()
  })
})

describe('UImageCropper 选区交互', () => {
  beforeEach(() => {
    MockImage.instances = []
    MockImage.failNext = false
    vi.stubGlobal('Image', MockImage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function getSelection(host: HTMLElement) {
    return host.querySelector('.u-image-cropper__selection') as HTMLElement | null
  }

  function selectionRect(host: HTMLElement) {
    const el = getSelection(host)!
    return {
      x: parseFloat(el.style.left),
      y: parseFloat(el.style.top),
      width: parseFloat(el.style.width),
      height: parseFloat(el.style.height)
    }
  }

  /** 从 (100, 100) 按下目标元素并拖动 (dx, dy) 后抬起 */
  async function drag(target: Element, dx: number, dy: number) {
    target.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 100, clientY: 100 })
    )
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 + dx, clientY: 100 + dy }))
    document.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
  }

  it('图片加载后初始选区为居中 80% 区域，含遮罩 / 网格线 / 8 个手柄', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    // MockImage 为 800×600：选区 640×480，位于 (80, 60)
    expect(selectionRect(host)).toEqual({ x: 80, y: 60, width: 640, height: 480 })
    expect(host.querySelectorAll('.u-image-cropper__mask')).toHaveLength(4)
    expect(host.querySelectorAll('.u-image-cropper__grid-line')).toHaveLength(4)
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(8)
    unmount()
  })

  it('选区整体拖动并钳制在图片范围内', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    const sel = getSelection(host)!
    await drag(sel, 50, 50)
    expect(selectionRect(host)).toEqual({ x: 130, y: 110, width: 640, height: 480 })

    // 拖出左上 / 右下边界均被钳制
    await drag(sel, -9999, -9999)
    expect(selectionRect(host)).toEqual({ x: 0, y: 0, width: 640, height: 480 })

    await drag(sel, 9999, 9999)
    expect(selectionRect(host)).toEqual({ x: 160, y: 120, width: 640, height: 480 })
    unmount()
  })

  it('手柄调整选区大小并钳制在图片范围内', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    const se = host.querySelector('[data-handle="se"]')!
    await drag(se, 50, 40)
    expect(selectionRect(host)).toEqual({ x: 80, y: 60, width: 690, height: 520 })

    // 越界调整被钳制到图片边缘
    await drag(se, 9999, 9999)
    expect(selectionRect(host)).toEqual({ x: 80, y: 60, width: 720, height: 540 })

    // 西北角手柄：位置随动、对侧不动，且不小于最小尺寸
    const nw = host.querySelector('[data-handle="nw"]')!
    await drag(nw, 9999, 9999)
    expect(selectionRect(host)).toEqual({ x: 780, y: 580, width: 20, height: 20 })
    unmount()
  })

  it('aspectRatio 约束初始选区与角手柄调整', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png', { aspectRatio: 1 })
    await flush()

    // 1:1 内接居中 80% 框：480×480，位于 (160, 60)
    expect(selectionRect(host)).toEqual({ x: 160, y: 60, width: 480, height: 480 })

    // 角手柄按比例约束：宽度方向位移更大，由宽度驱动
    const se = host.querySelector('[data-handle="se"]')!
    await drag(se, 60, 10)
    expect(selectionRect(host)).toEqual({ x: 160, y: 60, width: 540, height: 540 })

    // 仅垂直方向拖动也由高度换算出宽度，保持比例
    const ne = host.querySelector('[data-handle="ne"]')!
    await drag(ne, 0, -30)
    expect(selectionRect(host)).toEqual({ x: 160, y: 30, width: 570, height: 570 })
    unmount()
  })

  it('aspectRatio 下边中手柄按比例绕中心联动并钳制', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png', { aspectRatio: 1 })
    await flush()

    // 东边缘手柄：宽度驱动，高度绕中心随动；受中心锚定边界钳制
    const e = host.querySelector('[data-handle="e"]')!
    await drag(e, 9999, 0)
    expect(selectionRect(host)).toEqual({ x: 160, y: 0, width: 600, height: 600 })
    unmount()
  })

  it('aspectRatio 变化时以选区中心为锚按比例重算', async () => {
    const { host, setAspectRatio, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    await setAspectRatio(1)
    // 中心 (400, 300)：640 宽对应高 640 超出图片，按高 600 重算
    expect(selectionRect(host)).toEqual({ x: 100, y: 0, width: 600, height: 600 })

    await setAspectRatio(16 / 9)
    expect(selectionRect(host).height).toBeCloseTo(337.5)
    expect(selectionRect(host).y).toBeCloseTo(131.25)
    expect(selectionRect(host).width).toBe(600)
    expect(selectionRect(host).x).toBe(100)

    // 恢复自由比例后选区保持现状
    await setAspectRatio(undefined)
    expect(selectionRect(host).width).toBe(600)
    unmount()
  })

  it('切换图片源后选区重置为初始', async () => {
    const { host, setSrc, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    await drag(getSelection(host)!, 100, 50)
    // 拖动越界被钳制（最大 x = 800 - 640 = 160）
    expect(selectionRect(host).x).toBe(160)

    await setSrc('https://example.com/b.png')
    expect(selectionRect(host)).toEqual({ x: 80, y: 60, width: 640, height: 480 })
    unmount()
  })
})

describe('UImageCropper 图片变换', () => {
  /** 让画布拿到 400×300 的容器尺寸（happy-dom 的 ResizeObserver 不触发回调） */
  class MockResizeObserver {
    constructor(private cb: ResizeObserverCallback) {}

    observe() {
      this.cb(
        [{ contentRect: { width: 400, height: 300 } } as ResizeObserverEntry],
        this as unknown as ResizeObserver
      )
    }

    unobserve() {}

    disconnect() {}
  }

  beforeEach(() => {
    MockImage.instances = []
    MockImage.failNext = false
    vi.stubGlobal('Image', MockImage)
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function getCanvas(host: HTMLElement) {
    const canvas = host.querySelector('.u-image-cropper__canvas') as HTMLElement
    // happy-dom 的 DOMRect 字段为 undefined，补零保证锚点计算
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
    return canvas
  }

  function stageTransform(host: HTMLElement) {
    const stage = host.querySelector('.u-image-cropper__stage') as HTMLElement
    const m = stage.style.transform.match(
      /translate\((-?[\d.]+)px, (-?[\d.]+)px\) rotate\((-?[\d.]+)deg\) scale\((-?[\d.]+), (-?[\d.]+)\)/
    )
    if (!m) throw new Error(`无法解析 transform: ${stage.style.transform}`)
    return { tx: +m[1]!, ty: +m[2]!, rotation: +m[3]!, sx: +m[4]!, sy: +m[5]! }
  }

  async function wheel(host: HTMLElement, deltaY: number) {
    // happy-dom 的 WheelEvent 不携带 clientX / clientY，用 MouseEvent 模拟并补 deltaY
    const e = new MouseEvent('wheel', { clientX: 0, clientY: 0 })
    Object.defineProperty(e, 'deltaY', { value: deltaY })
    getCanvas(host).dispatchEvent(e)
    await nextTick()
  }

  /** 从 (100, 100) 按下目标元素并拖动 (dx, dy) 后抬起 */
  async function drag(target: Element, dx: number, dy: number) {
    target.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 100, clientY: 100 })
    )
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 + dx, clientY: 100 + dy }))
    document.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
  }

  it('图片加载后按容器适应缩放并居中', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    // 容器 400×300、图片 800×600：fit 缩放 0.5，平移使图片中心对齐画布中心
    expect(stageTransform(host)).toEqual({ tx: -200, ty: -150, rotation: 0, sx: 0.5, sy: 0.5 })
    unmount()
  })

  it('滚轮以指针为锚缩放，缩小钳制在适应缩放', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    await wheel(host, -100)
    let t = stageTransform(host)
    expect(t.sx).toBeCloseTo(0.6, 10)
    expect(t.tx).toBeCloseTo(-160, 8)
    expect(t.ty).toBeCloseTo(-120, 8)

    await wheel(host, 100)
    await wheel(host, 100)
    t = stageTransform(host)
    expect(t.sx).toBe(0.5)
    expect(t.tx).toBe(-200)
    unmount()
  })

  it('图片未超出容器时选区外拖动不平移', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    // fit 状态显示尺寸 400×300 未超出容器
    await drag(getCanvas(host), 30, 15)
    expect(stageTransform(host)).toEqual({ tx: -200, ty: -150, rotation: 0, sx: 0.5, sy: 0.5 })
    unmount()
  })

  it('放大后选区外拖动平移图片、选区内拖动移动选区，两者互不干扰', async () => {
    const { host, unmount } = mountCropper('https://example.com/a.png')
    await flush()

    // 放大到 0.6：显示尺寸 480×360 超出容器
    await wheel(host, -100)

    // 选区外（画布空白处）拖动：平移图片
    await drag(getCanvas(host), 30, 15)
    const t = stageTransform(host)
    expect(t.tx).toBeCloseTo(-130, 8)
    expect(t.ty).toBeCloseTo(-105, 8)

    // 选区内拖动：移动选区（屏幕 30px / 缩放 0.6 = 图片 50px），图片不平移
    const sel = host.querySelector('.u-image-cropper__selection')!
    await drag(sel, 30, 0)
    expect(parseFloat((sel as HTMLElement).style.left)).toBeCloseTo(130, 10)
    const after = stageTransform(host)
    expect(after.tx).toBeCloseTo(t.tx, 10)
    expect(after.ty).toBeCloseTo(t.ty, 10)
    unmount()
  })
})
