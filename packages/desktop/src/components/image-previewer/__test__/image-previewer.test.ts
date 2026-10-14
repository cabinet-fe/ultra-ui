// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import UImagePreviewer from '../image-previewer.vue'

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  // transition 的 leave 移除挂在 rAF 上，happy-dom 的 rAF 晚于 setTimeout(0) 一拍
  await new Promise((resolve) => requestAnimationFrame(() => resolve(0)))
  await nextTick()
}

interface MountOptions {
  props?: Record<string, unknown>
  /** 是否绑定 v-model:open（默认绑定，初值 true） */
  bindOpen?: boolean
}

function mountPreviewer({ props, bindOpen = true }: MountOptions = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const opened = ref(true)
  const onClose = vi.fn()
  const onZoomChange = vi.fn()
  const onError = vi.fn()
  const app = createApp({
    render() {
      return h(UImagePreviewer, {
        src: 'https://example.com/a.png',
        ...props,
        ...(bindOpen
          ? { open: opened.value, 'onUpdate:open': (v: boolean) => (opened.value = v) }
          : {}),
        onClose,
        onZoomChange,
        onError
      })
    }
  })
  app.mount(host)

  return {
    host,
    opened,
    onClose,
    onZoomChange,
    onError,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

function root() {
  return document.body.querySelector<HTMLElement>('.u-image-previewer')
}

function stage() {
  return document.body.querySelector<HTMLElement>('.u-image-previewer__stage')
}

function stageScale(): number {
  const m = stage()!.style.transform.match(/scale\(([\d.]+)\)/)
  if (!m) throw new Error(`无法解析 transform: ${stage()!.style.transform}`)
  return Number(m[1])
}

/** happy-dom 的 WheelEvent 不携带 clientX / clientY，用 MouseEvent 模拟并补按键与 deltaY */
function wheel(target: Element, deltaY: number) {
  const e = new MouseEvent('wheel', { clientX: 0, clientY: 0, ctrlKey: true, bubbles: true })
  Object.defineProperty(e, 'deltaY', { value: deltaY })
  target.dispatchEvent(e)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('UImagePreviewer 挂载与关闭', () => {
  it('lightbox 默认 Teleport 到 body，渲染图片与关闭 / 缩放工具', async () => {
    const { unmount } = mountPreviewer()
    await flush()

    const img = root()!.querySelector('img')
    expect(img).toBeTruthy()
    expect(img!.getAttribute('src')).toBe('https://example.com/a.png')
    expect(img!.getAttribute('alt')).toBe('图片预览')
    expect(root()!.querySelector('[aria-label="关闭"]')).toBeTruthy()
    expect(root()!.querySelector('[aria-label="放大"]')).toBeTruthy()
    expect(root()!.querySelector('.u-image-previewer__zoom-value')!.textContent).toBe('100%')
    unmount()
  })

  it('open 为 false 时不渲染', async () => {
    const opened = ref(false)
    const { unmount } = mountPreviewer({
      props: { open: opened.value, 'onUpdate:open': (v: boolean) => (opened.value = v) },
      bindOpen: false
    })
    await flush()

    expect(root()).toBeNull()
    unmount()
  })

  it('点击关闭按钮关闭并回写 open、发出 close，body 滚动解锁', async () => {
    const { opened, onClose, unmount } = mountPreviewer()
    await flush()
    expect(document.body.style.overflow).toBe('hidden')

    root()!.querySelector<HTMLElement>('[aria-label="关闭"]')!.click()
    await vi.waitFor(() => {
      expect(root()).toBeNull()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(opened.value).toBe(false)
    expect(document.body.style.overflow).toBe('')
    unmount()
  })

  it('点击图片外区域关闭，点击图片本身不关闭', async () => {
    const { onClose, unmount } = mountPreviewer()
    await flush()

    root()!
      .querySelector('img')!
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    await nextTick()
    expect(onClose).not.toHaveBeenCalled()

    stage()!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    await nextTick()
    expect(onClose).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('Esc 关闭；closeOnEsc 为 false 时不关闭', async () => {
    const { unmount } = mountPreviewer()
    await flush()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await vi.waitFor(() => {
      expect(root()).toBeNull()
    })
    unmount()

    const keep = mountPreviewer({ props: { closeOnEsc: false } })
    await flush()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flush()
    expect(root()).toBeTruthy()
    keep.unmount()
  })
})

describe('UImagePreviewer 缩放与平移', () => {
  it('双击放大到 2，再次双击回到 1，并发出 zoom-change', async () => {
    const { onZoomChange, unmount } = mountPreviewer()
    await flush()

    stage()!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    expect(stageScale()).toBe(2)
    expect(onZoomChange).toHaveBeenLastCalledWith(2)
    expect(root()!.querySelector('.u-image-previewer__zoom-value')!.textContent).toBe('200%')

    stage()!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    expect(stageScale()).toBe(1)
    expect(onZoomChange).toHaveBeenLastCalledWith(1)
    unmount()
  })

  it('工具按钮按 10% 步进缩放，触达上下限后禁用', async () => {
    const { onZoomChange, unmount } = mountPreviewer()
    await flush()

    root()!.querySelector<HTMLElement>('[aria-label="放大"]')!.click()
    await nextTick()
    expect(stageScale()).toBeCloseTo(1.1, 10)
    expect(onZoomChange).toHaveBeenLastCalledWith(1.1)

    root()!.querySelector<HTMLElement>('[aria-label="缩小"]')!.click()
    await nextTick()
    expect(stageScale()).toBe(1)

    const zoomIn = root()!.querySelector<HTMLButtonElement>('[aria-label="放大"]')!
    const zoomOut = root()!.querySelector<HTMLButtonElement>('[aria-label="缩小"]')!
    // 100% + 20 步到 3.0 上限：放大按钮禁用；缩小到 0.5 下限：缩小按钮禁用
    for (let i = 0; i < 20; i++) zoomIn.click()
    await nextTick()
    expect(stageScale()).toBe(3)
    expect(zoomIn.disabled).toBe(true)

    for (let i = 0; i < 25; i++) zoomOut.click()
    await nextTick()
    expect(stageScale()).toBe(0.5)
    expect(zoomOut.disabled).toBe(true)
    unmount()
  })

  it('ctrl + 滚轮缩放，普通滚轮不缩放', async () => {
    const { unmount } = mountPreviewer()
    await flush()

    wheel(stage()!, -100)
    await nextTick()
    expect(stageScale()).toBeCloseTo(1.1, 10)

    const plain = new MouseEvent('wheel', { clientX: 0, clientY: 0, bubbles: true })
    Object.defineProperty(plain, 'deltaY', { value: -100 })
    stage()!.dispatchEvent(plain)
    await nextTick()
    expect(stageScale()).toBeCloseTo(1.1, 10)
    unmount()
  })

  it('放大后拖拽平移，scale 为 1 时按下不平移', async () => {
    const { unmount } = mountPreviewer()
    await flush()

    const el = stage()!
    el.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 100, clientY: 100 }))
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 150, clientY: 130 }))
    el.dispatchEvent(new PointerEvent('pointerup', { clientX: 150, clientY: 130 }))
    await nextTick()
    expect(el.style.transform).not.toContain('translate3d(50px')

    // 双击放大到 2 后同一拖拽产生位移
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    el.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 100, clientY: 100 }))
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 150, clientY: 130 }))
    el.dispatchEvent(new PointerEvent('pointerup', { clientX: 150, clientY: 130 }))
    await nextTick()
    expect(el.style.transform).toContain('translate3d(50px, 30px, 0) scale(2)')
    // 抬手后回到可平移光标态
    expect(el.classList.contains('is-dragging')).toBe(false)
    unmount()
  })
})

describe('UImagePreviewer 加载语义', () => {
  it('二进制源经 objectURL 渲染，切换与卸载时回收', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-1')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL

    const { unmount } = mountPreviewer({ props: { src: new Blob(['a']) } })
    await flush()

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(stage()!.querySelector('img')!.getAttribute('src')).toBe('blob:mock-1')
    unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-1')
  })

  it('加载失败进入失败态并发出 error', async () => {
    const { onError, unmount } = mountPreviewer()
    await flush()

    stage()!
      .querySelector('img')!
      .dispatchEvent(new Event('error', { bubbles: true }))
    await nextTick()

    expect(stage()!.textContent).toContain('图片加载失败')
    expect(onError).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('modal 为 false 时内嵌渲染：无遮罩与关闭按钮，宿主 class 落到预览面', async () => {
    const { host, unmount } = mountPreviewer({ props: { modal: false, class: 'host-stage' } })
    await flush()

    // 未 Teleport：渲染在挂载点内，且无 modal 遮罩类 / 关闭 / 工具栏
    expect(host.querySelector('.u-image-previewer__stage')).toBeTruthy()
    expect(host.querySelector('.u-image-previewer__stage img')).toBeTruthy()
    expect(host.querySelector('.u-image-previewer.is-modal')).toBeNull()
    expect(host.querySelector('[aria-label="关闭"]')).toBeNull()
    expect(host.querySelector('.u-image-previewer__toolbar')).toBeNull()
    // 宿主 class 经 attrs 落到预览面（file-viewer 适配层依赖此行为挂 __image 覆盖类）
    expect(host.querySelector('.u-image-previewer__stage')!.classList.contains('host-stage')).toBe(
      true
    )
    unmount()
  })
})
