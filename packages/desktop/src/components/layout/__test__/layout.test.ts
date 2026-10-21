// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, type App } from 'vue'

import ULayout from '../layout.vue'

/** happy-dom 无真实布局，列的几何尺寸全部用桩值喂给组件 */
function mockColumn(el: HTMLElement, offsetLeft: number, width: number) {
  Object.defineProperty(el, 'offsetLeft', { value: offsetLeft, configurable: true })
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true })
  el.getBoundingClientRect = () => ({ width }) as DOMRect
}

function mouseEvent(type: string, clientX: number, clientY = 0, bubbles = false) {
  const e = new MouseEvent(type, { bubbles, button: 0, clientX, clientY })
  // happy-dom 的 MouseEvent 未实现 x / y 别名，而 useDrag 读取 e.x / e.y
  Object.defineProperty(e, 'x', { value: clientX })
  Object.defineProperty(e, 'y', { value: clientY })
  return e
}

function startDrag(resizer: HTMLElement, startX = 100) {
  resizer.dispatchEvent(mouseEvent('mousedown', startX, 0, true))
}

function moveDrag(dx: number, lastX = 100) {
  document.dispatchEvent(mouseEvent('mousemove', lastX + dx))
}

function endDrag() {
  document.dispatchEvent(mouseEvent('mouseup', 0))
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

/** 挂载两列（400px + 300px，最小宽度 200 / 150），列边界桩值与 cols 一致 */
async function mountLayout() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({
    render: () =>
      h(ULayout, { resizable: true, cols: ['400px', '300px'], colMinSizes: [200, 150] }, () => [
        h('div', { class: 'col-a' }),
        h('div', { class: 'col-b' })
      ])
  })
  app.mount(host)

  const container = host.firstElementChild as HTMLElement
  // mount 后同步打桩，抢在 syncResizers 的 nextTick 测量之前
  mockColumn(container.children[0] as HTMLElement, 0, 400)
  mockColumn(container.children[1] as HTMLElement, 410, 300)
  await flush()

  const resizer = container.querySelector<HTMLElement>('.u-layout__resizer')!
  return { app, container, resizer }
}

describe('ULayout resizable', () => {
  let app: App | undefined

  afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('未超限拖拽：两列等量增减，把手跟随交界线', async () => {
    const ctx = await mountLayout()
    app = ctx.app

    startDrag(ctx.resizer)
    moveDrag(50)
    await nextTick()
    expect(ctx.container.style.gridTemplateColumns).toBe('450px 250px')
    expect(ctx.resizer.style.transform).toBe('translate3d(450px, 0, 0)')
    endDrag()
  })

  it('超限拖拽：把手顶在钳制边界，不跟随鼠标穿过它', async () => {
    const ctx = await mountLayout()
    app = ctx.app

    startDrag(ctx.resizer)
    // 右侧余量只有 300 - 150 = 150，多拖 50
    moveDrag(200)
    await nextTick()
    expect(ctx.container.style.gridTemplateColumns).toBe('550px 150px')
    expect(ctx.resizer.style.transform).toBe('translate3d(550px, 0, 0)')
    endDrag()
  })

  it('超限后松手：把手精确落回两列交界线', async () => {
    const ctx = await mountLayout()
    app = ctx.app

    startDrag(ctx.resizer)
    moveDrag(200)
    endDrag()

    // 模拟浏览器重排后真实边界（556）与拖拽期回写值（550）存在舍入差异，
    // 只有 resize-end 的 syncResizers 会按重排结果重新对齐把手
    mockColumn(ctx.container.children[0] as HTMLElement, 0, 556)
    mockColumn(ctx.container.children[1] as HTMLElement, 566, 144)
    await flush()

    expect(ctx.resizer.style.transform).toBe('translate3d(556px, 0, 0)')
  })

  it('再次拖拽：从真实边界起步，上一轮超限不传染脏值', async () => {
    const ctx = await mountLayout()
    app = ctx.app

    // 第一轮向右超限 50 后松手
    startDrag(ctx.resizer)
    moveDrag(200)
    endDrag()
    mockColumn(ctx.container.children[0] as HTMLElement, 0, 550)
    mockColumn(ctx.container.children[1] as HTMLElement, 560, 150)
    await flush()

    // 第二轮向左拖 50（合法范围内）；若把手 offset 残留超限脏值 600，这里会显示 550
    startDrag(ctx.resizer, 300)
    moveDrag(-50, 300)
    await nextTick()
    expect(ctx.container.style.gridTemplateColumns).toBe('500px 200px')
    expect(ctx.resizer.style.transform).toBe('translate3d(500px, 0, 0)')
    endDrag()
  })
})
