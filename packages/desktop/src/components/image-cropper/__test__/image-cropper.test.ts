import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, shallowRef } from 'vue'

import type { ImageCropperChangePayload, ImageCropperExposed } from '../../../types'
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

describe('UImageCropper 工具栏与预览', () => {
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

  function mountWithProps(
    props: Record<string, unknown>,
    slots?: Record<string, (...args: any[]) => any>
  ) {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render() {
        return h(UImageCropper, props, slots)
      }
    })
    app.mount(host)
    return {
      host,
      unmount() {
        app.unmount()
        host.remove()
      }
    }
  }

  function toolButton(host: HTMLElement, label: string) {
    const buttons = [...host.querySelectorAll<HTMLElement>('.u-image-cropper__tool')]
    const btn = buttons.find(
      (el) => el.textContent?.trim() === label || el.getAttribute('aria-label') === label
    )
    if (!btn) throw new Error(`未找到工具栏按钮: ${label}`)
    return btn
  }

  function stageTransform(host: HTMLElement) {
    const stage = host.querySelector('.u-image-cropper__stage') as HTMLElement
    const m = stage.style.transform.match(
      /translate\((-?[\d.]+)px, (-?[\d.]+)px\) rotate\((-?[\d.]+)deg\) scale\((-?[\d.]+), (-?[\d.]+)\)/
    )
    if (!m) throw new Error(`无法解析 transform: ${stage.style.transform}`)
    return { tx: +m[1]!, ty: +m[2]!, rotation: +m[3]!, sx: +m[4]!, sy: +m[5]! }
  }

  function selectionRect(host: HTMLElement) {
    const el = host.querySelector('.u-image-cropper__selection') as HTMLElement
    return {
      x: parseFloat(el.style.left),
      y: parseFloat(el.style.top),
      width: parseFloat(el.style.width),
      height: parseFloat(el.style.height)
    }
  }

  it('宽高比预设切换后选区立即按比例重算，并高亮当前预设', async () => {
    const { host, unmount } = mountWithProps({ src: 'https://example.com/a.png' })
    await flush()

    expect(selectionRect(host)).toEqual({ x: 80, y: 60, width: 640, height: 480 })

    toolButton(host, '1:1').click()
    await nextTick()
    // 以选区中心 (400, 300) 为锚按 1:1 重算
    expect(selectionRect(host)).toEqual({ x: 100, y: 0, width: 600, height: 600 })
    expect(toolButton(host, '1:1').classList.contains('is-active')).toBe(true)

    toolButton(host, '自由').click()
    await nextTick()
    // 恢复自由比例：选区保持现状，仅解除比例约束
    expect(selectionRect(host)).toEqual({ x: 100, y: 0, width: 600, height: 600 })
    expect(toolButton(host, '自由').classList.contains('is-active')).toBe(true)
    unmount()
  })

  it('缩放 / 旋转 / 翻转 / 重置按钮即时驱动画布变换', async () => {
    const { host, unmount } = mountWithProps({ src: 'https://example.com/a.png' })
    await flush()

    // 初始 fit：缩放 0.5 居中
    expect(stageTransform(host)).toEqual({ tx: -200, ty: -150, rotation: 0, sx: 0.5, sy: 0.5 })

    toolButton(host, '放大').click()
    await nextTick()
    expect(stageTransform(host).sx).toBeCloseTo(0.6, 10)

    toolButton(host, '缩小').click()
    await nextTick()
    expect(stageTransform(host).sx).toBe(0.5)

    toolButton(host, '顺时针旋转 90°').click()
    await nextTick()
    expect(stageTransform(host).rotation).toBe(90)

    toolButton(host, '逆时针旋转 90°').click()
    await nextTick()
    expect(stageTransform(host).rotation).toBe(0)

    toolButton(host, '水平翻转').click()
    toolButton(host, '垂直翻转').click()
    await nextTick()
    expect(stageTransform(host).sx).toBe(-0.5)
    expect(stageTransform(host).sy).toBe(-0.5)

    toolButton(host, '重置').click()
    await nextTick()
    expect(stageTransform(host)).toEqual({ tx: -200, ty: -150, rotation: 0, sx: 0.5, sy: 0.5 })
    expect(selectionRect(host)).toEqual({ x: 80, y: 60, width: 640, height: 480 })
    unmount()
  })

  it('showToolbar 隐藏内置工具栏，toolbar 插槽完全自定义并暴露作用域方法', async () => {
    const { host, unmount } = mountWithProps(
      { src: 'https://example.com/a.png' },
      {
        toolbar: (scope: { rotate: (d: 1 | -1) => void }) =>
          h('button', { class: 'my-rotate', onClick: () => scope.rotate(1) }, '自定义旋转')
      }
    )
    await flush()

    // 插槽替代内置工具：预设按钮不存在
    expect(host.querySelector('.u-image-cropper__tool')).toBeNull()
    const custom = host.querySelector('.my-rotate') as HTMLElement
    expect(custom).toBeTruthy()

    custom.click()
    await nextTick()
    expect(stageTransform(host).rotation).toBe(90)
    unmount()

    const hidden = mountWithProps({ src: 'https://example.com/a.png', showToolbar: false })
    await flush()
    expect(hidden.host.querySelector('.u-image-cropper__toolbar')).toBeNull()
    hidden.unmount()
  })

  it('默认显示实时预览画布，showPreview 关闭预览区', async () => {
    const { host, unmount } = mountWithProps({ src: 'https://example.com/a.png' })
    await flush()
    expect(host.querySelector('.u-image-cropper__preview-canvas')).toBeTruthy()
    unmount()

    const hidden = mountWithProps({ src: 'https://example.com/a.png', showPreview: false })
    await flush()
    expect(hidden.host.querySelector('.u-image-cropper__preview')).toBeNull()
    hidden.unmount()
  })

  it('预览画布按选区等比缩放到画布区 30% 以内，旋转后宽高互换', async () => {
    const { host, unmount } = mountWithProps({ src: 'https://example.com/a.png' })
    await flush()

    const canvas = host.querySelector<HTMLCanvasElement>('.u-image-cropper__preview-canvas')!
    // 选区 640×480，画布区 400×300 的 30% 上限为 120×90 → 等比缩放 0.1875
    expect(canvas.width).toBe(120)
    expect(canvas.height).toBe(90)

    // 旋转 90° 后基准尺寸互换为 480×640 → 67.5×90（宽度取整 68）
    toolButton(host, '顺时针旋转 90°').click()
    await flush()
    expect(canvas.width).toBe(68)
    expect(canvas.height).toBe(90)

    unmount()
  })
})

describe('UImageCropper getResult 与裁剪变化事件', () => {
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

  /** 挂载并拿到组件暴露的 ref，同时收集 crop-change 事件载荷 */
  function mountExposed(props: Record<string, unknown> = {}) {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const cropperRef = shallowRef<ImageCropperExposed>()
    const payloads: ImageCropperChangePayload[] = []
    const app = createApp({
      render() {
        return h(UImageCropper, {
          src: 'https://example.com/a.png',
          ...props,
          ref: cropperRef,
          onCropChange: (payload: ImageCropperChangePayload) => payloads.push(payload)
        })
      }
    })
    app.mount(host)

    return {
      host,
      cropperRef,
      payloads,
      unmount() {
        app.unmount()
        host.remove()
      }
    }
  }

  /** getResult 最近一次实际导出的离屏画布（toBlob 的调用方） */
  function exportedCanvas(toBlobSpy: ReturnType<typeof vi.spyOn>) {
    return toBlobSpy.mock.instances.at(-1) as unknown as HTMLCanvasElement
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

  it('getResult() 默认按原图选区像素输出 Blob + base64', async () => {
    const { cropperRef, unmount } = mountExposed()
    await flush()

    const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
    const result = await cropperRef.value!.getResult()

    // 初始选区 640×480（MockImage 800×600 的居中 80%）
    expect(exportedCanvas(toBlobSpy).width).toBe(640)
    expect(exportedCanvas(toBlobSpy).height).toBe(480)
    expect(result.blob).toBeInstanceOf(Blob)
    expect(result.blob.type).toBe('image/png')
    expect(result.base64.startsWith('data:image/png;base64,')).toBe(true)
    unmount()
  })

  it('getResult() 传入目标宽 / 高时按该尺寸缩放输出，缺省维度按比例推算', async () => {
    const { cropperRef, unmount } = mountExposed()
    await flush()

    const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
    await cropperRef.value!.getResult({ width: 320 })
    expect(exportedCanvas(toBlobSpy).width).toBe(320)
    expect(exportedCanvas(toBlobSpy).height).toBe(240)

    await cropperRef.value!.getResult({ width: 160, height: 160 })
    expect(exportedCanvas(toBlobSpy).width).toBe(160)
    expect(exportedCanvas(toBlobSpy).height).toBe(160)
    unmount()
  })

  it('旋转 90° 后 getResult 输出与画布视觉一致（输出尺寸交换宽高）', async () => {
    const { host, cropperRef, unmount } = mountExposed()
    await flush()

    const rotateBtn = host.querySelector<HTMLElement>('[aria-label="顺时针旋转 90°"]')!
    rotateBtn.click()
    await nextTick()

    const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
    await cropperRef.value!.getResult()
    expect(exportedCanvas(toBlobSpy).width).toBe(480)
    expect(exportedCanvas(toBlobSpy).height).toBe(640)
    unmount()
  })

  it('图片未加载时 getResult 抛出可捕获错误', async () => {
    const { cropperRef, unmount } = mountExposed({ src: undefined })
    await flush()

    await expect(cropperRef.value!.getResult()).rejects.toThrow(/not loaded/)
    unmount()
  })

  it('画布被跨域图片污染时 getResult 拒绝，不静默失败', async () => {
    const { cropperRef, unmount } = mountExposed()
    await flush()

    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(() => {
      throw new DOMException('The canvas has been tainted by cross-origin data.', 'SecurityError')
    })
    await expect(cropperRef.value!.getResult()).rejects.toThrow(/tainted/)
    unmount()
  })

  it('图片加载并初始化选区后发出 crop-change，载荷含选区与变换摘要', async () => {
    const { payloads, unmount } = mountExposed()
    await flush()

    expect(payloads).toEqual([
      {
        selection: { x: 80, y: 60, width: 640, height: 480 },
        transform: { rotation: 0, flipX: false, flipY: false }
      }
    ])
    unmount()
  })

  it('选区拖动后发出 crop-change，载荷为最新选区（图片像素坐标）', async () => {
    const { host, payloads, unmount } = mountExposed()
    await flush()

    const count = payloads.length
    // fit 缩放 0.5：屏幕 30px = 图片 60px
    await drag(host.querySelector('.u-image-cropper__selection')!, 30, 0)

    expect(payloads.length).toBe(count + 1)
    expect(payloads.at(-1)!.selection).toEqual({ x: 140, y: 60, width: 640, height: 480 })
    unmount()
  })

  it('旋转 / 翻转等图片变换变化时发出 crop-change，变换摘要随之更新', async () => {
    const { host, payloads, unmount } = mountExposed()
    await flush()

    host.querySelector<HTMLElement>('[aria-label="顺时针旋转 90°"]')!.click()
    await nextTick()
    expect(payloads.at(-1)!.transform).toEqual({ rotation: 90, flipX: false, flipY: false })

    host.querySelector<HTMLElement>('[aria-label="水平翻转"]')!.click()
    await nextTick()
    expect(payloads.at(-1)!.transform).toEqual({ rotation: 90, flipX: true, flipY: false })
    unmount()
  })
})
