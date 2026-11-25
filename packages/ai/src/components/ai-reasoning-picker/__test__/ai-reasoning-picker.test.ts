// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import { UAiReasoningPicker } from '..'
import type { ChatReasoningLevel } from '../../../providers'

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  const injectionWarnings = warnSpy.mock.calls.filter((args) =>
    args.some(
      (arg) => typeof arg === 'string' && (arg.includes('injection') || arg.includes('AiChatDIKey'))
    )
  )
  expect(injectionWarnings).toEqual([])
  warnSpy.mockRestore()
})

const LEVELS: ChatReasoningLevel[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' }
]

describe('UAiReasoningPicker', () => {
  it('levels 少于 2 档时不渲染', () => {
    const emptyHost = document.createElement('div')
    document.body.appendChild(emptyHost)
    const emptyApp = createApp({ render: () => h(UAiReasoningPicker, { levels: [] }) })
    emptyApp.mount(emptyHost)
    expect(emptyHost.querySelector('.u-ai-reasoning-picker__trigger')).toBeFalsy()
    emptyApp.unmount()
    emptyHost.remove()

    const singleHost = document.createElement('div')
    document.body.appendChild(singleHost)
    const singleApp = createApp({
      render: () => h(UAiReasoningPicker, { levels: [{ value: 'low', label: '低' }] })
    })
    singleApp.mount(singleHost)
    expect(singleHost.querySelector('.u-ai-reasoning-picker__trigger')).toBeFalsy()
    singleApp.unmount()
    singleHost.remove()
  })

  it('>=2 档点击选中触发 update:modelValue 与 change(value, level)', async () => {
    const current = ref<string | undefined>('low')
    const onChange = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp({
      render: () =>
        h(UAiReasoningPicker, {
          levels: LEVELS,
          modelValue: current.value,
          'onUpdate:modelValue': (val: string | undefined) => {
            current.value = val
          },
          onChange
        })
    })
    app.mount(host)

    const trigger = host.querySelector<HTMLElement>('.u-ai-reasoning-picker__trigger')!
    expect(trigger).toBeTruthy()
    expect(trigger.textContent).toContain('低')

    trigger.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-ai-reasoning-picker__panel')).toBeTruthy()
    })

    const options = [
      ...document.body.querySelectorAll<HTMLElement>('.u-ai-reasoning-picker__option')
    ]
    expect(options).toHaveLength(3)
    expect(options[0]?.classList.contains('is-active')).toBe(true)

    options[2]!.click()
    await nextTick()

    expect(current.value).toBe('high')
    expect(onChange).toHaveBeenCalledWith('high', LEVELS[2])
    expect(trigger.textContent).toContain('高')

    app.unmount()
    host.remove()
  })

  it('disabled 状态禁止交互', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(UAiReasoningPicker, { levels: LEVELS, disabled: true, placeholder: '深度' })
    })
    app.mount(host)

    const trigger = host.querySelector<HTMLButtonElement>('.u-ai-reasoning-picker__trigger')!
    expect(trigger.disabled).toBe(true)
    expect(trigger.textContent).toContain('深度')
    trigger.click()
    await nextTick()
    expect(document.body.querySelector('.u-ai-reasoning-picker__panel')).toBeFalsy()

    app.unmount()
    host.remove()
  })
})
