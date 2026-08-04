import { ContextmenuRootDIKey } from '@veltra/desktop'
import { describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

import InsertCountMenuItem from '../insert-count-menu-item.vue'

function mountItem(options?: { defaultValue?: number }) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const onConfirm = vi.fn()
  const onItemClickEnd = vi.fn()

  const app = createApp({
    setup() {
      return () =>
        h(InsertCountMenuItem, {
          prefix: '在上方插入',
          suffix: '行',
          defaultValue: options?.defaultValue ?? 2,
          min: 1,
          max: 1000,
          onConfirm
        })
    }
  })
  app.provide(ContextmenuRootDIKey, {
    cls: { b: '', e: () => '', m: () => '' } as never,
    onItemClickStart: () => {},
    onItemClickEnd
  })
  app.mount(host)

  return {
    host,
    onConfirm,
    onItemClickEnd,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('InsertCountMenuItem', () => {
  it('确认按钮提交并经 DI 关闭', async () => {
    const { host, onConfirm, onItemClickEnd, unmount } = mountItem({ defaultValue: 3 })
    try {
      await nextTick()
      host.querySelector<HTMLButtonElement>('button')!.click()
      expect(onConfirm).toHaveBeenCalledWith(3)
      expect(onItemClickEnd).toHaveBeenCalledOnce()
    } finally {
      unmount()
    }
  })

  it('输入框内 Enter 提交（穿透 UNumberInput keydown.stop）', async () => {
    const { host, onConfirm, onItemClickEnd, unmount } = mountItem({ defaultValue: 4 })
    try {
      await nextTick()
      const input = host.querySelector<HTMLInputElement>('input')
      expect(input).toBeTruthy()
      input!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      )
      expect(onConfirm).toHaveBeenCalledWith(4)
      expect(onItemClickEnd).toHaveBeenCalledOnce()
    } finally {
      unmount()
    }
  })

  it('输入框内 Esc 关闭且不提交', async () => {
    const { host, onConfirm, onItemClickEnd, unmount } = mountItem()
    try {
      await nextTick()
      const input = host.querySelector<HTMLInputElement>('input')
      expect(input).toBeTruthy()
      input!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      )
      expect(onConfirm).not.toHaveBeenCalled()
      expect(onItemClickEnd).toHaveBeenCalledOnce()
    } finally {
      unmount()
    }
  })
})
