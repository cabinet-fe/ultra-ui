// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick } from 'vue'

import UFileViewer from '../file-viewer.vue'

function mountViewer(files: { name: string; src: string }[]) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UFileViewer, { files }) })
  app.mount(host)
  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UFileViewer 图片预览回归（内嵌 UImagePreviewer）', () => {
  it('传入图片项时渲染内嵌预览面与 img，无 lightbox 遮罩', async () => {
    const { host, unmount } = mountViewer([{ name: 'a.png', src: 'https://example.com/a.png' }])
    // previewer 为异步组件，等待 loader 解析并挂载
    await vi.waitFor(() => {
      expect(host.querySelector('.u-file-viewer__image')).toBeTruthy()
    })

    // 宿主覆盖类与组件自带预览面类落在同一元素上（file-viewer 模态覆盖依赖此前提）
    const stage = host.querySelector<HTMLElement>('.u-file-viewer__image')
    expect(stage).toBeTruthy()
    expect(stage!.classList.contains('u-image-previewer__stage')).toBe(true)
    expect(stage!.querySelector('img')!.getAttribute('src')).toBe('https://example.com/a.png')
    expect(host.querySelector('.u-image-previewer.is-modal')).toBeNull()
    expect(host.querySelector('.u-image-previewer__toolbar')).toBeNull()
    unmount()
  })

  it('工具栏缩放按钮经 expose 驱动预览面并回显百分比', async () => {
    const { host, unmount } = mountViewer([{ name: 'a.png', src: 'https://example.com/a.png' }])
    await vi.waitFor(() => {
      expect(host.querySelector('.u-file-viewer__image')).toBeTruthy()
    })

    host.querySelector<HTMLElement>('[aria-label="放大"]')!.click()
    await nextTick()

    const transform = host.querySelector<HTMLElement>('.u-file-viewer__image')!.style.transform
    expect(transform).toContain('scale(1.1)')
    expect(host.querySelector('.u-file-viewer__zoom-value')!.textContent).toBe('110%')

    host.querySelector<HTMLElement>('[aria-label="重置视图"]')!.click()
    await nextTick()
    expect(host.querySelector<HTMLElement>('.u-file-viewer__image')!.style.transform).toContain(
      'scale(1)'
    )
    unmount()
  })
})
