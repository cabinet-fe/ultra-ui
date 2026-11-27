// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import type { DualNavRootItem } from '../../../types'
import UDualNav from '../dual-nav.vue'

const menus: DualNavRootItem[] = Array.from({ length: 8 }, (_, index) => ({
  title: `应用${index}`,
  path: `/app-${index}`
}))

function mountDualNav(initialPath?: string) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const currentPath = ref(initialPath)

  const app = createApp({
    render() {
      return h(UDualNav, {
        menus,
        currentPath: currentPath.value,
        onItemClick(item: DualNavRootItem) {
          currentPath.value = item.path
        }
      })
    }
  })
  app.mount(host)

  return {
    host,
    currentPath,
    rail: () => host.querySelector<HTMLElement>('.u-dual-nav__rail')!,
    apps: () => [...host.querySelectorAll<HTMLButtonElement>('.u-dual-nav__app')],
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

/** happy-dom 没有布局，按固定行高给左轨和按钮补几何。 */
function stubRailLayout(rail: HTMLElement, apps: HTMLElement[], row = 48) {
  Object.defineProperty(rail, 'clientHeight', { configurable: true, get: () => 200 })
  Object.defineProperty(rail, 'clientWidth', { configurable: true, get: () => 80 })
  apps.forEach((app, index) => {
    Object.defineProperty(app, 'offsetTop', { configurable: true, get: () => index * row })
    Object.defineProperty(app, 'offsetHeight', { configurable: true, get: () => 40 })
    Object.defineProperty(app, 'offsetLeft', { configurable: true, get: () => 8 })
    Object.defineProperty(app, 'offsetWidth', { configurable: true, get: () => 40 })
  })
}

const layoutProps = [
  'offsetTop',
  'offsetHeight',
  'offsetLeft',
  'offsetWidth',
  'clientHeight',
  'clientWidth'
] as const
const layoutDescriptors = new Map<string, PropertyDescriptor | undefined>()

function installPrototypeLayout() {
  for (const key of layoutProps) {
    if (!layoutDescriptors.has(key)) {
      layoutDescriptors.set(key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key))
    }
  }

  const metric = (el: HTMLElement, key: (typeof layoutProps)[number], fallback: number) => {
    const app = el.classList.contains('u-dual-nav__app')
    const rail = el.classList.contains('u-dual-nav__rail')
    if (key === 'clientHeight') return rail ? 200 : fallback
    if (key === 'clientWidth') return rail ? 80 : fallback
    if (!app) return fallback
    if (key === 'offsetHeight' || key === 'offsetWidth') return 40
    if (key === 'offsetLeft') return 8
    const apps = [...(el.parentElement?.querySelectorAll('.u-dual-nav__app') ?? [])]
    return apps.indexOf(el) * 48
  }

  for (const key of layoutProps) {
    const original = layoutDescriptors.get(key)
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get() {
        const fallback = original?.get ? Reflect.apply(original.get, this, []) : 0
        return metric(this, key, Number(fallback) || 0)
      }
    })
  }
}

function restorePrototypeLayout() {
  for (const [key, descriptor] of layoutDescriptors) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor)
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key]
  }
  layoutDescriptors.clear()
}

describe('UDualNav 左轨命中滚动', () => {
  afterEach(restorePrototypeLayout)

  it('currentPath 落到视口外的一级菜单时，把该项滚进左轨', async () => {
    const view = mountDualNav()
    const rail = view.rail()
    stubRailLayout(rail, view.apps())
    rail.scrollTop = 0

    view.currentPath.value = menus[7]!.path
    await nextTick()

    // offsetTop 7 * 48 = 336；336 - 200 / 2 + 40 / 2
    expect(rail.scrollTop).toBe(256)
    view.unmount()
  })

  it('命中项已经完整落在左轨视口内时不滚动', async () => {
    const view = mountDualNav()
    const rail = view.rail()
    stubRailLayout(rail, view.apps())
    rail.scrollTop = 0

    view.currentPath.value = menus[1]!.path
    await nextTick()

    expect(rail.scrollTop).toBe(0)
    view.unmount()
  })

  it('点击左轨激活时不滚动', async () => {
    const view = mountDualNav(menus[0]!.path)
    const rail = view.rail()
    stubRailLayout(rail, view.apps())
    rail.scrollTop = 0

    view.apps()[7]!.click()
    await nextTick()

    expect(view.currentPath.value).toBe(menus[7]!.path)
    expect(rail.scrollTop).toBe(0)
    view.unmount()
  })

  it('初次渲染命中项就在视口外时，挂载后滚入左轨', async () => {
    installPrototypeLayout()
    const view = mountDualNav(menus[7]!.path)
    await nextTick()

    expect(view.rail().scrollTop).toBe(256)
    view.unmount()
  })
})
