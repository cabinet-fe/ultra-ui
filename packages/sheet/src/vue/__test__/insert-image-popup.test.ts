import { Sheet } from '@veltra/sheet-core/core/sheet'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, type App } from 'vue'

import { createSheetContext } from '../../tools/context'
import USheetInsertImagePopup from '../popups/insert-image-popup.vue'

const mocks = vi.hoisted(() => {
  const message = Object.assign(vi.fn(), {
    success: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    default: vi.fn()
  })
  return { message }
})

vi.mock('@veltra/desktop', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    message: mocks.message,
    UFilePicker: defineComponent({
      name: 'UFilePickerStub',
      props: ['accept'],
      emits: ['pick'],
      setup(props, { emit }) {
        return () =>
          h(
            'button',
            {
              class: 'picker-stub-btn',
              'data-accept': props.accept as string,
              onClick: () =>
                emit('pick', [
                  new File([new Uint8Array([9, 8, 7])], 'pic.png', { type: 'image/png' })
                ])
            },
            'pick'
          )
      }
    })
  }
})

const apps: App[] = []
const containers: HTMLElement[] = []

function mountPopup(onClose?: () => void) {
  const sheet = new Sheet()
  sheet.selectCell({ row: 1, col: 1 })
  const context = createSheetContext(sheet)
  const el = document.createElement('div')
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({
    setup() {
      return () => h(USheetInsertImagePopup, { context, onClose })
    }
  })
  app.mount(el)
  apps.push(app)
  return { el, sheet, context }
}

afterEach(() => {
  apps.splice(0).forEach((app) => app.unmount())
  containers.splice(0).forEach((el) => el.remove())
  vi.clearAllMocks()
})

describe('USheetInsertImagePopup', () => {
  it('accept 限定扩展名；pick 后关闭并调用 insertImage', async () => {
    const closed = vi.fn()
    const { el, sheet } = mountPopup(closed)
    const btn = el.querySelector<HTMLButtonElement>('.picker-stub-btn')!
    expect(btn.getAttribute('data-accept')).toBe('.png,.jpg,.jpeg,.gif,.svg,.webp')

    btn.click()
    await Promise.resolve()
    await Promise.resolve()

    expect(closed).toHaveBeenCalledTimes(1)
    expect(sheet.getImages()).toHaveLength(1)
    expect(sheet.getImages()[0]?.anchor.from).toEqual({ row: 1, col: 1 })
    expect(sheet.getImages()[0]?.type).toBe('png')
    expect([...sheet.getImages()[0]!.data]).toEqual([9, 8, 7])
  })
})
