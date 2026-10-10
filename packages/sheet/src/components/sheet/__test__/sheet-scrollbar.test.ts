import { Workbook } from 'infinitable/sheet'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref, type App } from 'vue'

import { USheet } from '../../../index'
import type { SheetExposed } from '../../../types'

const apps: App[] = []
const containers: HTMLElement[] = []

function mount(props: () => Record<string, unknown>): {
  exposed: { value: SheetExposed | undefined }
  el: HTMLElement
} {
  const exposed: { value: SheetExposed | undefined } = { value: undefined }
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({
    render: () =>
      h(USheet, {
        ...props(),
        ref: (value: unknown) => {
          exposed.value = value as SheetExposed | undefined
        }
      })
  })
  app.mount(el)
  apps.push(app)
  return { exposed, el }
}

/** 引擎装配的原生滚动容器（wrapper 带 data-native-scroll 标记，见引擎 NativeScrollbarHost） */
function nativeScrollHost(el: HTMLElement): HTMLElement | null {
  return el.querySelector<HTMLElement>('.u-sheet__grid-instance [data-native-scroll]')
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
})

describe('USheet scrollbar（缺省原生档，全形态透传）', () => {
  it('缺省：原生档配置下发引擎，usesNativeScrollbar 为 true，grid 区装配原生滚动容器', async () => {
    const { exposed, el } = mount(() => ({ workbook: new Workbook(), rows: 10, cols: 6 }))
    await nextTick()

    const table = exposed.value!.getGrid()!.getTable()
    expect(table.options.scrollbar).toEqual({ mode: 'native' })
    expect(table.usesNativeScrollbar).toBe(true)
    // DOM 断言：引擎在挂载容器内装配真实 overflow 滚动容器（scrollbar-gutter: stable）
    expect(nativeScrollHost(el)).not.toBeNull()
  })

  it('scrollbar: false：整体关闭语义不变，无原生滚动容器', async () => {
    const { exposed, el } = mount(() => ({
      workbook: new Workbook(),
      rows: 10,
      cols: 6,
      scrollbar: false
    }))
    await nextTick()

    const table = exposed.value!.getGrid()!.getTable()
    expect(table.options.scrollbar).toBe(false)
    expect(table.usesNativeScrollbar).toBe(false)
    expect(nativeScrollHost(el)).toBeNull()
  })

  it('scrollbar: true：旧语义（画布常驻滚动条）透传，不装配原生容器', async () => {
    const { exposed, el } = mount(() => ({
      workbook: new Workbook(),
      rows: 10,
      cols: 6,
      scrollbar: true
    }))
    await nextTick()

    const table = exposed.value!.getGrid()!.getTable()
    expect(table.options.scrollbar).toBe(true)
    expect(table.usesNativeScrollbar).toBe(false)
    expect(nativeScrollHost(el)).toBeNull()
  })

  it('对象形态按引用透传（mode: canvas 显式回画布档）', async () => {
    const canvasOption = { mode: 'canvas', visibility: 'always' } as const
    const { exposed, el } = mount(() => ({
      workbook: new Workbook(),
      rows: 10,
      cols: 6,
      scrollbar: canvasOption
    }))
    await nextTick()

    const table = exposed.value!.getGrid()!.getTable()
    // 引用透传：引擎收到宿主的同一对象（构造期选项，宿主保持稳定引用即可）
    expect(table.options.scrollbar).toBe(canvasOption)
    expect(table.usesNativeScrollbar).toBe(false)
    expect(nativeScrollHost(el)).toBeNull()
  })

  it('watch 重建：对象引用更替与 boolean 切换都触发网格重建，新配置生效', async () => {
    const state = ref<boolean | Record<string, unknown>>({ mode: 'native' })
    const { exposed, el } = mount(() => ({
      workbook: new Workbook(),
      rows: 10,
      cols: 6,
      scrollbar: state.value
    }))
    await nextTick()

    const gridNative = exposed.value!.getGrid()
    expect(gridNative!.getTable().usesNativeScrollbar).toBe(true)

    // 对象引用更替（native → canvas 常驻）：构造期选项变化 → 重建
    state.value = { mode: 'canvas', visibility: 'always' }
    await nextTick()
    const gridCanvas = exposed.value!.getGrid()
    expect(gridCanvas).not.toBe(gridNative)
    expect(gridCanvas!.getTable().options.scrollbar).toEqual({
      mode: 'canvas',
      visibility: 'always'
    })
    expect(gridCanvas!.getTable().usesNativeScrollbar).toBe(false)
    expect(nativeScrollHost(el)).toBeNull()

    // boolean 切换（canvas → false）：同样重建，整体关闭
    state.value = false
    await nextTick()
    const gridOff = exposed.value!.getGrid()
    expect(gridOff).not.toBe(gridCanvas)
    expect(gridOff!.getTable().options.scrollbar).toBe(false)
    expect(gridOff!.getTable().usesNativeScrollbar).toBe(false)
  })
})
