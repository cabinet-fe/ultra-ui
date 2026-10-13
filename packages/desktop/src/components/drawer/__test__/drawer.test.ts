import { describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import UDrawer from '../drawer.vue'

function mountDrawer(
  props: Record<string, unknown> = {},
  handlers: { onClose?: () => void; onClosed?: () => void } = {}
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
        () => '抽屉内容'
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
}

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
