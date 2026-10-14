// @vitest-environment happy-dom

import { Workbook } from 'infinitable/sheet'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref, type App } from 'vue'

import { USheet } from '../../../index'
import type { SheetExposed } from '../../../types'

const apps: App[] = []
const containers: HTMLElement[] = []

function mount(props: () => Record<string, unknown>): {
  exposed: { value: SheetExposed | undefined }
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
  return { exposed }
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
})

describe('USheet scrollbar（缺省画布常驻档，boolean 透传）', () => {
  it('缺省 true：画布常驻档下发引擎', async () => {
    const { exposed } = mount(() => ({ workbook: new Workbook(), rows: 10, cols: 6 }))
    await nextTick()

    // 组件缺省 true：引擎归一化为 canvas always + reserve，滚动条常驻画在画布内
    expect(exposed.value!.getGrid()!.getTable().options.scrollbar).toBe(true)
  })

  it('scrollbar: false：整体关闭语义透传', async () => {
    const { exposed } = mount(() => ({
      workbook: new Workbook(),
      rows: 10,
      cols: 6,
      scrollbar: false
    }))
    await nextTick()

    expect(exposed.value!.getGrid()!.getTable().options.scrollbar).toBe(false)
  })

  it('watch 重建：boolean 切换触发网格重建，新配置生效', async () => {
    const state = ref(true)
    const { exposed } = mount(() => ({
      workbook: new Workbook(),
      rows: 10,
      cols: 6,
      scrollbar: state.value
    }))
    await nextTick()

    const gridOn = exposed.value!.getGrid()
    expect(gridOn!.getTable().options.scrollbar).toBe(true)

    // true → false：构造期选项变化 → 重建，整体关闭
    state.value = false
    await nextTick()
    const gridOff = exposed.value!.getGrid()
    expect(gridOff).not.toBe(gridOn)
    expect(gridOff!.getTable().options.scrollbar).toBe(false)

    // false → true：恢复画布常驻档，同样重建
    state.value = true
    await nextTick()
    const gridOnAgain = exposed.value!.getGrid()
    expect(gridOnAgain).not.toBe(gridOff)
    expect(gridOnAgain!.getTable().options.scrollbar).toBe(true)
  })
})
