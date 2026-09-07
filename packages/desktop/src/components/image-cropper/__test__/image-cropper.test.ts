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

function mountCropper(initialSrc?: File | Blob | string) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const src = ref<File | Blob | string | undefined>(initialSrc)
  const app = createApp({
    render() {
      return h(UImageCropper, { src: src.value })
    }
  })
  app.mount(host)

  return {
    host,
    async setSrc(value: File | Blob | string | undefined) {
      src.value = value
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
