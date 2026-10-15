// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import UPalette from '../palette.vue'

function mountPalette(initialColor?: string) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(initialColor)
  const app = createApp({
    render() {
      return h(UPalette, {
        modelValue: model.value,
        'onUpdate:modelValue': (value: string | undefined) => {
          model.value = value
        }
      })
    }
  })

  app.mount(host)

  return {
    host,
    model,
    setModel(value: string) {
      model.value = value
    },
    async unmount() {
      // 等待 usePop 打开面板时的异步定位完成，避免卸载后回调访问已销毁元素
      await new Promise((resolve) => setTimeout(resolve, 0))
      app.unmount()
      await nextTick()
      host.remove()
    }
  }
}

async function openPanel(host: HTMLElement) {
  host.querySelector('.u-palette')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  await nextTick()
}

describe('UPalette', () => {
  beforeEach(() => {
    // happy-dom 中 offsetWidth/offsetHeight 恒为 0，这里模拟 200x200 的画布
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200)

    // usePop 的浮层容器是模块级单例，上一个用例清空 body 后需补回 teleport 目标
    if (!document.getElementById('pop-container')) {
      const popContainer = document.createElement('div')
      popContainer.id = 'pop-container'
      document.body.appendChild(popContainer)
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('SV 面板 thumb 跟随初始绑定的颜色', async () => {
    const { host, unmount } = mountPalette('#FF0000')

    try {
      await openPanel(host)

      const thumb = document.body.querySelector<HTMLElement>('.u-palette__sv-thumb')
      expect(thumb).not.toBeNull()
      // #FF0000 → hsv(0, 1, 1)，thumb 应在右上角: translate(200px, 0px)
      expect(thumb!.style.transform).toBe('translate(200px, 0px)')

      const hueThumb = document.body.querySelector<HTMLElement>('.u-palette__hue-thumb')
      expect(hueThumb!.style.transform).toBe('translateX(0px)')
    } finally {
      unmount()
    }
  })

  it('面板关闭时外部 modelValue 变化，打开后 thumb 跟随', async () => {
    const { host, setModel, unmount } = mountPalette('')

    try {
      setModel('#0000FF')
      await nextTick()

      await openPanel(host)

      const thumb = document.body.querySelector<HTMLElement>('.u-palette__sv-thumb')
      // #0000FF → hsv(240, 1, 1)，thumb 应在右上角: translate(200px, 0px)
      expect(thumb!.style.transform).toBe('translate(200px, 0px)')

      const hueThumb = document.body.querySelector<HTMLElement>('.u-palette__hue-thumb')
      expect(hueThumb!.style.transform).toBe(`translateX(${(200 * 240) / 360}px)`)
    } finally {
      unmount()
    }
  })

  it('初始化与外部回显不回写 model，保持原始值', async () => {
    const { model, setModel, unmount } = mountPalette('#1890ff')

    try {
      await nextTick()
      await nextTick()
      // 挂载时 color → HSV 同步会触发回写 watch，不能把规范化后的 #1890FF 写回
      expect(model.value).toBe('#1890ff')

      setModel('#00ff00')
      await nextTick()
      await nextTick()
      expect(model.value).toBe('#00ff00')
    } finally {
      await unmount()
    }
  })

  it('用户拖动 SV 面板仍回写 model', async () => {
    const { host, model, unmount } = mountPalette('#1890ff')

    // happy-dom 未实现 MouseEvent.x/y（浏览器里是 clientX 的别名），use-drag 依赖它们
    function dragEvent(type: string, x: number, y: number, bubbles = false) {
      const ev = new MouseEvent(type, { bubbles, button: 0, clientX: x, clientY: y })
      Object.defineProperty(ev, 'x', { value: x })
      Object.defineProperty(ev, 'y', { value: y })
      return ev
    }

    try {
      await openPanel(host)

      const sv = document.body.querySelector<HTMLElement>('.u-palette__sv')
      expect(sv).not.toBeNull()
      sv!.dispatchEvent(dragEvent('mousedown', 100, 100, true))
      document.dispatchEvent(dragEvent('mousemove', 60, 60))
      document.dispatchEvent(dragEvent('mouseup', 60, 60))

      await nextTick()
      await nextTick()
      // 拖到左上角：s = 0、v = 1 → 白色；用户动作驱动的回写不受影响
      expect(model.value).toBe('#FFFFFF')
    } finally {
      await unmount()
    }
  })
})
