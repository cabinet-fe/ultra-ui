import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, inject, nextTick } from 'vue'

import type { ContextmenuItem } from '../../../types'
import UContextmenu from '../contextmenu.vue'
import { ContextmenuRootDIKey } from '../di'

function cleanupPanels(): void {
  document.querySelectorAll('.u-contextmenu').forEach((el) => el.remove())
}

function mountContextmenu(props: {
  menus: ContextmenuItem[]
  width?: number
  mousePosition?: { x: number; y: number }
}) {
  cleanupPanels()
  const host = document.createElement('div')
  document.body.appendChild(host)

  const app = createApp({
    render() {
      return h(UContextmenu, {
        mousePosition: props.mousePosition ?? { x: 10, y: 10 },
        width: props.width ?? 180,
        menus: props.menus
      })
    }
  })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
      cleanupPanels()
    }
  }
}

function panel(): HTMLElement | null {
  // 取最后一个（避免 leave 过渡残留抢到 querySelector 首个）
  const all = document.querySelectorAll<HTMLElement>('.u-contextmenu')
  return all[all.length - 1] ?? null
}

describe('UContextmenu', () => {
  it('divider 渲染为分割线', async () => {
    const { unmount } = mountContextmenu({
      menus: [
        { label: 'A', callback: () => {} },
        { divider: true },
        { label: 'B', callback: () => {} }
      ]
    })
    try {
      await nextTick()
      const el = panel()
      expect(el).toBeTruthy()
      expect(el!.querySelectorAll('.u-contextmenu__divider')).toHaveLength(1)
      expect(el!.querySelectorAll('.u-contextmenu__item')).toHaveLength(2)
    } finally {
      unmount()
    }
  })

  it('render 组件挂载替代 label', async () => {
    const Custom = defineComponent({
      name: 'CustomMenuContent',
      setup() {
        return () => h('span', { class: 'custom-render' }, '自定义内容')
      }
    })
    const { unmount } = mountContextmenu({
      menus: [{ label: 'fallback', keepOpen: true, render: Custom }]
    })
    try {
      await nextTick()
      const el = panel()!
      expect(el.querySelector('.custom-render')?.textContent).toBe('自定义内容')
      expect(el.textContent).not.toContain('fallback')
    } finally {
      unmount()
    }
  })

  it('keepOpen 点击不关闭菜单', async () => {
    const { unmount } = mountContextmenu({
      menus: [
        { label: '保持打开', keepOpen: true, callback: () => {} },
        { label: '普通项', callback: () => {} }
      ]
    })
    try {
      await nextTick()
      const items = panel()!.querySelectorAll<HTMLElement>('.u-contextmenu__item')
      items[0]!.click()
      await nextTick()
      expect(panel()).toBeTruthy()
      expect(panel()!.querySelectorAll('.u-contextmenu__item')).toHaveLength(2)
    } finally {
      unmount()
    }
  })

  it('普通项点击仍关闭', async () => {
    const callback = vi.fn()
    const { unmount } = mountContextmenu({ menus: [{ label: '关闭我', callback }] })
    try {
      await nextTick()
      panel()!.querySelector<HTMLElement>('.u-contextmenu__item')!.click()
      await nextTick()
      expect(callback).toHaveBeenCalledOnce()
      // happy-dom 无真实 CSS transition，leave 可能停在 leave-active；断言已进入关闭流程
      const el = panel()
      expect(el === null || /leave/.test(el.className)).toBe(true)
    } finally {
      unmount()
    }
  })

  it('内嵌组件 inject DI 可主动关闭', async () => {
    const closerClick = vi.fn()
    let injected = false
    const Closer = defineComponent({
      name: 'CloserMenuContent',
      setup() {
        const root = inject(ContextmenuRootDIKey)
        injected = !!root
        return () =>
          h(
            'button',
            {
              class: 'close-via-di',
              type: 'button',
              onClick: () => {
                closerClick()
                root?.onItemClickEnd()
              }
            },
            '关闭'
          )
      }
    })
    const { unmount } = mountContextmenu({
      menus: [{ label: '自定义', keepOpen: true, render: Closer }]
    })
    try {
      await nextTick()
      const el = panel()
      expect(el).toBeTruthy()
      expect(injected).toBe(true)
      const btn = el!.querySelector<HTMLButtonElement>('.close-via-di')
      expect(btn, `menu html: ${el!.innerHTML}`).toBeTruthy()
      btn!.click()
      await nextTick()
      expect(closerClick).toHaveBeenCalledOnce()
      const after = panel()
      expect(after === null || /leave/.test(after.className)).toBe(true)
    } finally {
      unmount()
    }
  })
})
