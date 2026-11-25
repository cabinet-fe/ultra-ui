// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, reactive } from 'vue'

import { UAiStepGroup } from '..'
import type { ChatToolCall, ChatToolMeta } from '../../../chat/types'
import type { AiStepGroupProps, AiStepItem } from '../../../types'

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

function mountStepGroup(
  props: AiStepGroupProps & Record<string, unknown>,
  slots?: Record<string, (scope: any) => any>
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiStepGroup, props, slots) })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UAiStepGroup', () => {
  it('live 走马灯随步骤推进切换当前步骤，落定后展示对应摘要（含 error / aborted）', async () => {
    const call1 = reactive<ChatToolCall>({
      id: 'c1',
      name: 'search',
      arguments: '{"q":"vue"}',
      status: 'running'
    })
    const call2 = reactive<ChatToolCall>({
      id: 'c2',
      name: 'bash',
      arguments: '{"command":"pnpm test"}',
      status: 'pending'
    })
    const steps = reactive<AiStepItem[]>([
      {
        key: 'r1',
        kind: 'reasoning',
        message: {
          id: 'a1',
          role: 'assistant',
          content: '',
          reasoning: '思考A\n思考B',
          status: 'streaming'
        }
      },
      {
        key: 'c1',
        kind: 'tool',
        message: { id: 'a1', role: 'assistant', content: '' },
        toolCall: call1
      },
      {
        key: 'c2',
        kind: 'tool',
        message: { id: 'a1', role: 'assistant', content: '' },
        toolCall: call2
      }
    ])

    const liveState = reactive({
      live: true,
      endStatus: undefined as 'error' | 'aborted' | undefined
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () =>
        h(UAiStepGroup, {
          steps,
          live: liveState.live,
          endStatus: liveState.endStatus,
          tools: [{ name: 'search', label: '搜索文档' }]
        })
    })
    app.mount(host)

    // 第 1 步仍在思考中
    expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('思考中…')
    expect(host.querySelector('.u-ai-step-group__text')?.textContent).toBe('思考B')
    expect(host.querySelector('.u-ai-step-group__count')?.textContent).toBe('3 步')

    // 思考落定（正文到达），切到第 2 步工具 search
    steps[0]!.message.content = '正文'
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('搜索文档')
    })
    expect(host.querySelector('.u-ai-step-group__text')?.textContent).toBe('vue')

    // 第 2 步完成，切到第 3 步 bash
    call1.status = 'success'
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('bash')
    })
    expect(host.querySelector('.u-ai-step-group__text')?.textContent).toBe('pnpm test')

    // 段落落定：正常 / error / aborted
    liveState.live = false
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group.is-settled')).toBeTruthy()
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 3 个步骤')
    })

    liveState.endStatus = 'error'
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('出错了')
    })
    expect(host.querySelector('.u-ai-step-group__icon.is-danger')).toBeTruthy()

    liveState.endStatus = 'aborted'
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('已停止')
    })

    app.unmount()
    host.remove()
  })

  it('显式 tools 与 toolIcons 映射生效，并转发 respond 与 open-panel 事件', async () => {
    const CustomIcon = defineComponent({
      setup: () => () => h('svg', { class: 'step-custom-icon' })
    })
    const onRespond = vi.fn()
    const onOpenPanel = vi.fn()
    const tools: Record<string, ChatToolMeta> = {
      confirmTool: { name: 'confirmTool', label: '确认操作' },
      panelTool: { name: 'panelTool', label: '侧栏页面', renderTo: 'panel' }
    }
    const steps: AiStepItem[] = [
      {
        key: 's1',
        kind: 'tool',
        message: { id: 'a1', role: 'assistant', content: '' },
        toolCall: {
          id: 'call-confirm',
          name: 'confirmTool',
          arguments: '{}',
          status: 'awaiting-confirm'
        }
      },
      {
        key: 's2',
        kind: 'tool',
        message: { id: 'a1', role: 'assistant', content: '' },
        toolCall: { id: 'call-panel', name: 'panelTool', arguments: '{}', status: 'success' }
      }
    ]

    const { host, unmount } = mountStepGroup({
      steps,
      live: true,
      tools,
      toolIcons: { confirmTool: CustomIcon },
      onRespond,
      onOpenPanel
    })

    // awaiting-confirm 在 live 期自动展开
    expect(host.querySelector('.u-ai-step-group.is-expanded')).toBeTruthy()
    expect(host.querySelector('.step-custom-icon')).toBeTruthy()

    const allowBtn = [
      ...host.querySelectorAll<HTMLElement>('.u-ai-tool-call__confirm button')
    ].find((b) => b.textContent?.includes('允许'))!
    allowBtn.click()
    expect(onRespond).toHaveBeenCalledWith('call-confirm', true)

    // 展开第二个面板工具卡片（因为已 success，展开步骤后其默认折叠需要点开看「查看面板」）
    const headers = host.querySelectorAll<HTMLElement>('.u-ai-tool-call .u-collapse__header')
    headers[1]!.click()
    await nextTick()
    await nextTick()
    host.querySelector<HTMLElement>('.u-ai-tool-call__panel-entry button')!.click()
    expect(onOpenPanel).toHaveBeenCalledWith('call-panel')
    unmount()
  })

  it('支持 #step 与 #default 插槽自定义步骤渲染', () => {
    const steps: AiStepItem[] = [
      {
        key: 'r1',
        kind: 'reasoning',
        message: { id: 'a1', role: 'assistant', content: '', reasoning: 'hi' }
      },
      {
        key: 't1',
        kind: 'tool',
        message: { id: 'a1', role: 'assistant', content: '' },
        toolCall: { id: 'c1', name: 'read', arguments: '{}', status: 'success' }
      }
    ]

    const withStepSlot = mountStepGroup(
      { steps, defaultExpanded: true },
      {
        step: (scope) =>
          h('div', { class: `custom-step-${scope.index}` }, `${scope.step.kind}:${scope.step.key}`)
      }
    )
    expect(withStepSlot.host.querySelector('.custom-step-0')?.textContent).toBe('reasoning:r1')
    expect(withStepSlot.host.querySelector('.custom-step-1')?.textContent).toBe('tool:t1')
    expect(withStepSlot.host.querySelector('.u-ai-tool-call')).toBeFalsy()
    withStepSlot.unmount()

    const withDefaultSlot = mountStepGroup(
      { steps, defaultExpanded: true },
      { default: (scope) => h('div', { class: 'custom-steps-all' }, `total:${scope.steps.length}`) }
    )
    expect(withDefaultSlot.host.querySelector('.custom-steps-all')?.textContent).toBe('total:2')
    withDefaultSlot.unmount()
  })
})
