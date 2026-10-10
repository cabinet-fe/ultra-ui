import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, type App } from 'vue'

import { USheet } from '../../../index'

/** UDropdownStub 的 open 调用 trigger 记录（vi.mock 工厂提升，需 hoisted） */
const dropdownState = vi.hoisted(() => ({
  openTriggers: [] as Array<HTMLElement | null | undefined>
}))

// 只替换 UDropdown 为记录 open 传参的桩（断言锚定 reference），其余 desktop 组件保持真实实现
vi.mock('@veltra/desktop', async (importActual) => {
  const actual = await importActual<Record<string, unknown>>()
  const { defineComponent, h } = await import('vue')
  return {
    ...actual,
    UDropdown: defineComponent({
      name: 'UDropdownStub',
      props: ['visible', 'trigger', 'width'],
      setup(props, { expose, slots }) {
        expose({
          open(config?: { trigger?: HTMLElement }) {
            dropdownState.openTriggers.push(config?.trigger ?? null)
          },
          close() {}
        })
        return () => h('div', { class: 'dropdown-stub' }, props.visible ? slots.content?.() : null)
      }
    })
  }
})

const apps: App[] = []
const containers: HTMLElement[] = []

function mount(props: () => Record<string, unknown> = () => ({})) {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({ render: () => h(USheet, props()) })
  app.mount(el)
  apps.push(app)
  return { el }
}

/** 等待 scheduleOpen 的 setTimeout(0) 宏任务（避免同次事件冒泡误关）+ 渲染 */
async function flushPopup(): Promise<void> {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

/** 聚焦 grid（事件源在实例容器内）派发 Ctrl+F，冒泡到 window 的 onGlobalKeydown */
function pressCtrlF(el: HTMLElement): KeyboardEvent {
  const grid = el.querySelector<HTMLElement>('.u-sheet__grid')!
  const event = new KeyboardEvent('keydown', {
    key: 'f',
    ctrlKey: true,
    bubbles: true,
    cancelable: true
  })
  grid.dispatchEvent(event)
  return event
}

function lastOpenTrigger(): HTMLElement | null | undefined {
  return dropdownState.openTriggers[dropdownState.openTriggers.length - 1]
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
  dropdownState.openTriggers.length = 0
})

describe('Ctrl+F 查找弹窗锚定', () => {
  it('工具栏可见：聚焦 grid 按 Ctrl+F 打开，锚定「查找与替换」按钮（与按钮入口同锚点）；再按关闭', async () => {
    const { el } = mount()
    await nextTick()

    const event = pressCtrlF(el)
    await flushPopup()
    // 拦截浏览器原生查找 + 查找弹层打开
    expect(event.defaultPrevented).toBe(true)
    expect(el.querySelector('.u-sheet__find-input')).not.toBeNull()
    // 锚定 reference 非空且指向工具栏 find 按钮（HTMLElement，与按钮入口完全同锚点）
    const findButton = el.querySelector<HTMLElement>('[data-tool-id="find"]')!
    expect(findButton).not.toBeNull()
    expect(lastOpenTrigger()).toBe(findButton)

    // 再按一次 Ctrl+F：toggle 关闭（不回归）
    pressCtrlF(el)
    await nextTick()
    expect(el.querySelector('.u-sheet__find-input')).toBeNull()
  })

  it('工具栏隐藏（showToolbar=false）：Ctrl+F 锚定回退 sheet 顶部容器（锚点非空且在 sheet 根内）', async () => {
    const { el } = mount(() => ({ showToolbar: false }))
    await nextTick()

    pressCtrlF(el)
    await flushPopup()
    expect(el.querySelector('.u-sheet__find-input')).not.toBeNull()
    // 锚定 reference 非空、指向 sheet 根内元素：工具栏容器（0 高贴 sheet 顶，
    // bottom-start 定位下弹层自 sheet 左上角展开，落在 sheet 视口内而非视口原点）
    const anchor = lastOpenTrigger()
    expect(anchor).toBeInstanceOf(HTMLElement)
    expect(el.contains(anchor as HTMLElement)).toBe(true)
    expect((anchor as HTMLElement).classList.contains('u-sheet__toolbar-wrap')).toBe(true)

    pressCtrlF(el)
    await nextTick()
    expect(el.querySelector('.u-sheet__find-input')).toBeNull()
  })
})
