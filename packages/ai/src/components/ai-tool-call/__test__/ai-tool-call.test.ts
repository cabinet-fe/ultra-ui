// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, reactive, type PropType } from 'vue'

import { UAiToolCall } from '..'
import type { ChatToolCall, ChatToolMeta } from '../../../chat/types'
import type { AiToolCallProps } from '../../../types'

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

function mountToolCall(
  props: AiToolCallProps & Record<string, unknown>,
  slots?: Record<string, (scope: any) => any>
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiToolCall, props, slots) })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UAiToolCall', () => {
  it('无 DI 下传入 tool 与 toolIcons 正确解析标题、图标与通用数据块', async () => {
    const OverrideIcon = defineComponent({
      setup: () => () => h('svg', { class: 'icon-override' })
    })
    const MetaIcon = defineComponent({ setup: () => () => h('svg', { class: 'icon-meta' }) })

    // 1. 仅 toolIcons 覆写 + 通用 <pre> 展示多字段参数 / 结果 / view
    const m1 = mountToolCall({
      toolCall: {
        id: 't1',
        name: 'custom_exec',
        arguments: '{"cmd":"ls","cwd":"/app"}',
        result: '{"files":["a.ts"]}',
        view: { kind: 'text', text: 'view-output' },
        status: 'success'
      },
      toolIcons: { custom_exec: OverrideIcon },
      defaultExpanded: true
    })
    expect(m1.host.querySelector('.icon-override')).toBeTruthy()
    expect(m1.host.querySelector('.u-ai-tool-call__name')?.textContent).toBe('custom_exec')
    expect(m1.host.querySelector('.u-ai-tool-call__summary')?.textContent).toBe('ls')
    expect(m1.host.querySelector('.u-ai-tool-call.is-active')).toBeTruthy()

    const blocks = [...m1.host.querySelectorAll('.u-ai-tool-call__data')].map(
      (el) => el.textContent
    )
    expect(blocks).toEqual([
      '{"cmd":"ls","cwd":"/app"}',
      '{"files":["a.ts"]}',
      '{"kind":"text","text":"view-output"}'
    ])
    m1.unmount()

    // 2. tool.icon 优先于 toolIcons，且单标量参数已在头部摘要覆盖时省略参数块
    const call = reactive<ChatToolCall>({
      id: 't2',
      name: 'custom_exec',
      arguments: '{"cmd":"pwd"}',
      error: 'permission denied',
      status: 'error'
    })
    const m2 = mountToolCall({
      toolCall: call,
      tool: { name: 'custom_exec', label: '执行命令', icon: MetaIcon },
      toolIcons: { custom_exec: OverrideIcon },
      defaultExpanded: false
    })
    expect(m2.host.querySelector('.icon-meta')).toBeTruthy()
    expect(m2.host.querySelector('.icon-override')).toBeFalsy()
    expect(m2.host.querySelector('.u-ai-tool-call__name')?.textContent).toBe('执行命令')
    expect(m2.host.querySelector('.u-ai-tool-call.is-active')).toBeFalsy()

    m2.host.querySelector<HTMLElement>('.u-collapse__header')!.click()
    await nextTick()
    await nextTick()
    const errorBlocks = m2.host.querySelectorAll('.u-ai-tool-call__data')
    expect(errorBlocks).toHaveLength(1)
    expect(errorBlocks[0]?.classList.contains('is-error')).toBe(true)
    expect(errorBlocks[0]?.textContent).toBe('permission denied')
    m2.unmount()
  })

  it('支持 #header-extra 与 #default 插槽', async () => {
    const CustomRender = defineComponent({
      props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
      setup: (props) => () => h('div', { class: 'tool-meta-render' }, props.toolCall.name)
    })
    const { host, unmount } = mountToolCall(
      {
        toolCall: { id: 't1', name: 'search', arguments: '{}', status: 'running' },
        tool: { name: 'search', render: CustomRender }
      },
      {
        'header-extra': (scope) => h('span', { class: 'extra-badge' }, scope.toolCall.status),
        default: (scope) => h('div', { class: 'slot-body' }, `custom:${scope.toolCall.id}`)
      }
    )

    expect(host.querySelector('.extra-badge')?.textContent).toBe('running')
    // 进行中且存在自定义默认插槽时自动展开
    expect(host.querySelector('.u-ai-tool-call.is-active')).toBeTruthy()
    expect(host.querySelector('.slot-body')?.textContent).toBe('custom:t1')
    expect(host.querySelector('.tool-meta-render')).toBeFalsy()
    unmount()
  })

  it('awaiting-confirm 触发 respond(approved) 且不误触折叠', async () => {
    const onRespond = vi.fn()
    const { host, unmount } = mountToolCall({
      toolCall: {
        id: 't1',
        name: 'bash',
        arguments: '{"command":"rm -rf /tmp/x"}',
        status: 'awaiting-confirm'
      },
      onRespond
    })

    const confirmBtns = [...host.querySelectorAll<HTMLElement>('.u-ai-tool-call__confirm button')]
    expect(confirmBtns).toHaveLength(2)
    confirmBtns[0]!.click()
    expect(onRespond).toHaveBeenCalledWith(true)
    confirmBtns[1]!.click()
    expect(onRespond).toHaveBeenCalledWith(false)
    expect(host.querySelector('.u-ai-tool-call.is-active')).toBeFalsy()
    unmount()
  })

  it('renderTo: panel 时 body 展示查看面板入口并触发 open-panel 事件', async () => {
    const onOpenPanel = vi.fn()
    const tool: ChatToolMeta = { name: 'openPage', label: '页面预览', renderTo: 'panel' }
    const { host, unmount } = mountToolCall({
      toolCall: { id: 'panel-1', name: 'openPage', arguments: '{}', status: 'success' },
      tool,
      defaultExpanded: true,
      onOpenPanel
    })

    const btn = host.querySelector<HTMLElement>('.u-ai-tool-call__panel-entry button')!
    expect(btn.textContent).toContain('查看面板')
    btn.click()
    expect(onOpenPanel).toHaveBeenCalledWith('panel-1')
    unmount()
  })
})
