// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, onUnmounted, ref, type PropType } from 'vue'

import { UAiSidePanel } from '..'
import type { ChatToolCall, ChatToolMeta } from '../../../chat/types'
import type { AiSidePanelExposed, AiSidePanelProps } from '../../../types'

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

function mountPanel(
  props: AiSidePanelProps & Record<string, unknown>,
  slots?: Record<string, (scope: any) => any>
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const panelRef = ref<AiSidePanelExposed>()
  const app = createApp({ render: () => h(UAiSidePanel, { ref: panelRef, ...props }, slots) })
  app.mount(host)

  return {
    host,
    panel: panelRef,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UAiSidePanel', () => {
  it('toolCall + tool 模式展示动态标题、render 与兜底数据块', () => {
    const CustomIcon = defineComponent({
      setup: () => () => h('svg', { class: 'panel-tool-icon' })
    })
    const PanelView = defineComponent({
      props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
      setup: (props) => () => h('div', { class: 'panel-render-view' }, props.toolCall.result)
    })

    const m1 = mountPanel({
      toolCall: {
        id: 'c1',
        name: 'preview',
        arguments: '{}',
        result: 'ok-body',
        status: 'success'
      },
      tool: {
        name: 'preview',
        panelTitle: (call) => `预览:${call.id}`,
        icon: CustomIcon,
        render: PanelView
      }
    })
    expect(m1.host.querySelector('.u-ai-side-panel__title')?.textContent).toBe('预览:c1')
    expect(m1.host.querySelector('.panel-tool-icon')).toBeTruthy()
    expect(m1.host.querySelector('.panel-render-view')?.textContent).toBe('ok-body')
    m1.unmount()

    // 无 render 兜底展示错误/结果文本
    const m2 = mountPanel({
      toolCall: {
        id: 'c2',
        name: 'rawTool',
        arguments: '{}',
        error: 'panel error',
        status: 'error'
      }
    })
    expect(m2.host.querySelector('.u-ai-side-panel__title')?.textContent).toBe('rawTool')
    const dataBlock = m2.host.querySelector('.u-ai-side-panel__data')!
    expect(dataBlock.classList.contains('is-error')).toBe(true)
    expect(dataBlock.textContent).toBe('panel error')
    m2.unmount()
  })

  it('无 toolCall 纯插槽模式与 #header-actions / 按钮显隐控制', async () => {
    const CustomIcon = defineComponent({ setup: () => () => h('svg', { class: 'slot-mode-icon' }) })
    const onClose = vi.fn()
    const { host, unmount } = mountPanel(
      {
        title: '自定义侧栏',
        icon: CustomIcon,
        refreshable: false,
        fullscreenable: false,
        closable: true,
        onClose
      },
      {
        'header-actions': (scope) =>
          h('button', { type: 'button', class: 'hdr-act' }, `fs:${String(scope.fullscreen)}`),
        default: (scope) => h('div', { class: 'slot-panel-body' }, `key:${scope.refreshKey}`)
      }
    )

    expect(host.querySelector('.u-ai-side-panel__title')?.textContent).toBe('自定义侧栏')
    expect(host.querySelector('.slot-mode-icon')).toBeTruthy()
    expect(host.querySelector('.u-ai-side-panel__refresh')).toBeFalsy()
    expect(host.querySelector('.u-ai-side-panel__fullscreen')).toBeFalsy()
    expect(host.querySelector('.hdr-act')?.textContent).toBe('fs:false')
    expect(host.querySelector('.slot-panel-body')?.textContent).toBe('key:0')

    host.querySelector<HTMLElement>('.u-ai-side-panel__close')!.click()
    expect(onClose).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('支持 v-model:fullscreen 与切换 toolCall 时自动退出全屏', async () => {
    const fullscreen = ref(true)
    const toolCall = ref<ChatToolCall>({
      id: 'c1',
      name: 'doc',
      arguments: '{}',
      status: 'success'
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const panelRef = ref<AiSidePanelExposed>()

    const app = createApp({
      render: () =>
        h(UAiSidePanel, {
          ref: panelRef,
          toolCall: toolCall.value,
          fullscreen: fullscreen.value,
          'onUpdate:fullscreen': (val: boolean) => {
            fullscreen.value = val
          }
        })
    })
    app.mount(host)

    expect(host.querySelector('.u-ai-side-panel.is-fullscreen')).toBeTruthy()
    expect(panelRef.value?.fullscreen).toBe(true)

    host.querySelector<HTMLElement>('.u-ai-side-panel__fullscreen')!.click()
    await nextTick()
    expect(fullscreen.value).toBe(false)
    expect(host.querySelector('.u-ai-side-panel.is-fullscreen')).toBeFalsy()

    fullscreen.value = true
    await nextTick()
    expect(host.querySelector('.u-ai-side-panel.is-fullscreen')).toBeTruthy()

    // 切换聚焦调用 id 自动退出全屏
    toolCall.value = { id: 'c2', name: 'doc', arguments: '{}', status: 'success' }
    await nextTick()
    expect(fullscreen.value).toBe(false)
    expect(host.querySelector('.u-ai-side-panel.is-fullscreen')).toBeFalsy()

    app.unmount()
    host.remove()
  })

  it('点击刷新或调用 refresh() 重建内部组件实例并触发 refresh 事件', async () => {
    let mounts = 0
    let unmounts = 0
    const StatefulBody = defineComponent({
      setup() {
        const no = ++mounts
        onUnmounted(() => {
          unmounts++
        })
        return () => h('div', { class: 'stateful-body' }, `mount:${no}`)
      }
    })
    const onRefresh = vi.fn()
    const tool: ChatToolMeta = { name: 'demo', render: StatefulBody }
    const { host, panel, unmount } = mountPanel({
      toolCall: { id: 'c1', name: 'demo', arguments: '{}', status: 'success' },
      tool,
      onRefresh
    })

    expect(mounts).toBe(1)
    expect(unmounts).toBe(0)
    expect(host.querySelector('.stateful-body')?.textContent).toBe('mount:1')

    host.querySelector<HTMLElement>('.u-ai-side-panel__refresh')!.click()
    await nextTick()
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(mounts).toBe(2)
    expect(unmounts).toBe(1)
    expect(host.querySelector('.stateful-body')?.textContent).toBe('mount:2')

    panel.value?.refresh()
    await nextTick()
    expect(onRefresh).toHaveBeenCalledTimes(2)
    expect(mounts).toBe(3)
    expect(unmounts).toBe(2)
    unmount()
  })
})
