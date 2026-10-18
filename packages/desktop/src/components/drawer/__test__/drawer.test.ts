// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import UDrawer from '../drawer.vue'

function mountDrawer(
  props: Record<string, unknown> = {},
  handlers: { onClose?: () => void; onClosed?: () => void } = {},
  slot: () => any = () => '抽屉内容'
) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(false)
  const closedCount = ref(0)
  const app = createApp({
    render: () =>
      h(
        UDrawer,
        {
          ...props,
          modelValue: model.value,
          'onUpdate:modelValue': (value: boolean) => {
            model.value = value
          },
          onClose: () => handlers.onClose?.(),
          onClosed: () => {
            closedCount.value += 1
            handlers.onClosed?.()
          }
        },
        slot
      )
  })
  app.mount(host)

  return {
    host,
    model,
    closedCount,
    panel: () => document.body.querySelector<HTMLElement>('.u-drawer'),
    overlay: () => document.body.querySelector<HTMLElement>('.u-drawer-overlay'),
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

async function openDrawer(ctx: ReturnType<typeof mountDrawer>) {
  ctx.model.value = true
  await vi.waitFor(() => {
    expect(ctx.panel()).toBeTruthy()
  })
  await nextTick()
}

afterEach(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.body.innerHTML = ''
})

describe('UDrawer title', () => {
  it('传入 title 时渲染标题栏', async () => {
    const ctx = mountDrawer({ title: '用户详情' })
    await openDrawer(ctx)

    expect(ctx.panel()!.querySelector('.u-drawer__title')?.textContent).toBe('用户详情')

    ctx.unmount()
  })

  it('不传 title 时不渲染标题栏', async () => {
    const ctx = mountDrawer()
    await openDrawer(ctx)

    expect(ctx.panel()!.querySelector('.u-drawer__header')).toBeNull()

    ctx.unmount()
  })
})

describe('UDrawer size', () => {
  it('左右方向映射为宽度，数字按 px 处理', async () => {
    const ctx = mountDrawer({ size: 640 })
    await openDrawer(ctx)

    expect(ctx.panel()!.style.width).toBe('640px')

    ctx.unmount()
  })

  it('上下方向映射为高度，支持字符串', async () => {
    const ctx = mountDrawer({ direction: 'bottom', size: '50vh' })
    await openDrawer(ctx)

    expect(ctx.panel()!.style.height).toBe('50vh')
    expect(ctx.panel()!.style.width).toBe('')

    ctx.unmount()
  })

  it('不传 size 时不输出内联尺寸，走主题 token', async () => {
    const ctx = mountDrawer()
    await openDrawer(ctx)

    expect(ctx.panel()!.style.width).toBe('')

    ctx.unmount()
  })
})

describe('UDrawer body', () => {
  it('默认插槽内容渲染在 body 容器内', async () => {
    const ctx = mountDrawer({ title: '详情' })
    await openDrawer(ctx)

    const body = ctx.panel()!.querySelector('.u-drawer__body')
    expect(body?.textContent).toBe('抽屉内容')

    ctx.unmount()
  })
})

describe('UDrawer closed', () => {
  it('关闭动画结束后触发 closed，且晚于 close', async () => {
    const order: string[] = []
    const ctx = mountDrawer(
      { showClose: true },
      { onClose: () => order.push('close'), onClosed: () => order.push('closed') }
    )
    await openDrawer(ctx)

    ctx.panel()!.querySelector<HTMLElement>('.u-drawer__close')!.click()
    await vi.waitFor(() => {
      expect(order).toContain('closed')
    })

    expect(order).toEqual(['close', 'closed'])
    // 完全关闭后遮罩与抽屉都已移除
    expect(ctx.overlay()).toBeNull()

    ctx.unmount()
  })

  it('点遮罩关闭也触发 closed', async () => {
    const ctx = mountDrawer()
    await openDrawer(ctx)

    ctx.overlay()!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await vi.waitFor(() => {
      expect(ctx.closedCount.value).toBe(1)
    })

    ctx.unmount()
  })

  it('从未打开时不触发 closed', async () => {
    const ctx = mountDrawer()
    await nextTick()
    await nextTick()

    expect(ctx.closedCount.value).toBe(0)

    ctx.unmount()
  })
})

describe('UDrawer 遮罩通用行为', () => {
  it('按 Esc 关闭抽屉并同步 v-model', async () => {
    const onClose = vi.fn()
    const ctx = mountDrawer({}, { onClose })
    await openDrawer(ctx)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(ctx.model.value).toBe(false)
    })

    ctx.unmount()
  })

  it('closeOnEsc 为 false 时按 Esc 不关闭', async () => {
    const onClose = vi.fn()
    const ctx = mountDrawer({ closeOnEsc: false }, { onClose })
    await openDrawer(ctx)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    await nextTick()

    expect(onClose).not.toHaveBeenCalled()
    expect(ctx.model.value).toBe(true)
    expect(ctx.panel()).toBeTruthy()

    ctx.unmount()
  })

  it('打开时锁定 body 滚动，关闭后恢复', async () => {
    const ctx = mountDrawer()
    await openDrawer(ctx)

    expect(document.body.style.overflow).toBe('hidden')

    ctx.overlay()!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    await vi.waitFor(() => {
      expect(document.body.style.overflow).toBe('')
    })

    ctx.unmount()
  })

  it('面板带 role="dialog"、aria-modal，标题通过 aria-labelledby 关联', async () => {
    const ctx = mountDrawer({ title: '用户详情' })
    await openDrawer(ctx)

    const panel = ctx.panel()!
    const title = panel.querySelector<HTMLElement>('.u-drawer__title')!

    expect(panel.getAttribute('role')).toBe('dialog')
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(panel.getAttribute('aria-labelledby')).toBe(title.id)
    expect(panel.getAttribute('tabindex')).toBe('-1')

    ctx.unmount()
  })

  it('打开时把焦点移入面板，关闭后恢复打开前焦点', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const ctx = mountDrawer({ showClose: true })
    await openDrawer(ctx)

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(ctx.panel())
    })

    ctx.panel()!.querySelector<HTMLElement>('.u-drawer__close')!.click()

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })

    ctx.unmount()
  })

  it('Tab / Shift+Tab 在面板内循环', async () => {
    const ctx = mountDrawer({}, {}, () => [
      h('button', { id: 'first' }, '第一个'),
      h('button', { id: 'second' }, '第二个')
    ])
    await openDrawer(ctx)

    const first = ctx.panel()!.querySelector<HTMLElement>('#first')!
    const second = ctx.panel()!.querySelector<HTMLElement>('#second')!

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(first)
    })

    second.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(document.activeElement).toBe(first)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }))
    expect(document.activeElement).toBe(second)

    ctx.unmount()
  })

  it('多层叠加时 Esc 只关闭最上层', async () => {
    const bottom = mountDrawer()
    await openDrawer(bottom)

    const top = mountDrawer()
    top.model.value = true
    await vi.waitFor(() => {
      expect(document.body.querySelectorAll('.u-drawer')).toHaveLength(2)
    })
    await nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await vi.waitFor(() => {
      expect(top.model.value).toBe(false)
    })
    expect(bottom.model.value).toBe(true)

    // 最上层关闭后，再按 Esc 才关闭下一层
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await vi.waitFor(() => {
      expect(bottom.model.value).toBe(false)
    })

    top.unmount()
    bottom.unmount()
  })
})
