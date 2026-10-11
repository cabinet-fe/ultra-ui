import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, type App } from 'vue'

import type { HyperlinkConfirmPayload } from '../popup-helpers'
import USheetHyperlinkPopup from '../popups/hyperlink-popup.vue'

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
    UInput: defineComponent({
      name: 'UInputStub',
      props: ['modelValue', 'placeholder'],
      emits: ['update:modelValue'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            class: 'hyperlink-input-stub',
            placeholder: props.placeholder as string,
            value: props.modelValue as string,
            onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
          })
      }
    }),
    UButton: defineComponent({
      name: 'UButtonStub',
      props: ['disabled', 'type'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () =>
          h(
            'button',
            {
              class: 'hyperlink-btn-stub',
              disabled: props.disabled as boolean,
              onClick: () => emit('click')
            },
            slots.default?.()
          )
      }
    })
  }
})

const apps: App[] = []
const containers: HTMLElement[] = []

interface MountResult {
  confirms: HyperlinkConfirmPayload[]
  closeCount: () => number
}

function mountPopup(props: {
  mode: 'cell' | 'image'
  initial?: { url: string; text?: string }
}): MountResult {
  let closed = 0
  const confirms: HyperlinkConfirmPayload[] = []
  const el = document.createElement('div')
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({
    setup() {
      return () =>
        h(USheetHyperlinkPopup, {
          mode: props.mode,
          initial: props.initial,
          onConfirm: (payload: HyperlinkConfirmPayload) => confirms.push(payload),
          onClose: () => {
            closed++
          }
        })
    }
  })
  app.mount(el)
  apps.push(app)
  return { confirms, closeCount: () => closed }
}

/** 弹窗根面板（Teleport 到 body） */
function dialogEl(): HTMLElement {
  return document.body.querySelector<HTMLElement>('.u-sheet__link-dialog')!
}

/** 按文案取弹窗内按钮（确定 / 取消） */
function dialogButton(text: string): HTMLButtonElement {
  return [...dialogEl().querySelectorAll<HTMLButtonElement>('.hyperlink-btn-stub')].find((btn) =>
    btn.textContent?.includes(text)
  )!
}

/** 第 index 个输入框写入并同步 v-model */
async function setInput(index: number, value: string): Promise<void> {
  const inputs = [...dialogEl().querySelectorAll<HTMLInputElement>('.hyperlink-input-stub')]
  inputs[index]!.value = value
  inputs[index]!.dispatchEvent(new Event('input', { bubbles: true }))
}

afterEach(() => {
  apps.splice(0).forEach((app) => app.unmount())
  containers.splice(0).forEach((el) => el.remove())
  vi.clearAllMocks()
})

describe('USheetHyperlinkPopup', () => {
  it('空地址提交拦截：message.error 提示、不 confirm 也不关闭', async () => {
    const result = mountPopup({ mode: 'cell' })
    await Promise.resolve()

    dialogButton('确定').click()
    expect(mocks.message.error).toHaveBeenCalledWith('请输入链接地址')
    expect(result.confirms).toEqual([])
    expect(result.closeCount()).toBe(0)

    // 填地址后提交放行
    await setInput(0, 'https://example.com')
    dialogButton('确定').click()
    expect(mocks.message.error).toHaveBeenCalledTimes(1)
    expect(result.confirms).toEqual([{ url: 'https://example.com' }])
  })

  it('cell 模式：显示文本留空提交不含 text（沿用单元格内容显示）；填写则随载荷写入', async () => {
    const result = mountPopup({
      mode: 'cell',
      initial: { url: 'https://old.example.com', text: '示例' }
    })
    await Promise.resolve()

    // 编辑回填：改地址、清空显示文本
    await setInput(0, 'https://new.example.com')
    await setInput(1, '')
    dialogButton('确定').click()
    expect(result.confirms).toEqual([{ url: 'https://new.example.com' }])
    expect('text' in result.confirms[0]!).toBe(false)

    // 显示文本填写时随载荷提交
    await setInput(0, 'https://example.com')
    await setInput(1, '  官网  ')
    dialogButton('确定').click()
    expect(result.confirms[1]).toEqual({ url: 'https://example.com', text: '官网' })
  })

  it('image 模式：仅地址一个字段（无显示文本行），标题为设置图片超链接', async () => {
    mountPopup({ mode: 'image' })
    await Promise.resolve()

    expect(dialogEl().querySelectorAll('.hyperlink-input-stub')).toHaveLength(1)
    expect(dialogEl().textContent).toContain('设置图片超链接')
    expect(
      [...dialogEl().querySelectorAll('.u-sheet__popup-label')].map((l) => l.textContent)
    ).toEqual(['地址'])
  })

  it('取消按钮与 Esc 均关闭（emit close，不 confirm）', async () => {
    const result = mountPopup({ mode: 'cell' })
    await Promise.resolve()

    dialogButton('取消').click()
    expect(result.closeCount()).toBe(1)
    expect(result.confirms).toEqual([])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(result.closeCount()).toBe(2)
  })
})
