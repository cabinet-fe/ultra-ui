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

/**
 * 滚动帧经 requestAnimationFrame 派发（引擎 host.requestFrame）：
 * 等待 n 帧确保 onScrollFrame → growOnNearEdge 已执行
 */
async function nextFrames(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
}

/** 滚动到水平最末端（引擎按内容宽度钳制到 maxLeft，可视缓冲触到当前列数） */
function scrollToLeftEnd(exposed: { value: SheetExposed | undefined }): void {
  exposed.value!.getGrid()!.getTable().setScrollLeft(Number.MAX_SAFE_INTEGER)
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
})

describe('USheet growOnScroll（近边增长开关透传）', () => {
  it('缺省：不传保持引擎缺省（true），滚动触界后模型列数扩容', async () => {
    const { exposed } = mount(() => ({ workbook: new Workbook(), rows: 10, cols: 26 }))
    await nextTick()

    const sheet = exposed.value!.getActiveSheet()
    expect(sheet.cols).toBe(26)

    scrollToLeftEnd(exposed)
    await nextFrames(3)
    // 引擎 growOnNearEdge：可视缓冲触到 26 列 → 模型与引擎同步扩容
    expect(sheet.cols).toBeGreaterThan(26)
  })

  it('growOnScroll: false：固定尺寸网格，滚动触界不扩容', async () => {
    const { exposed } = mount(() => ({
      workbook: new Workbook(),
      rows: 10,
      cols: 26,
      growOnScroll: false
    }))
    await nextTick()

    const sheet = exposed.value!.getActiveSheet()
    scrollToLeftEnd(exposed)
    await nextFrames(3)
    expect(sheet.cols).toBe(26)
  })

  it('watch 重建：切换 growOnScroll 触发网格重建', async () => {
    const state = ref<boolean | undefined>(false)
    const { exposed } = mount(() => ({
      workbook: new Workbook(),
      rows: 10,
      cols: 26,
      growOnScroll: state.value
    }))
    await nextTick()

    const gridFixed = exposed.value!.getGrid()
    state.value = undefined
    await nextTick()
    const gridGrow = exposed.value!.getGrid()
    expect(gridGrow).not.toBe(gridFixed)

    // 重建后的实例恢复引擎缺省（近边增长生效）
    scrollToLeftEnd(exposed)
    await nextFrames(3)
    expect(exposed.value!.getActiveSheet().cols).toBeGreaterThan(26)
  })
})
