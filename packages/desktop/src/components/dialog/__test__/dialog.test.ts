// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import UDialog from '../dialog.vue'

function mountDialog(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(true)
  const app = createApp({
    render: () =>
      h(
        UDialog,
        {
          ...props,
          modelValue: model.value,
          'onUpdate:modelValue': (value: boolean) => {
            model.value = value
          }
        },
        () => '弹框内容'
      )
  })
  app.mount(host)

  return {
    host,
    model,
    panel: () => document.body.querySelector<HTMLElement>('.u-dialog'),
    overlay: () => document.body.querySelector<HTMLElement>('.u-dialog-overlay'),
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

afterEach(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.body.innerHTML = ''
})

describe('UDialog 无障碍属性', () => {
  it('面板带 role="dialog"、aria-modal="true" 与 tabindex="-1"', async () => {
    const ctx = mountDialog({ title: '提示' })
    await nextTick()

    const panel = ctx.panel()!
    const title = panel.querySelector<HTMLElement>('.u-dialog__title')!

    expect(panel.getAttribute('role')).toBe('dialog')
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(panel.getAttribute('tabindex')).toBe('-1')
    expect(panel.getAttribute('aria-labelledby')).toBe(title.id)

    ctx.unmount()
  })

  it('modal 为 false 时不输出 aria-modal', async () => {
    const ctx = mountDialog({ modal: false })
    await nextTick()

    expect(ctx.panel()!.getAttribute('aria-modal')).toBeNull()

    ctx.unmount()
  })

  it('modal 为 false 时不锁滚动、不抢焦点', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const ctx = mountDialog({ modal: false })
    await nextTick()
    await nextTick()

    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)

    ctx.unmount()
    trigger.remove()
  })
})

describe('UDialog 遮罩通用行为', () => {
  it('按 Esc 关闭并同步 v-model', async () => {
    const ctx = mountDialog()
    await nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    await vi.waitFor(() => {
      expect(ctx.model.value).toBe(false)
    })

    ctx.unmount()
  })

  it('closeOnEsc 为 false 时按 Esc 不关闭', async () => {
    const ctx = mountDialog({ closeOnEsc: false })
    await nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    await nextTick()

    expect(ctx.model.value).toBe(true)
    expect(ctx.panel()).toBeTruthy()

    ctx.unmount()
  })

  it('打开时锁定 body 滚动，关闭后恢复', async () => {
    const ctx = mountDialog()
    await nextTick()

    expect(document.body.style.overflow).toBe('hidden')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    await vi.waitFor(() => {
      expect(ctx.model.value).toBe(false)
      expect(document.body.style.overflow).toBe('')
    })

    ctx.unmount()
  })

  it('打开时把焦点移入面板，关闭后恢复打开前焦点', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const ctx = mountDialog({ title: '焦点' })

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(ctx.panel())
    })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })

    ctx.unmount()
  })
})
