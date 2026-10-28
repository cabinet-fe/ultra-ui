// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, shallowRef } from 'vue'

import { useTabsBar } from '../use-tabs-bar'

/** 激活项几何注入容器：offset 几何是测量输入，getBoundingClientRect 模拟按压缩放中的视觉矩形 */
function createFakeDom() {
  const state: {
    active:
      | (Pick<HTMLElement, 'offsetLeft' | 'offsetTop' | 'offsetWidth' | 'offsetHeight'> & {
          getBoundingClientRect: () => DOMRect
        })
      | null
  } = { active: null }

  const activeRect = () => {
    const { offsetWidth: w, offsetHeight: hgt, offsetLeft: l, offsetTop: t } = state.active!
    // 视觉矩形带 scale(0.97)：按压中的 getBoundingClientRect 比布局几何小
    return {
      left: l,
      top: t,
      width: w * 0.97,
      height: hgt * 0.97,
      right: l + w * 0.97,
      toJSON: () => ({})
    }
  }

  const setActive = (
    geo: Pick<HTMLElement, 'offsetLeft' | 'offsetTop' | 'offsetWidth' | 'offsetHeight'> | null
  ) => {
    state.active = geo ? { ...geo, getBoundingClientRect: activeRect } : null
  }

  const list = {
    querySelector: (selector: string) => (selector.includes('is-active') ? state.active : null)
  }
  const viewport = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 28 }),
    scrollTo: vi.fn(),
    scrollWidth: 0,
    clientWidth: 0,
    scrollLeft: 0
  }

  return {
    setActive,
    viewportRef: shallowRef(viewport as unknown as HTMLElement),
    listRef: shallowRef(list as unknown as HTMLElement)
  }
}

/** 挂载宿主组件拿到 useTabsBar 返回值（需要 onMounted 等生命周期上下文） */
function setupTabsBar(dom: ReturnType<typeof createFakeDom>) {
  const items = shallowRef([{ key: 'a' }, { key: 'b' }])
  const model = shallowRef<string | undefined>('a')
  let api!: ReturnType<typeof useTabsBar>

  const host = defineComponent({
    setup() {
      api = useTabsBar({ viewportRef: dom.viewportRef, listRef: dom.listRef, items, model })
      return () => h('div')
    }
  })
  createApp(host).mount(document.createElement('div'))

  return { api, model }
}

describe('useTabsBar 指示器', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('按 offset 几何落位，不被 :active 按压缩放污染', async () => {
    const dom = createFakeDom()
    dom.setActive({ offsetLeft: 40, offsetTop: 0, offsetWidth: 100, offsetHeight: 28 })
    const { api } = setupTabsBar(dom)
    await nextTick()
    await nextTick()

    expect(api.indicatorStyle.value).toMatchObject({
      width: '100px',
      height: '28px',
      transform: 'translate(40px, 0px)',
      opacity: '1'
    })
  })

  it('model 切换后即时重测到新几何，不附带过渡', async () => {
    const dom = createFakeDom()
    dom.setActive({ offsetLeft: 40, offsetTop: 0, offsetWidth: 100, offsetHeight: 28 })
    const { api, model } = setupTabsBar(dom)
    await nextTick()
    await nextTick()

    dom.setActive({ offsetLeft: 160, offsetTop: 0, offsetWidth: 80, offsetHeight: 28 })
    model.value = 'b'
    await nextTick()
    await nextTick()

    expect(api.indicatorStyle.value).toMatchObject({
      width: '80px',
      transform: 'translate(160px, 0px)',
      opacity: '1'
    })
    expect(api.indicatorStyle.value.transition).toBeUndefined()
  })

  it('无激活项时隐藏，恢复显示时直接落到新位置', async () => {
    const dom = createFakeDom()
    dom.setActive(null)
    const { api, model } = setupTabsBar(dom)
    await nextTick()
    await nextTick()
    expect(api.indicatorStyle.value.opacity).toBe('0')

    dom.setActive({ offsetLeft: 40, offsetTop: 0, offsetWidth: 100, offsetHeight: 28 })
    model.value = 'b'
    await nextTick()
    await nextTick()

    expect(api.indicatorStyle.value).toMatchObject({
      opacity: '1',
      transform: 'translate(40px, 0px)'
    })
    expect(api.indicatorStyle.value.transition).toBeUndefined()
  })
})
