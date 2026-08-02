import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'

import { Workbook } from '../../core/workbook'
import { USheet } from '../../index'
import { registerTool, unregisterTool } from '../../tools/registry'
import type { SheetExposed } from '../../types'

const apps: App[] = []
const containers: HTMLElement[] = []

function mount(
  props: () => Record<string, unknown> = () => ({}),
  exposedRef?: { value: SheetExposed | undefined }
) {
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
          if (exposedRef) exposedRef.value = value as SheetExposed | undefined
        }
      })
  })
  app.mount(el)
  apps.push(app)
  return { app, el }
}

function createWorkbook() {
  const workbook = new Workbook()
  workbook.addSheet('Sheet2')
  return workbook
}

function toolButton(el: HTMLElement, title: string): HTMLButtonElement | undefined {
  return [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__tool')].find((button) =>
    button.textContent?.includes(title)
  )
}

function tabs(el: HTMLElement): HTMLButtonElement[] {
  return [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__tab')]
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
})

describe('USheet 组件', () => {
  it('挂载：工具栏渲染内置工具（分组 + 分隔符），tabs 显示 sheet 列表，grid 挂载', async () => {
    const { el } = mount(() => ({ workbook: createWorkbook(), rows: 10, cols: 6 }))
    await nextTick()

    const tools = [...el.querySelectorAll('.u-sheet__tool')].map((button) =>
      button.textContent?.trim()
    )
    expect(tools).toEqual(['撤销', '重做', '合并', '取消合并'])
    // history 与 cell 两组之间一个分隔符
    expect(el.querySelectorAll('.u-sheet__toolbar-divider')).toHaveLength(1)

    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1', 'Sheet2'])
    expect(tabs(el)[0]!.classList.contains('is-active')).toBe(true)

    // VTable 已挂载到 grid 容器
    expect(el.querySelector('.u-sheet__grid canvas')).not.toBeNull()
  })

  it('内置 undo/redo 按钮随 history-change 置灰，点击等效快捷键', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const undoButton = toolButton(el, '撤销')!
    const redoButton = toolButton(el, '重做')!
    expect(undoButton.disabled).toBe(true)
    expect(redoButton.disabled).toBe(true)

    sheet.setCellValue({ row: 0, col: 0 }, 'x')
    await nextTick()
    expect(undoButton.disabled).toBe(false)
    expect(redoButton.disabled).toBe(true)

    undoButton.click()
    await nextTick()
    expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(undoButton.disabled).toBe(true)
    expect(redoButton.disabled).toBe(false)

    redoButton.click()
    await nextTick()
    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 'x', t: 's' })
  })

  it('tab 切换：active 样式移动，工具上下文指向当前 sheet', async () => {
    const workbook = createWorkbook()
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }), exposed)
    await nextTick()

    expect(exposed.value?.getActiveSheet().name).toBe('Sheet1')
    expect(exposed.value?.getContext().sheetName).toBe('Sheet1')

    tabs(el)[1]!.click()
    await nextTick()

    expect(tabs(el)[1]!.classList.contains('is-active')).toBe(true)
    // grid 重建：旧 VTable 已 release，容器内只有一个 canvas
    expect(el.querySelectorAll('.u-sheet__grid canvas')).toHaveLength(1)
    expect(exposed.value?.getActiveSheet().name).toBe('Sheet2')
    // 工具上下文（与工具按钮同一门面）指向切换后的 sheet
    expect(exposed.value?.getContext().sheetName).toBe('Sheet2')

    // grid 已重建到 Sheet2：写入 Sheet2 应在表格可见
    workbook.getSheet('Sheet2')!.setCellValue({ row: 0, col: 0 }, 's2')
    await nextTick()
    expect(exposed.value?.getGrid()?.getTable().getCellValue(1, 1)).toBe('s2')
  })

  it('props 变更响应：showToolbar/showTabs 显隐，rows 变化重建 grid', async () => {
    const workbook = createWorkbook()
    const state = ref({ rows: 10, showToolbar: true, showTabs: true })
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(
      () => ({
        workbook,
        rows: state.value.rows,
        cols: 6,
        showToolbar: state.value.showToolbar,
        showTabs: state.value.showTabs
      }),
      exposed
    )
    await nextTick()

    const gridBefore = exposed.value?.getGrid()
    expect(gridBefore).toBeDefined()

    state.value = { ...state.value, showToolbar: false, showTabs: false }
    await nextTick()
    expect(el.querySelector('.u-sheet__toolbar')).toBeNull()
    expect(el.querySelector('.u-sheet__tabs')).toBeNull()

    state.value = { ...state.value, rows: 20 }
    await nextTick()
    const gridAfter = exposed.value?.getGrid()
    expect(gridAfter).toBeDefined()
    expect(gridAfter).not.toBe(gridBefore)
  })

  it('workbook prop 变更：tabs 与 grid 切到新工作簿', async () => {
    const workbook1 = createWorkbook()
    const workbook2 = new Workbook()
    workbook2.addSheet('数据表')
    const current = ref(workbook1)
    const { el } = mount(() => ({ workbook: current.value, rows: 10, cols: 6 }))
    await nextTick()
    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1', 'Sheet2'])

    current.value = workbook2
    await nextTick()
    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1', '数据表'])
    expect(el.querySelector('.u-sheet__grid canvas')).not.toBeNull()
  })

  it('注册表联动：运行时 register/unregister 工具即时增删按钮', async () => {
    const { el } = mount(() => ({ workbook: createWorkbook(), rows: 10, cols: 6 }))
    await nextTick()
    expect(toolButton(el, '临时工具')).toBeUndefined()

    registerTool({ id: 'temp-tool', title: '临时工具', onClick: () => {} })
    await nextTick()
    expect(toolButton(el, '临时工具')).toBeDefined()

    expect(unregisterTool('temp-tool')).toBe(true)
    await nextTick()
    expect(toolButton(el, '临时工具')).toBeUndefined()
  })

  it('无 props 默认挂载：内部自建工作簿（单 sheet），工具栏/tabs 正常', async () => {
    const { el } = mount()
    await nextTick()
    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1'])
    expect(el.querySelectorAll('.u-sheet__tool').length).toBeGreaterThan(0)
    expect(el.querySelector('.u-sheet__grid canvas')).not.toBeNull()
  })

  it('多实例并存：共享注册表，工具点击只作用于各自实例的活动 sheet', async () => {
    const workbook1 = new Workbook()
    const workbook2 = new Workbook()
    const first = mount(() => ({ workbook: workbook1, rows: 10, cols: 6 }))
    const second = mount(() => ({ workbook: workbook2, rows: 10, cols: 6 }))
    await nextTick()

    registerTool({
      id: 'mark-active',
      title: '标记当前格',
      onClick: (ctx) => {
        const active = ctx.getSelection().activeCell ?? { row: 0, col: 0 }
        ctx.setCellValue(active, 'marked')
      }
    })
    await nextTick()

    // 两个实例都渲染该工具（注册表全局共享）
    const button1 = toolButton(first.el, '标记当前格')
    const button2 = toolButton(second.el, '标记当前格')
    expect(button1).toBeDefined()
    expect(button2).toBeDefined()

    // 点击实例 2 的工具 → 只写实例 2 的 sheet（各自 SheetContext 绑定各自工作簿）
    workbook2.activeSheet.selectCell({ row: 2, col: 1 })
    await nextTick()
    button2!.click()
    await nextTick()
    expect(workbook2.activeSheet.getCellData({ row: 2, col: 1 })).toEqual({ v: 'marked', t: 's' })
    expect(workbook1.activeSheet.getCellData({ row: 2, col: 1 })).toBeUndefined()

    // 该写入经命令系统：实例 2 的 undo 可用且可撤销
    expect(workbook2.activeSheet.canUndo).toBe(true)
    workbook2.activeSheet.undo()
    expect(workbook2.activeSheet.getCellData({ row: 2, col: 1 })).toBeUndefined()

    unregisterTool('mark-active')
  })

  it('合并/取消合并按钮随选区联动，点击生效且可 undo', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const mergeButton = toolButton(el, '合并')!
    const unmergeButton = toolButton(el, '取消合并')!
    // 无选区：两者禁用
    expect(mergeButton.disabled).toBe(true)
    expect(unmergeButton.disabled).toBe(true)

    // 拖选区域（经模型 API 模拟 grid 拖选回写）
    sheet.selectRange({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })
    await nextTick()
    expect(mergeButton.disabled).toBe(false)

    mergeButton.click()
    await nextTick()
    expect(sheet.getCellInfo({ row: 1, col: 1 }).kind).toBe('merged-covered')

    // 选中合并锚点 → 取消合并可用
    sheet.selectCell({ row: 0, col: 0 })
    await nextTick()
    expect(unmergeButton.disabled).toBe(false)

    unmergeButton.click()
    await nextTick()
    expect(sheet.getCellInfo({ row: 1, col: 1 }).kind).toBe('normal')

    sheet.undo()
    expect(sheet.getCellInfo({ row: 1, col: 1 }).kind).toBe('merged-covered')
  })
})
