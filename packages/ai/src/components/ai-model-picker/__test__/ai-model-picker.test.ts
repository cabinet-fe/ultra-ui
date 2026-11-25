// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import { UAiModelPicker } from '..'
import type { ChatModel } from '../../../providers'

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

const MODELS: ChatModel[] = [
  { id: 'gpt-4o', label: 'GPT-4o', description: '通用多模态旗舰模型' },
  { id: 'o3-mini', label: 'o3-mini', description: '轻量推理模型' }
]

describe('UAiModelPicker', () => {
  it('支持 v-model 双向绑定、展示 description 与 change(value, model) 事件', async () => {
    const current = ref<string | undefined>('gpt-4o')
    const onChange = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp({
      render: () =>
        h(UAiModelPicker, {
          models: MODELS,
          modelValue: current.value,
          'onUpdate:modelValue': (val: string | undefined) => {
            current.value = val
          },
          onChange
        })
    })
    app.mount(host)

    const trigger = host.querySelector<HTMLElement>('.u-ai-model-picker__trigger')!
    expect(trigger.textContent).toContain('GPT-4o')

    trigger.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-ai-model-picker__panel')).toBeTruthy()
    })

    const panel = document.body.querySelector('.u-ai-model-picker__panel')!
    const descs = [...panel.querySelectorAll('.u-ai-model-picker__option-desc')].map(
      (el) => el.textContent
    )
    expect(descs).toEqual(['通用多模态旗舰模型', '轻量推理模型'])

    const options = [...panel.querySelectorAll<HTMLElement>('.u-ai-model-picker__option')]
    expect(options[0]?.classList.contains('is-active')).toBe(true)

    options[1]!.querySelector<HTMLElement>('.u-ai-model-picker__option-main')!.click()
    await nextTick()

    expect(current.value).toBe('o3-mini')
    expect(onChange).toHaveBeenCalledWith('o3-mini', MODELS[1])
    expect(trigger.textContent).toContain('o3-mini')

    app.unmount()
    host.remove()
  })

  it('无选中项时展示 placeholder，disabled 状态下禁用触发器', async () => {
    const onChange = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp({
      render: () =>
        h(UAiModelPicker, { models: MODELS, placeholder: '请选择模型', disabled: true, onChange })
    })
    app.mount(host)

    const trigger = host.querySelector<HTMLButtonElement>('.u-ai-model-picker__trigger')!
    expect(trigger.textContent).toContain('请选择模型')
    expect(trigger.disabled).toBe(true)
    expect(trigger.classList.contains('is-disabled')).toBe(true)

    trigger.click()
    await nextTick()
    expect(document.body.querySelector('.u-ai-model-picker__panel')).toBeFalsy()
    expect(onChange).not.toHaveBeenCalled()

    app.unmount()
    host.remove()
  })
})
