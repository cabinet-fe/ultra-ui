import { useConfig } from '@veltra/compositions'
import type { AiProviderConfig } from '@veltra/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick } from 'vue'

import UAiButton from '../ai-button.vue'

const { setConfig } = useConfig()

/** useConfig 的 ai 是模块级全局状态，测后复位避免污染其它用例 */
function resetAiConfig() {
  setConfig({
    ai: {
      url: undefined,
      apiKey: undefined,
      model: undefined,
      reasoningLevel: undefined,
      stream: undefined
    }
  })
}

function provider(overrides: Partial<AiProviderConfig> = {}): Partial<AiProviderConfig> {
  return {
    url: 'https://api.example.com/v1/chat/completions',
    apiKey: 'sk-test',
    model: 'gpt-x',
    ...overrides
  }
}

function jsonResponse(text: string): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { role: 'assistant', content: text } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}

function sseResponse(sse: string): Response {
  return new Response(sse, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function mountAiButton(
  props: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = {}
) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const app = createApp({ render: () => h(UAiButton, props, slots) })
  app.mount(host)

  return {
    host,
    button: host.querySelector('button')!,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

function click(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>, nth = 1): Record<string, any> {
  return JSON.parse(String(fetchMock.mock.calls[nth - 1]![1]!.body))
}

beforeEach(() => {
  // happy-dom 中 offsetWidth/offsetHeight 恒为 0，模拟尺寸供 usePop 定位
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200)

  // usePop 的浮层容器是模块级单例，上一个用例清空 body 后需补回 teleport 目标
  if (!document.getElementById('pop-container')) {
    const popContainer = document.createElement('div')
    popContainer.id = 'pop-container'
    document.body.appendChild(popContainer)
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetAiConfig()
  document.body.innerHTML = ''
})

describe('UAiButton 普通变体', () => {
  it('点击按 OpenAI 兼容协议 POST 配置 url，请求体组装 model/stream/messages，成功触发 success 完整文本', async () => {
    const fetchMock = vi.fn(async () => jsonResponse('完整答案'))
    vi.stubGlobal('fetch', fetchMock)
    const onSuccess = vi.fn()
    const onError = vi.fn()

    const { button, unmount } = mountAiButton({
      provider: provider({ model: 'gpt-x' }),
      systemPrompt: 'sys',
      prompt: 'hi',
      onSuccess,
      onError
    })

    try {
      click(button)
      await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith('完整答案'))
      expect(onError).not.toHaveBeenCalled()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0]![0]).toBe('https://api.example.com/v1/chat/completions')
      expect(requestBody(fetchMock)).toMatchObject({
        model: 'gpt-x',
        stream: false,
        messages: [
          { role: 'system', content: 'sys' },
          { role: 'user', content: 'hi' }
        ]
      })
    } finally {
      unmount()
    }
  })

  it('流式：增量逐段触发 delta，结束后 success 为拼接完整文本', async () => {
    const sse =
      'data: {"choices":[{"delta":{"content":"He"}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"llo"}}]}\n\n' +
      'data: [DONE]\n\n'
    const fetchMock = vi.fn(async () => sseResponse(sse))
    vi.stubGlobal('fetch', fetchMock)
    const onDelta = vi.fn()
    const onSuccess = vi.fn()

    const { button, unmount } = mountAiButton({
      provider: provider({ stream: true }),
      prompt: 'hi',
      onDelta,
      onSuccess
    })

    try {
      click(button)
      await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled())

      expect(onDelta).toHaveBeenNthCalledWith(1, 'He')
      expect(onDelta).toHaveBeenNthCalledWith(2, 'llo')
      expect(onSuccess).toHaveBeenCalledWith('Hello')
      expect(requestBody(fetchMock).stream).toBe(true)
    } finally {
      unmount()
    }
  })

  it('失败触发 error（Error 载荷），不触发 success', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('network down'))
        .mockResolvedValueOnce(new Response('boom', { status: 500 }))
    )
    const onSuccess = vi.fn()
    const onError = vi.fn()

    const { button, unmount } = mountAiButton({
      provider: provider(),
      prompt: 'hi',
      onSuccess,
      onError
    })

    try {
      click(button)
      await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
      expect(onError).toHaveBeenNthCalledWith(1, expect.any(Error))

      click(button)
      await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(2))
      expect(onSuccess).not.toHaveBeenCalled()
    } finally {
      unmount()
    }
  })

  it('生成中按钮 loading 并忽略重复点击，结束后恢复可点', async () => {
    const pending = deferred<Response>()
    const fetchMock = vi.fn(() => pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    const onSuccess = vi.fn()

    const { button, unmount } = mountAiButton({ provider: provider(), prompt: 'hi', onSuccess })

    try {
      click(button)
      await nextTick()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(button.classList.contains('is-loading')).toBe(true)

      click(button)
      click(button)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      pending.resolve(jsonResponse('ok'))
      await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith('ok'))
      await nextTick()
      expect(button.classList.contains('is-loading')).toBe(false)

      click(button)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally {
      unmount()
    }
  })
})

describe('UAiButton 配置优先级', () => {
  it('实例 provider 字段 > 全局 ai 字段 > 默认值（stream 缺省 false）', async () => {
    setConfig({
      ai: {
        url: 'https://global.example.com/v1/chat/completions',
        apiKey: 'sk-global',
        model: 'g-global'
      }
    })
    const fetchMock = vi.fn(async () => jsonResponse('ok'))
    vi.stubGlobal('fetch', fetchMock)
    const onSuccess = vi.fn()

    // 组件 A：无 provider，全量走全局配置
    const a = mountAiButton({ prompt: 'a', onSuccess })
    // 组件 B：共用全局配置，仅实例覆盖 model 并开流式
    const sse = 'data: {"choices":[{"delta":{"content":"B"}}]}\n\ndata: [DONE]\n\n'
    fetchMock.mockResolvedValueOnce(jsonResponse('ok')).mockResolvedValueOnce(sseResponse(sse))
    const onDelta = vi.fn()
    const b = mountAiButton({
      prompt: 'b',
      provider: { model: 'g-instance', stream: true },
      onDelta,
      onSuccess
    })

    try {
      click(a.button)
      await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
      click(b.button)
      await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(2))

      const bodyA = requestBody(fetchMock, 1)
      expect(fetchMock.mock.calls[0]![0]).toBe('https://global.example.com/v1/chat/completions')
      expect(bodyA.model).toBe('g-global')
      expect(bodyA.stream).toBe(false)
      expect(fetchMock.mock.calls[0]![1]!.headers).toMatchObject({
        Authorization: 'Bearer sk-global'
      })

      const bodyB = requestBody(fetchMock, 2)
      expect(bodyB.model).toBe('g-instance')
      expect(bodyB.stream).toBe(true)
      expect(onDelta).toHaveBeenCalledWith('B')
    } finally {
      a.unmount()
      b.unmount()
    }
  })

  it('无全局配置时仅实例 provider 也可用，stream 默认 false', async () => {
    const fetchMock = vi.fn(async () => jsonResponse('ok'))
    vi.stubGlobal('fetch', fetchMock)
    const onSuccess = vi.fn()

    const { button, unmount } = mountAiButton({ prompt: 'hi', provider: provider(), onSuccess })

    try {
      click(button)
      await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled())
      expect(requestBody(fetchMock).stream).toBe(false)
    } finally {
      unmount()
    }
  })
})

describe('UAiButton pre-input 变体', () => {
  function findBubble() {
    return document.body.querySelector<HTMLElement>('.u-ai-button__main')
  }

  function findActionButtons(): HTMLButtonElement[] {
    return Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('.u-ai-button__action button')
    )
  }

  function mountPreInput(extra: Record<string, unknown> = {}) {
    return mountAiButton(
      { variant: 'pre-input', prompt: 'hi', provider: provider(), ...extra },
      { 'pre-input': () => h('div', { class: 'pre-slot' }, '补充输入') }
    )
  }

  /** 等待 usePop 打开气泡时的异步定位（含 resize 触发的一轮）落地，避免关闭后回调访问已销毁元素 */
  async function openBubble(button: HTMLButtonElement) {
    click(button)
    await nextTick()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  it('点击展开气泡：#pre-input 插槽与内置确认/取消按钮', async () => {
    const { button, unmount } = mountPreInput()

    try {
      await openBubble(button)

      expect(findBubble()).not.toBeNull()
      expect(document.body.querySelector('.pre-slot')?.textContent).toBe('补充输入')
      expect(findActionButtons().map((b) => b.textContent?.trim())).toEqual(['取消', '确认'])
    } finally {
      unmount()
    }
  })

  it('点击按钮本身不发请求，确认后关闭气泡并发起请求', async () => {
    const fetchMock = vi.fn(async () => jsonResponse('ok'))
    vi.stubGlobal('fetch', fetchMock)
    const onConfirm = vi.fn()
    const onSuccess = vi.fn()

    const { button, unmount } = mountPreInput({ onConfirm, onSuccess })

    try {
      await openBubble(button)
      expect(fetchMock).not.toHaveBeenCalled()

      click(findActionButtons()[1]!)
      expect(onConfirm).toHaveBeenCalledTimes(1)
      await vi.waitFor(() => expect(findBubble()).toBeNull())
      await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith('ok'))
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      unmount()
    }
  })

  it('取消后关闭气泡且不发请求', async () => {
    const fetchMock = vi.fn(async () => jsonResponse('ok'))
    vi.stubGlobal('fetch', fetchMock)
    const onCancel = vi.fn()
    const onSuccess = vi.fn()

    const { button, unmount } = mountPreInput({ onCancel, onSuccess })

    try {
      await openBubble(button)

      click(findActionButtons()[0]!)
      expect(onCancel).toHaveBeenCalledTimes(1)
      await vi.waitFor(() => expect(findBubble()).toBeNull())
      expect(fetchMock).not.toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()
    } finally {
      unmount()
    }
  })
})
